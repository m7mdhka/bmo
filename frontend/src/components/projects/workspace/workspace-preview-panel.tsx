"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Bug, ExternalLink, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";

function defaultPreviewPath(projectId: string) {
  return `/preview/${encodeURIComponent(projectId)}`;
}

function normalizeInternalPath(input: string) {
  const raw = input.trim();
  if (!raw) return null;

  // Workspace preview is for your app routes; keep it internal-only.
  // Ensure the value always becomes an absolute path like "/foo?bar#baz".
  const withSlash = raw.startsWith("/") ? raw : `/${raw.replace(/^\/+/, "")}`;
  try {
    const u = new URL(withSlash, window.location.origin);
    return u.pathname + u.search + u.hash;
  } catch {
    return null;
  }
}

export function WorkspacePreviewPanel({ projectId }: { projectId: string }) {
  const initial = useMemo(() => defaultPreviewPath(projectId), [projectId]);

  const [nav, setNav] = useState<{ entries: string[]; index: number }>(() => ({
    entries: [initial],
    index: 0,
  }));

  const currentUrl = nav.entries[nav.index] ?? initial;
  const [addressDraft, setAddressDraft] = useState(currentUrl);
  const [devtools, setDevtools] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const iframeWin = iframeRef.current?.contentWindow;
      if (!iframeWin) return;
      if (event.source !== iframeWin) return;
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: unknown; url?: unknown } | undefined;
      if (!data || typeof data !== "object") return;
      if (data.type === "bmo:preview:navigate" && typeof data.url === "string") {
        const nextUrl = data.url;
        setNav((prev) => {
          const cur = prev.entries[prev.index];
          if (cur === nextUrl) return prev;
          const trimmed = prev.entries.slice(0, prev.index + 1);
          return { entries: [...trimmed, nextUrl], index: trimmed.length };
        });
        setAddressDraft(nextUrl);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  function safeWin() {
    try {
      return iframeRef.current?.contentWindow ?? null;
    } catch {
      return null;
    }
  }

  function back() {
    setNav((prev) => {
      if (prev.index <= 0) return prev;
      const nextIndex = prev.index - 1;
      const nextUrl = prev.entries[nextIndex]!;
      setAddressDraft(nextUrl);
      // Use src navigation rather than history.back() so it never affects the parent.
      if (iframeRef.current) iframeRef.current.src = nextUrl;
      return { ...prev, index: nextIndex };
    });
  }

  function forward() {
    setNav((prev) => {
      if (prev.index >= prev.entries.length - 1) return prev;
      const nextIndex = prev.index + 1;
      const nextUrl = prev.entries[nextIndex]!;
      setAddressDraft(nextUrl);
      if (iframeRef.current) iframeRef.current.src = nextUrl;
      return { ...prev, index: nextIndex };
    });
  }

  function reload() {
    if (iframeRef.current) iframeRef.current.src = currentUrl;
  }

  function openExternal() {
    window.open(currentUrl, "_blank", "noopener,noreferrer");
  }

  function toggleDevtools() {
    const next = !devtools;
    setDevtools(next);
    const win = safeWin();
    if (!win) return;
    try {
      win.postMessage({ type: "bmo:preview:set-devtools", enabled: next }, window.location.origin);
    } catch {
      // ignore
    }
  }

  function navigateToDraft() {
    const normalized = normalizeInternalPath(addressDraft);
    if (!normalized) {
      setAddressDraft(currentUrl);
      return;
    }
    if (iframeRef.current) iframeRef.current.src = normalized;
    setAddressDraft(normalized);

    // Push immediately so external URLs (no bridge) still have working back/forward.
    setNav((prev) => {
      const cur = prev.entries[prev.index];
      if (cur === normalized) return prev;
      const trimmed = prev.entries.slice(0, prev.index + 1);
      return { entries: [...trimmed, normalized], index: trimmed.length };
    });
  }

  function syncAddressBarFromIframe() {
    const win = safeWin();
    if (!win) return;
    try {
      const next = win.location.pathname + win.location.search + win.location.hash;
      setNav((prev) => {
        const cur = prev.entries[prev.index];
        if (cur === next) return prev;
        const trimmed = prev.entries.slice(0, prev.index + 1);
        return { entries: [...trimmed, next], index: trimmed.length };
      });
      setAddressDraft(next);
      // Re-apply devtools preference after reload.
      win.postMessage({ type: "bmo:preview:set-devtools", enabled: devtools }, window.location.origin);
    } catch {
      // ignore (cross-origin, etc.)
    }
  }

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Browser chrome */}
      <div className="flex h-10 items-end justify-between border-b border-sidebar-border bg-sidebar px-2">
        <div className="flex h-9 min-w-0 flex-1 items-end gap-2 pb-0">
          <div className="flex items-center gap-1 pb-1">
            <IconButton
              label="Back"
              onClick={back}
              disabled={nav.index <= 0}
              icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
            />
            <IconButton
              label="Forward"
              onClick={forward}
              disabled={nav.index >= nav.entries.length - 1}
              icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            />
            <IconButton label="Reload" onClick={reload} icon={<RotateCcw className="h-4 w-4" aria-hidden="true" />} />
          </div>

          {/* Single tab */}
          <div className="relative -mb-px flex h-8 flex-none items-center gap-2 border border-sidebar-border border-b-[color:var(--sidebar)] bg-sidebar px-2 text-xs text-foreground">
            <span className="truncate">Preview</span>
          </div>

          <div className="min-w-0 flex-1 pb-1">
            <input
              value={addressDraft}
              onChange={(e) => {
                const next = e.target.value;
                const withSlash = next.startsWith("/") ? next : `/${next.replace(/^\/+/, "")}`;
                setAddressDraft(withSlash);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") navigateToDraft();
                if (e.key === "Escape") setAddressDraft(currentUrl);
              }}
              className={cn(
                "h-7 w-full border border-sidebar-border bg-background/40 px-2 text-xs text-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring/30",
              )}
              aria-label="Preview URL"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 pb-1">
          <button
            type="button"
            onClick={toggleDevtools}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center border",
              devtools
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-transparent text-muted-foreground hover:border-sidebar-border hover:bg-secondary/40 hover:text-foreground",
            )}
            aria-label="Toggle devtools"
            title="Toggle devtools"
          >
            <Bug className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={openExternal}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center border border-transparent",
              "text-muted-foreground hover:border-sidebar-border hover:bg-secondary/40 hover:text-foreground",
            )}
            aria-label="Open preview in new tab"
            title="Open preview in new tab"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden p-2">
        <div className="h-full w-full overflow-hidden border border-sidebar-border bg-background">
          <iframe
            ref={iframeRef}
            title="Project preview"
            src={currentUrl}
            className="h-full w-full"
            // Keep the preview "webview" isolated from the parent app.
            // We intentionally do NOT allow top navigation from the iframe.
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
            onLoad={syncAddressBarFromIframe}
          />
        </div>
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  icon,
  disabled,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center border border-transparent",
        disabled
          ? "cursor-not-allowed text-muted-foreground/40"
          : "text-muted-foreground hover:border-sidebar-border hover:bg-secondary/40 hover:text-foreground",
      )}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}
