"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";

import { cn } from "@/lib/utils";

function prompt(projectId: string) {
  return `bmo:${projectId}$ `;
}

export function WorkspaceTerminal({ projectId }: { projectId: string }) {
  const [tab, setTab] = useState<"terminal" | "output">("terminal");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);

  const p = useMemo(() => prompt(projectId), [projectId]);

  useEffect(() => {
    if (tab !== "terminal") return;
    const el = containerRef.current;
    if (!el) return;

    const term = new Terminal({
      fontFamily:
        "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: 12,
      lineHeight: 1.25,
      cursorBlink: true,
      scrollback: 2000,
      theme: {
        background: "#11111b", // sidebar
        foreground: "#cdd6f4",
        cursor: "#a6e3a1",
        selectionBackground: "rgba(166, 227, 161, 0.25)",
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);

    term.open(el);
    fit.fit();

    term.writeln("Terminal runtime is not wired yet.");
    term.write(p);

    let current = "";
    const onData = term.onData((data) => {
      // Minimal local echo so the UI feels real; replace with backend PTY later.
      if (data === "\r") {
        term.writeln("");
        if (current.trim().length) {
          term.writeln("Not connected to a runtime yet.");
        }
        current = "";
        term.write(p);
        return;
      }
      if (data === "\u007F") {
        if (current.length) {
          current = current.slice(0, -1);
          term.write("\b \b");
        }
        return;
      }
      // Ignore other control sequences for now.
      if (data < " " && data !== "\t") return;
      current += data;
      term.write(data);
    });

    const ro = new ResizeObserver(() => {
      if (tab !== "terminal") return;
      try {
        fit.fit();
      } catch {
        // ignore
      }
    });
    if (shellRef.current) ro.observe(shellRef.current);

    termRef.current = term;
    fitRef.current = fit;

    return () => {
      onData.dispose();
      ro.disconnect();
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
  }, [p, tab]);

  useEffect(() => {
    if (tab !== "terminal") return;
    // When switching back to terminal, re-fit after layout.
    requestAnimationFrame(() => {
      try {
        fitRef.current?.fit();
      } catch {
        // ignore
      }
    });
  }, [tab]);

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-10 items-end justify-between border-b border-sidebar-border bg-sidebar px-2">
        <div className="flex h-9 items-end gap-1">
          <TabButton active={tab === "terminal"} onClick={() => setTab("terminal")} label="Terminal" />
          <TabButton active={tab === "output"} onClick={() => setTab("output")} label="Output" />
        </div>
        <button
          type="button"
          onClick={() => {
            const term = termRef.current;
            if (!term) return;
            term.clear();
            term.writeln("Terminal cleared.");
            term.write(p);
          }}
          className={cn(
            "mb-1 inline-flex h-7 w-7 items-center justify-center border border-transparent",
            "text-muted-foreground hover:border-sidebar-border hover:bg-secondary/40 hover:text-foreground",
          )}
          aria-label="Clear terminal"
          title="Clear terminal"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <div ref={shellRef} className="min-h-0 flex-1 overflow-hidden p-2">
        {tab === "terminal" ? (
          <div className="h-full w-full overflow-hidden bg-[#11111b]">
            <div ref={containerRef} className="h-full w-full" />
          </div>
        ) : (
          <div className="h-full w-full overflow-auto border border-sidebar-border bg-background/40 p-2 text-xs text-muted-foreground">
            <p>Output view placeholder. This will show build/run logs once the project runtime is wired.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative -mb-px flex h-8 items-center border px-2 text-xs",
        active
          ? "z-10 border-sidebar-border border-b-[color:var(--sidebar)] bg-sidebar text-foreground"
          : "border-transparent bg-transparent text-muted-foreground hover:border-sidebar-border hover:bg-secondary/40 hover:text-foreground",
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
