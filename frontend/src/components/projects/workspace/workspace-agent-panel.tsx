"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, CornerDownLeft, History, MessageSquarePlus, Trash2, User } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { WorkspaceHeader, WorkspaceHeaderIconButton, WorkspaceHeaderTitle } from "./workspace-header";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  ts: number;
};

type ChatThread = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
};

function newId() {
  try {
    return crypto.randomUUID();
  } catch {
    return String(Date.now() + Math.random());
  }
}

function threadsStorageKey(projectId: string) {
  return `bmo:workspace-chat-threads:${projectId}`;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isMessage(v: unknown): v is ChatMessage {
  if (!isRecord(v)) return false;
  return typeof v.id === "string" && (v.role === "user" || v.role === "assistant") && typeof v.content === "string" && typeof v.ts === "number";
}

function normalizeThreads(raw: unknown): ChatThread[] {
  if (!Array.isArray(raw)) return [];
  const now = Date.now();
  const out: ChatThread[] = [];

  for (const t of raw) {
    if (!isRecord(t)) continue;
    const id = typeof t.id === "string" ? t.id : "";
    if (!id) continue;
    const messagesRaw = Array.isArray(t.messages) ? t.messages : [];
    const messages = messagesRaw.filter(isMessage);
    const createdAt = typeof t.createdAt === "number" ? t.createdAt : now;
    const updatedAt = typeof t.updatedAt === "number" ? t.updatedAt : (messages[messages.length - 1]?.ts ?? createdAt);
    const title = typeof t.title === "string" && t.title.trim().length ? t.title : (messages.length ? titleFromFirstMessage(messages) : "New chat");

    out.push({ id, title, createdAt, updatedAt, messages });
  }

  return out;
}

function loadThreads(key: string): ChatThread[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return normalizeThreads(JSON.parse(raw));
  } catch {
    return [];
  }
}

function titleFromFirstMessage(messages: ChatMessage[]) {
  const firstUser = messages.find((m) => m.role === "user")?.content?.trim();
  if (!firstUser) return "New chat";
  return firstUser.split("\n")[0].slice(0, 36);
}

function formatThreadTime(ts: number) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(ts));
  } catch {
    return "";
  }
}

export function WorkspaceAgentPanel({
  projectId,
}: {
  projectId: string;
}) {
  const key = useMemo(() => threadsStorageKey(projectId), [projectId]);
  const [mode, setMode] = useState<"chat" | "history">("chat");

  const [{ threads, activeThreadId }, setStore] = useState<{
    threads: ChatThread[];
    activeThreadId: string;
  }>(() => {
    const loaded = loadThreads(key);
    if (loaded.length) {
      const newest = [...loaded].sort((a, b) => b.updatedAt - a.updatedAt)[0]!;
      return { threads: loaded, activeThreadId: newest.id };
    }
    const now = Date.now();
    const t: ChatThread = { id: newId(), title: "New chat", createdAt: now, updatedAt: now, messages: [] };
    return { threads: [t], activeThreadId: t.id };
  });

  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(threads));
    } catch {
      // ignore
    }
  }, [key, threads]);

  useEffect(() => {
    if (mode !== "chat") return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [mode, activeThreadId, threads]);

  const activeThread = threads.find((t) => t.id === activeThreadId) ?? threads[0];
  const messages = activeThread?.messages ?? [];

  function send() {
    const text = draft.trim();
    if (!text) return;

    const userMsg: ChatMessage = { id: newId(), role: "user", content: text, ts: Date.now() };
    setDraft("");

    // Placeholder assistant response until runtime agent wiring exists.
    const assistantMsg: ChatMessage = {
      id: newId(),
      role: "assistant",
      content:
        "Agent runtime is not wired yet. This UI is ready; next we can connect it to your local runtime to read files, run commands, and apply edits.",
      ts: Date.now(),
    };

    setStore((prev) => {
      const nextThreads = prev.threads.map((t) => {
        if (t.id !== prev.activeThreadId) return t;
        const nextMessages = [...t.messages, userMsg, assistantMsg];
        const nextTitle = t.title === "New chat" ? titleFromFirstMessage(nextMessages) : t.title;
        return { ...t, title: nextTitle, messages: nextMessages, updatedAt: Date.now() };
      });
      return { ...prev, threads: nextThreads };
    });
  }

  function newChat() {
    const now = Date.now();
    const t: ChatThread = { id: newId(), title: "New chat", createdAt: now, updatedAt: now, messages: [] };
    setStore((prev) => ({ threads: [t, ...prev.threads], activeThreadId: t.id }));
    setMode("chat");
    setDraft("");
  }

  function deleteActiveThread() {
    if (!activeThread) return;
    setStore((prev) => {
      const nextThreads = prev.threads.filter((t) => t.id !== prev.activeThreadId);
      if (nextThreads.length === 0) {
        const now = Date.now();
        const t: ChatThread = { id: newId(), title: "New chat", createdAt: now, updatedAt: now, messages: [] };
        setMode("chat");
        return { threads: [t], activeThreadId: t.id };
      }
      const newest = [...nextThreads].sort((a, b) => b.updatedAt - a.updatedAt)[0]!;
      setMode("chat");
      return { threads: nextThreads, activeThreadId: newest.id };
    });
    setDraft("");
  }

  const orderedThreads = useMemo(() => {
    return [...threads].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [threads]);

  return (
    <div className="flex h-full flex-col">
      <WorkspaceHeader>
        <WorkspaceHeaderTitle>Agent</WorkspaceHeaderTitle>
        <div className="flex items-center gap-1">
          <WorkspaceHeaderIconButton
            label="Delete thread"
            onClick={deleteActiveThread}
            icon={<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
          />
          <WorkspaceHeaderIconButton
            label="New chat"
            onClick={newChat}
            icon={<MessageSquarePlus className="h-3.5 w-3.5" aria-hidden="true" />}
          />
          <WorkspaceHeaderIconButton
            label={mode === "history" ? "Back to chat" : "History"}
            onClick={() => setMode((m) => (m === "history" ? "chat" : "history"))}
            active={mode === "history"}
            icon={<History className="h-3.5 w-3.5" aria-hidden="true" />}
          />
        </div>
      </WorkspaceHeader>

      <div ref={listRef} className="no-scrollbar min-h-0 flex-1 overflow-auto px-3 py-3">
        {mode === "history" ? (
          <div className="space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
              Threads
            </div>
            {orderedThreads.length === 0 ? (
              <p className="text-xs text-muted-foreground">No threads yet.</p>
            ) : (
              <div className="space-y-1">
                {orderedThreads.map((t) => {
                  const isActive = t.id === activeThreadId;
                  const last = t.messages[t.messages.length - 1]?.content?.trim() ?? "";
                  return (
                      <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setStore((prev) => ({ ...prev, activeThreadId: t.id }));
                        setMode("chat");
                      }}
                      className={cn(
                        "w-full border px-2.5 py-2 text-left",
                        isActive
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-sidebar-border bg-background/40 text-foreground hover:bg-secondary/40",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 text-xs font-semibold text-foreground">
                          <span className={cn("truncate", isActive ? "text-primary" : "text-foreground")}>
                            {t.title}
                          </span>
                        </div>
                        <div className="shrink-0 text-[10px] text-muted-foreground/70">
                          {formatThreadTime(t.updatedAt)}
                        </div>
                      </div>
                      {last ? (
                        <div className="mt-1 line-clamp-2 text-[10px] text-muted-foreground/80">
                          {last}
                        </div>
                      ) : (
                        <div className="mt-1 text-[10px] text-muted-foreground/60">
                          Empty thread
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : messages.length === 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Ask for changes, explanations, or multi-step tasks. This will become a real local agent.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "Explain the active file",
                "Add unit tests",
                "Refactor for scalability",
                "Find and fix bugs",
              ].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setDraft(s)}
                  className="border border-sidebar-border bg-background/40 px-2 py-1 text-[10px] text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <div key={m.id} className="flex gap-2">
                <div
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border",
                    m.role === "user"
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-sidebar-border bg-secondary/30 text-foreground",
                  )}
                >
                  {m.role === "user" ? <User className="h-3.5 w-3.5" aria-hidden="true" /> : <Bot className="h-3.5 w-3.5" aria-hidden="true" />}
                </div>
                <div
                  className={cn(
                    "min-w-0 flex-1 border px-2.5 py-2 text-xs leading-relaxed",
                    m.role === "user" ? "border-primary/20 bg-background" : "border-sidebar-border bg-background/40",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {mode === "chat" ? (
        <>
          <Separator />

          <div className="shrink-0 p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Message the agent..."
                rows={2}
                className={cn(
                  "min-h-[2.25rem] flex-1 resize-none border border-sidebar-border bg-background/40 px-2.5 py-2 text-xs text-foreground",
                  "placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30",
                )}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <button
                type="button"
                onClick={send}
                className="inline-flex h-9 items-center gap-1 border border-primary/40 bg-primary/10 px-3 text-xs text-primary hover:bg-primary/15"
              >
                <CornerDownLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Send
              </button>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground/70">Send: Ctrl+Enter</p>
          </div>
        </>
      ) : null}
    </div>
  );
}
