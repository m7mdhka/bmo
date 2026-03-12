"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, CornerDownLeft, Trash2, User } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  ts: number;
};

function newId() {
  try {
    return crypto.randomUUID();
  } catch {
    return String(Date.now() + Math.random());
  }
}

function storageKey(projectId: string) {
  return `bmo:workspace-chat:${projectId}`;
}

export function WorkspaceAgentPanel({
  projectId,
}: {
  projectId: string;
}) {
  const key = useMemo(() => storageKey(projectId), [projectId]);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as ChatMessage[];
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((m) => m && typeof m.id === "string" && typeof m.content === "string");
    } catch {
      return [];
    }
  });

  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [key, messages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  function send() {
    const text = draft.trim();
    if (!text) return;

    const userMsg: ChatMessage = { id: newId(), role: "user", content: text, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setDraft("");

    // Placeholder assistant response until runtime agent wiring exists.
    const assistantMsg: ChatMessage = {
      id: newId(),
      role: "assistant",
      content:
        "Agent runtime is not wired yet. This UI is ready; next we can connect it to your local runtime to read files, run commands, and apply edits.",
      ts: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-10 items-center justify-between px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        <span>Agent</span>
        <button
          type="button"
          onClick={() => setMessages([])}
          className="inline-flex items-center gap-1 border border-transparent px-2 py-1 text-[10px] text-muted-foreground hover:border-sidebar-border hover:bg-secondary/40 hover:text-foreground"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Clear
        </button>
      </div>

      <Separator />

      <div ref={listRef} className="no-scrollbar min-h-0 flex-1 overflow-auto px-3 py-3">
        {messages.length === 0 ? (
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
    </div>
  );
}
