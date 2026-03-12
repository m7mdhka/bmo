"use client";

import { useMemo, useState } from "react";
import {
  Cable,
  Database,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppPageShell } from "@/components/layout/app-page-shell";

import type { ConnStatus, DbConn } from "@/components/runtime/databases/types";
import { createDefaultDetails } from "@/components/runtime/databases/defaults";
import { engineIcon } from "@/components/runtime/databases/icons";
import { engineSummary } from "@/components/runtime/databases/summary";
import { ConnectionDetailsRows } from "@/components/runtime/databases/details-rows";
import { DetailRow } from "@/components/runtime/databases/detail-row";
import { AddConnectionButton } from "@/components/runtime/databases/add-connection-dialog";
import { LastCheckRow } from "@/components/runtime/databases/last-check-row";

const MOCK: DbConn[] = [
  {
    id: "pg",
    name: "Local Postgres",
    engine: "Postgres",
    details: createDefaultDetails("Postgres"),
    status: "connected",
    lastChecked: "just now",
  },
  {
    id: "redis",
    name: "Cache",
    engine: "Redis",
    details: createDefaultDetails("Redis"),
    status: "disconnected",
    lastChecked: "2h ago",
  },
];

function statusClass(status: ConnStatus) {
  switch (status) {
    case "connected":
      return "bg-emerald-400/80";
    case "error":
      return "bg-destructive/80";
    default:
      return "bg-muted-foreground/50";
  }
}

export function DatabasesPage() {
  const [items, setItems] = useState<DbConn[]>(MOCK);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.name.toLowerCase().includes(q) || i.engine.toLowerCase().includes(q));
  }, [items, query]);

  const selected = items.find((i) => i.id === selectedId) ?? null;

  function removeSelected() {
    if (!selected) return;
    const remaining = items.filter((i) => i.id !== selected.id);
    setItems(remaining);
    setSelectedId(remaining[0]?.id ?? "");
  }

  function simulateCheck(id: string) {
    setItems((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              lastChecked: "just now",
              status:
                c.status === "connected"
                  ? "connected"
                  : c.status === "disconnected"
                    ? "connected"
                    : "disconnected",
            }
          : c,
      ),
    );
  }

  return (
    <AppPageShell
      eyebrow="runtime"
      title="Connected Databases"
      description="Define connection targets for your projects. Status checks are local and best-effort."
      icon={Database}
      actions={<AddConnectionButton onAdd={(c) => setItems((p) => [c, ...p])} />}
    >
      <div className="grid flex-1 gap-3 lg:grid-cols-[340px_1fr]">
        <Card className="border border-border bg-card">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-sm">Connections</CardTitle>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 items-center border border-border bg-background px-2 py-1 text-xs">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or engine..."
                  className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                />
              </div>
              <Button
                variant="outline"
                size="xs"
                disabled={!selected}
                onClick={() => selected && simulateCheck(selected.id)}
                title={!selected ? "Select a connection first" : "Re-check status"}
              >
                <RefreshCw className="h-3 w-3" />
                Check
              </Button>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground/70">
              Stored locally. Project wiring (compose/env injection) is coming next.
            </p>
          </CardHeader>

          <CardContent className="space-y-1">
            {filtered.map((c) => {
              const isActive = c.id === selectedId;
              const DbIcon = engineIcon(c.engine);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 border px-2.5 py-2 text-left text-xs transition-colors",
                    isActive
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-transparent text-muted-foreground hover:border-border hover:bg-secondary/50 hover:text-foreground",
                  )}
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate font-semibold text-foreground">
                      <DbIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
                      <span className="truncate">{c.name}</span>
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground/70">
                      {c.engine} · {engineSummary(c)}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", statusClass(c.status))} />
                    <span className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
                      {c.status}
                    </span>
                  </span>
                </button>
              );
            })}
            {filtered.length === 0 ? (
              <div className="mt-2 border border-dashed border-border bg-background px-3 py-3 text-xs text-muted-foreground">
                No connections match <span className="text-foreground">{query.trim()}</span>.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-sm">Details</CardTitle>
            <p className="mt-1 text-[10px] text-muted-foreground/70">
              Review connection info and run quick actions.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selected ? (
              <div className="border border-dashed border-border bg-background px-3 py-3 text-xs text-muted-foreground">
                No connection selected.
              </div>
            ) : (
              <>
                <div className="grid gap-2 sm:grid-cols-2">
                  <DetailRow label="Name" value={selected.name} mono />
                  <DetailRow label="Engine" value={selected.engine} />
                  <ConnectionDetailsRows conn={selected} />
                  <LastCheckRow value={selected.lastChecked} onTest={() => simulateCheck(selected.id)} />
                </div>

                <div className="flex flex-wrap items-center gap-2 border border-border bg-secondary/30 p-3">
                  <Button variant="outline" size="xs" disabled title="Attach to project (coming soon)">
                    <Cable className="h-3 w-3" />
                    Attach to project
                  </Button>
                  <Button variant="destructive" size="xs" onClick={removeSelected}>
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppPageShell>
  );
}
