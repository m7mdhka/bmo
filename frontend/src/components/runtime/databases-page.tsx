"use client";

import { useMemo, useState } from "react";
import {
  Cable,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppPageShell } from "@/components/layout/app-page-shell";

import type { ConnStatus, DbConn } from "@/components/runtime/databases/types";
import { DetailRow } from "@/components/runtime/databases/ui/components/detail-row";
import {
  AddConnectionButton,
  ConnectFromDockerButton,
  EditConnectionButton,
} from "@/components/runtime/databases/ui/connections/add-connection-dialog";
import { LastCheckRow } from "@/components/runtime/databases/ui/components/last-check-row";
import {
  ENGINE_REGISTRY,
  withEngineDefinition,
} from "@/components/runtime/databases/registry";

const MOCK: DbConn[] = [
  {
    id: "pg",
    name: "Local Postgres",
    details: ENGINE_REGISTRY.Postgres.createDefaultDetails(),
    status: "connected",
    lastChecked: "just now",
  },
  {
    id: "redis",
    name: "Cache",
    details: ENGINE_REGISTRY.Redis.createDefaultDetails(),
    status: "disconnected",
    lastChecked: "2h ago",
  },
];

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

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
    const q = norm(query.trim());
    if (!q) return items;
    return items.filter((i) => {
      const summary = withEngineDefinition(i.details, (def, details) => def.summary(details));
      const hay = norm([i.name, i.details.engine, summary].join(" "));
      return hay.includes(q);
    });
  }, [items, query]);

  const selected = items.find((i) => i.id === selectedId) ?? null;

  function removeSelected() {
    if (!selected) return;
    const remaining = items.filter((i) => i.id !== selected.id);
    setItems(remaining);
    setSelectedId(remaining[0]?.id ?? "");
  }

  function markChecked(id: string) {
    setItems((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, lastChecked: new Date().toLocaleString() }
          : c,
      ),
    );
  }

  return (
    <AppPageShell
      eyebrow="runtime"
      title="Connected Databases"
      description="Define connection targets for your projects."
      iconName="Database"
      actions={
        <div className="flex items-center gap-2">
          <AddConnectionButton onAdd={(c) => setItems((p) => [c, ...p])} />
          <ConnectFromDockerButton onAdd={(c) => setItems((p) => [c, ...p])} />
        </div>
      }
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
            </div>
          </CardHeader>

          <CardContent className="space-y-1">
            {filtered.map((c) => {
              const isActive = c.id === selectedId;
              const { def, summary } = withEngineDefinition(c.details, (def, details) => ({
                def,
                summary: def.summary(details),
              }));
              const DbIcon = def.Icon;
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
                      {def.label} · {summary}
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
                {(() => {
                  const def = withEngineDefinition(selected.details, (def) => def);
                  return (
                <div className="grid gap-2 sm:grid-cols-2">
                  <DetailRow label="Name" value={selected.name} mono />
                  <DetailRow label="Engine" value={def.label} />
                  {withEngineDefinition(selected.details, (def, details) => def.DetailsRows(details))}
                  <LastCheckRow value={selected.lastChecked} onTest={() => markChecked(selected.id)} />
                </div>
                  );
                })()}

                <div className="flex flex-wrap items-center gap-2 border border-border bg-secondary/30 p-3">
                  <EditConnectionButton
                    conn={selected}
                    onUpdate={(next) =>
                      setItems((prev) => prev.map((c) => (c.id === next.id ? next : c)))
                    }
                  />
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
