"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Hammer, Loader2, Trash2 } from "lucide-react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import AnsiToHtml from "ansi-to-html";

import { cn } from "@/lib/utils";

import { WorkspaceTabsRoot, WorkspaceTabsList, WorkspaceTab } from "./workspace-tabs";
import { WorkspaceHeader, WorkspaceHeaderIconButton } from "./workspace-header";

import type { ProjectRuntimeInfo } from "./workspace-types";

type TerminalSessionState = {
  sessionId: string;
  cursor: number;
  screen: string;
};

const ansiConverter = new AnsiToHtml({
  fg: "#cdd6f4",
  bg: "#11111b",
  newline: true,
  escapeXML: true,
});

function resolveSelectableService(runtime: ProjectRuntimeInfo) {
  if (runtime.defaultTerminalService && runtime.services.some((service) => service.name === runtime.defaultTerminalService)) {
    return runtime.defaultTerminalService;
  }
  return runtime.services[0]?.name ?? "";
}

export function WorkspaceTerminal({
  projectId,
  runtimeInfo,
  hasPendingRuntimeChanges,
  onApplyRuntimeChanges,
}: {
  projectId: string;
  runtimeInfo: ProjectRuntimeInfo;
  hasPendingRuntimeChanges: boolean;
  onApplyRuntimeChanges: () => void | Promise<void>;
}) {
  const [tab, setTab] = useState<"terminal" | "output">("terminal");
  const [runtime, setRuntime] = useState<ProjectRuntimeInfo>(runtimeInfo);
  const [selectedService, setSelectedService] = useState(resolveSelectableService(runtimeInfo));
  const [outputService, setOutputService] = useState<string>("all");
  const [busy, setBusy] = useState<"apply" | null>(null);
  const [logs, setLogs] = useState("");
  const [logsError, setLogsError] = useState<string | null>(null);
  const [terminalError, setTerminalError] = useState<string | null>(null);
  const [sessionVersion, setSessionVersion] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const sessionsRef = useRef<Record<string, TerminalSessionState>>({});
  const activeServiceRef = useRef(selectedService);
  const logSinceRef = useRef<string | null>(null);

  const services = runtime.services;

  useEffect(() => {
    setRuntime(runtimeInfo);
    setSelectedService((current) => {
      if (current && runtimeInfo.services.some((service) => service.name === current)) return current;
      return resolveSelectableService(runtimeInfo);
    });
  }, [runtimeInfo]);

  useEffect(() => {
    if (!selectedService && services[0]?.name) {
      setSelectedService(resolveSelectableService(runtime));
    }
    if (selectedService && services.length > 0 && !services.some((service) => service.name === selectedService)) {
      setSelectedService(resolveSelectableService(runtime));
    }
  }, [runtime, selectedService, services]);

  useEffect(() => {
    activeServiceRef.current = selectedService;
  }, [selectedService]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const term = new Terminal({
      fontFamily:
        "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: 12,
      lineHeight: 1.25,
      cursorBlink: true,
      scrollback: 3000,
      theme: {
        background: "#11111b",
        foreground: "#cdd6f4",
        cursor: "#a6e3a1",
        selectionBackground: "rgba(166, 227, 161, 0.25)",
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(el);
    fit.fit();
    termRef.current = term;
    fitRef.current = fit;

    const onData = term.onData((data) => {
      const activeSession = sessionsRef.current[activeServiceRef.current];
      if (!activeSession) return;
      void fetch(`/api/projects/${projectId}/terminal/${activeSession.sessionId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input: data, cols: term.cols, rows: term.rows }),
      });
    });

    const ro = new ResizeObserver(() => {
      try {
        fit.fit();
      } catch {
        // ignore
      }

      const activeSession = sessionsRef.current[activeServiceRef.current];
      if (!activeSession) return;
      void fetch(`/api/projects/${projectId}/terminal/${activeSession.sessionId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cols: term.cols, rows: term.rows }),
      });
    });

    if (shellRef.current) ro.observe(shellRef.current);

    return () => {
      onData.dispose();
      ro.disconnect();
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
  }, [projectId]);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/runtime`, { cache: "no-store" });
        const data = (await res.json()) as { runtime?: ProjectRuntimeInfo; error?: string };
        if (!res.ok || !data.runtime) throw new Error(data.error ?? "Failed to refresh runtime.");
        setRuntime(data.runtime);
      } catch {
        // Keep the last known runtime visible.
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;

    async function ensureSession() {
      if (tab !== "terminal" || !selectedService) return;

      const existing = sessionsRef.current[selectedService];
      if (!existing) {
        try {
          setTerminalError(null);
          const res = await fetch(`/api/projects/${projectId}/terminal`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ service: selectedService }),
          });
          const data = (await res.json()) as {
            sessionId?: string;
            cursor?: number;
            error?: string;
          };
          if (!res.ok || !data.sessionId) throw new Error(data.error ?? "Failed to open terminal session.");
          sessionsRef.current[selectedService] = {
            sessionId: data.sessionId,
            cursor: typeof data.cursor === "number" ? data.cursor : 0,
            screen: "",
          };
          setSessionVersion((value) => value + 1);
        } catch (error) {
          if (!cancelled) {
            setTerminalError(error instanceof Error ? error.message : "Failed to open terminal session.");
          }
          return;
        }
      }

      if (cancelled) return;
      const session = sessionsRef.current[selectedService];
      const term = termRef.current;
      if (!term || !session) return;
      term.reset();
      if (session.screen) {
        term.write(session.screen);
      }
      requestAnimationFrame(() => {
        try {
          fitRef.current?.fit();
        } catch {
          // ignore
        }
      });
    }

    void ensureSession();
    return () => {
      cancelled = true;
    };
  }, [projectId, selectedService, tab]);

  useEffect(() => {
    if (tab !== "terminal" || !selectedService) return;
    const activeSession = sessionsRef.current[selectedService];
    if (!activeSession) return;

    let cancelled = false;
    const interval = window.setInterval(async () => {
      try {
        const res = await fetch(
          `/api/projects/${projectId}/terminal/${activeSession.sessionId}/output?cursor=${activeSession.cursor}`,
          { cache: "no-store" },
        );
        const data = (await res.json()) as {
          chunks?: Array<{ seq: number; data: string }>;
          cursor?: number;
          closed?: boolean;
          error?: string;
        };
        if (!res.ok) throw new Error(data.error ?? "Failed to read terminal output.");
        if (cancelled || selectedService !== activeServiceRef.current) return;
        const chunks = data.chunks ?? [];
        if (chunks.length === 0) return;
        const next = chunks.map((chunk) => chunk.data).join("");
        activeSession.screen += next;
        activeSession.cursor = typeof data.cursor === "number" ? data.cursor : activeSession.cursor;
        setTerminalError(null);
        termRef.current?.write(next);
      } catch (error) {
        if (!cancelled) {
          setTerminalError(error instanceof Error ? error.message : "Failed to read terminal output.");
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [projectId, selectedService, sessionVersion, tab]);

  useEffect(() => {
    if (tab !== "output") return;

    let cancelled = false;
    const fetchLogs = async () => {
      try {
        const params = new URLSearchParams();
        params.set("tail", logSinceRef.current ? "500" : "200");
        if (outputService !== "all") params.set("service", outputService);
        if (logSinceRef.current) params.set("since", logSinceRef.current);

        const res = await fetch(`/api/projects/${projectId}/logs?${params.toString()}`, { cache: "no-store" });
        const data = (await res.json()) as { logs?: string; fetchedAt?: string; error?: string };
        if (!res.ok) throw new Error(data.error ?? "Failed to load logs.");
        if (cancelled) return;
        setLogs((prev) => {
          const nextLogs = data.logs?.trim() ?? "";
          if (!nextLogs) return prev;
          return prev ? `${prev}\n${nextLogs}` : nextLogs;
        });
        logSinceRef.current = data.fetchedAt ?? new Date().toISOString();
        setLogsError(null);
      } catch (error) {
        if (!cancelled) {
          setLogsError(error instanceof Error ? error.message : "Failed to load logs.");
        }
      }
    };

    void fetchLogs();
    const interval = window.setInterval(fetchLogs, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [outputService, projectId, tab]);

  useEffect(() => {
    setLogs("");
    setLogsError(null);
    logSinceRef.current = null;
  }, [outputService]);

  useEffect(() => {
    const sessions = sessionsRef;
    return () => {
      for (const session of Object.values(sessions.current)) {
        void fetch(`/api/projects/${projectId}/terminal/${session.sessionId}`, { method: "DELETE" });
      }
    };
  }, [projectId]);

  const outputPlaceholder = useMemo(() => {
    if (runtime.projectStatus !== "running") {
      return "Project is stopped. Start it to stream compose logs.";
    }
    return "Waiting for container output...";
  }, [runtime.projectStatus]);
  const renderedLogs = useMemo(() => ansiConverter.toHtml(logs), [logs]);

  async function handleApplyRuntimeChanges() {
    setBusy("apply");
    try {
      await onApplyRuntimeChanges();
      setLogs("");
      logSinceRef.current = null;
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <WorkspaceTabsRoot value={tab} onValueChange={(value) => setTab(value as "terminal" | "output")}>
        <WorkspaceHeader className="h-10 items-end px-2">
          <div className="flex min-w-0 items-end gap-2">
            <WorkspaceTabsList>
              <WorkspaceTab value="terminal">Terminal</WorkspaceTab>
              <WorkspaceTab value="output">Output</WorkspaceTab>
            </WorkspaceTabsList>
            <label className="flex items-center gap-2 pb-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <span>Service</span>
              <select
                value={tab === "terminal" ? selectedService : outputService}
                onChange={(event) => {
                  if (tab === "terminal") setSelectedService(event.target.value);
                  else setOutputService(event.target.value);
                }}
                className={cn(
                  "h-7 min-w-28 border border-sidebar-border bg-background px-2 text-[11px] text-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring/30",
                )}
              >
                {tab === "output" ? <option value="all">All services</option> : null}
                {services.map((service) => (
                  <option key={service.name} value={service.name}>
                    {service.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex items-center gap-1 pb-1">
            <WorkspaceHeaderIconButton
              label="Apply runtime changes"
              onClick={() => {
                void handleApplyRuntimeChanges();
              }}
              active={hasPendingRuntimeChanges}
              icon={
                busy === "apply" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Hammer className="h-3.5 w-3.5" aria-hidden="true" />
              }
            />
            <WorkspaceHeaderIconButton
              label={tab === "terminal" ? "Clear terminal" : "Clear output"}
              onClick={() => {
                if (tab === "terminal") {
                  const term = termRef.current;
                  if (!term || !selectedService) return;
                  const session = sessionsRef.current[selectedService];
                  if (!session) return;
                  session.screen = "";
                  term.clear();
                  return;
                }
                setLogs("");
                logSinceRef.current = null;
              }}
              icon={<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
            />
          </div>
        </WorkspaceHeader>
      </WorkspaceTabsRoot>

      <div ref={shellRef} className="min-h-0 flex-1 overflow-hidden p-2">
        {tab === "terminal" ? (
          <div className="relative h-full w-full overflow-hidden bg-[#11111b]">
            <div ref={containerRef} className="h-full w-full" />
            {terminalError ? (
              <div className="pointer-events-none absolute inset-x-2 top-2 border border-destructive/40 bg-background/95 px-2 py-1 text-[11px] text-destructive">
                {terminalError}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="h-full w-full overflow-auto border border-sidebar-border bg-background/40 p-2 font-mono text-[11px] leading-5 text-foreground">
            {logs ? (
              <pre
                className="whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ __html: renderedLogs }}
              />
            ) : (
              <p className="text-muted-foreground">{outputPlaceholder}</p>
            )}
            {logsError ? <p className="mt-2 text-destructive">{logsError}</p> : null}
          </div>
        )}
      </div>
    </div>
  );
}
