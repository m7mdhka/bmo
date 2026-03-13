"use client";

/**
 * PreviewBridge — runs on every page inside the preview iframe.
 *
 * Responsibilities:
 *  • Listens for postMessage commands from the parent IDE frame.
 *  • Initialises / shows / hides Eruda DevTools.
 *  • Tracks the eruda panel height with a MutationObserver and writes it to
 *    the CSS custom property --bmo-eruda-height on :root so that any page
 *    can shrink its content area without coupling to React state.
 *  • Reports client-side navigation events back to the parent.
 *
 * When NOT in an iframe (direct browser visit) the component renders nothing
 * and has no side-effects.
 */

import { useEffect } from "react";

type InboundMessage =
  | { type: "bmo:preview:set-devtools"; enabled: boolean }
  | { type: "bmo:preview:ping" };

type ErudaApi = {
  init: (opts?: {
    tool?: string[];
    useShadowDom?: boolean;
    defaults?: { theme?: string; transparency?: number; displaySize?: number };
  }) => void;
  destroy?: () => void;
  show?: () => void;
  hide?: () => void;
  get?: (name: string) => unknown;
};

const ERUDA_VERSION = "v6";
const DEFAULT_DISPLAY_SIZE = 40; // percent of viewport height

function currentPath() {
  return window.location.pathname + window.location.search + window.location.hash;
}

function isInIframe() {
  try {
    return window.self !== window.top;
  } catch {
    return true; // cross-origin access throws → definitely in an iframe
  }
}

// Walk .eruda-container's subtree looking for the first inline height:X% style.
// Eruda's _setDisplaySize sets this whenever the panel size changes.
function readErudaDisplaySize(): number {
  const container = document.querySelector<HTMLElement>(".eruda-container");
  if (!container) return DEFAULT_DISPLAY_SIZE;

  if (container.style.height?.includes("%")) {
    const n = parseFloat(container.style.height);
    if (n >= 10 && n <= 100) return n;
  }

  for (const el of Array.from(container.querySelectorAll<HTMLElement>("[style]"))) {
    const h = el.style.height;
    if (h?.includes("%")) {
      const n = parseFloat(h);
      if (n >= 10 && n <= 100) return n;
    }
  }

  return DEFAULT_DISPLAY_SIZE;
}

function setErudaHeightVar(px: number) {
  document.documentElement.style.setProperty("--bmo-eruda-height", `${px}px`);
}

export function PreviewBridge() {
  useEffect(() => {
    // Only activate when running inside the preview iframe.
    if (!isInIframe()) return;

    const parentOrigin = window.location.origin;
    let devtoolsEnabled = false;
    let mo: MutationObserver | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    // ── Eruda height tracking ───────────────────────────────────────────────

    function applyDisplaySize(pct: number) {
      if (!cancelled) setErudaHeightVar((pct / 100) * window.innerHeight);
    }

    function attachMutationObserver() {
      if (cancelled) return;
      const container = document.querySelector<HTMLElement>(".eruda-container");
      if (!container) {
        retryTimer = setTimeout(attachMutationObserver, 100);
        return;
      }

      applyDisplaySize(readErudaDisplaySize());

      mo = new MutationObserver((mutations) => {
        if (cancelled) return;
        for (const mut of mutations) {
          if (mut.type === "attributes" && mut.attributeName === "style") {
            const el = mut.target as HTMLElement;
            const h = el.style.height;
            if (h?.includes("%")) {
              const pct = parseFloat(h);
              if (!isNaN(pct) && pct >= 10 && pct <= 100) {
                applyDisplaySize(pct);
                break;
              }
            }
          }
        }
      });

      mo.observe(container, { attributes: true, attributeFilter: ["style"], subtree: true });
    }

    // ── Eruda lifecycle ─────────────────────────────────────────────────────

    async function enableEruda() {
      const w = window as unknown as { __bmoEruda?: ErudaApi; __bmoErudaVer?: string };

      if (!w.__bmoEruda) {
        const mod = await import("eruda");
        if (cancelled) return;
        w.__bmoEruda = mod.default as unknown as ErudaApi;
      }

      if (w.__bmoErudaVer !== ERUDA_VERSION) {
        try { w.__bmoEruda?.destroy?.(); } catch { /* ignore */ }
        try {
          w.__bmoEruda?.init?.({
            tool: ["console", "elements", "network", "resources", "sources"],
            useShadowDom: false,
            defaults: {
              theme: "Monokai Pro",
              transparency: 1,
              displaySize: DEFAULT_DISPLAY_SIZE,
            },
          });
        } catch { /* ignore */ }
        w.__bmoErudaVer = ERUDA_VERSION;
      }

      if (cancelled) return;
      w.__bmoEruda?.show?.();

      try {
        const entry = w.__bmoEruda?.get?.("entryBtn") as { hide?: () => void } | undefined;
        entry?.hide?.();
      } catch { /* ignore */ }

      requestAnimationFrame(() => { if (!cancelled) attachMutationObserver(); });
    }

    function disableEruda() {
      const w = window as unknown as { __bmoEruda?: { hide?: () => void } };
      try { w.__bmoEruda?.hide?.(); } catch { /* ignore */ }
      mo?.disconnect();
      mo = null;
      setErudaHeightVar(0);
    }

    // ── Navigation reporting ────────────────────────────────────────────────

    const notify = () => {
      window.parent?.postMessage({ type: "bmo:preview:navigate", url: currentPath() }, parentOrigin);
    };

    const onPop = () => notify();
    window.addEventListener("popstate", onPop);

    const originalPush = history.pushState.bind(history);
    const originalReplace = history.replaceState.bind(history);

    type PushArgs = Parameters<History["pushState"]>;
    type ReplaceArgs = Parameters<History["replaceState"]>;

    history.pushState = ((...args: PushArgs) => { originalPush(...args); notify(); }) as History["pushState"];
    history.replaceState = ((...args: ReplaceArgs) => { originalReplace(...args); notify(); }) as History["replaceState"];

    notify();

    // ── Message bridge ──────────────────────────────────────────────────────

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== parentOrigin) return;
      const data = event.data as InboundMessage | undefined;
      if (!data || typeof data !== "object") return;

      if (data.type === "bmo:preview:set-devtools") {
        devtoolsEnabled = Boolean(data.enabled);
        if (devtoolsEnabled) void enableEruda();
        else disableEruda();
      }

      if (data.type === "bmo:preview:ping") {
        window.parent?.postMessage({ type: "bmo:preview:pong" }, parentOrigin);
      }
    };

    window.addEventListener("message", onMessage);

    return () => {
      cancelled = true;
      if (retryTimer !== null) clearTimeout(retryTimer);
      mo?.disconnect();
      window.removeEventListener("message", onMessage);
      window.removeEventListener("popstate", onPop);
      history.pushState = originalPush;
      history.replaceState = originalReplace;
      setErudaHeightVar(0);
    };
  }, []);

  return null; // purely side-effect component
}
