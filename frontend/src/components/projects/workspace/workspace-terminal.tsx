"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";

import { WorkspaceTabsRoot, WorkspaceTabsList, WorkspaceTab } from "./workspace-tabs";
import { WorkspaceHeader, WorkspaceHeaderIconButton } from "./workspace-header";

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
      <WorkspaceTabsRoot value={tab} onValueChange={(value) => setTab(value as "terminal" | "output")}>
        <WorkspaceHeader className="h-10 items-end px-2">
          <WorkspaceTabsList>
            <WorkspaceTab value="terminal">Terminal</WorkspaceTab>
            <WorkspaceTab value="output">Output</WorkspaceTab>
          </WorkspaceTabsList>
          <WorkspaceHeaderIconButton
            label="Clear terminal"
            onClick={() => {
              const term = termRef.current;
              if (!term) return;
              term.clear();
              term.writeln("Terminal cleared.");
              term.write(p);
            }}
            icon={<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
          />
        </WorkspaceHeader>
      </WorkspaceTabsRoot>

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
