"use client";

import { useMemo, useState } from "react";
import { Braces, Play, RefreshCw, TableProperties } from "lucide-react";
import { SqlMonacoEditor } from "@sqlrooms/sql-editor";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { DbConn, QueryMeta } from "@/components/runtime/databases/types";
import { getEngineModule, withEngineDefinition } from "@/components/runtime/databases/registry";

const MOCK_CONNECTIONS: DbConn[] = [
  {
    id: "workspace-pg",
    name: "Project Postgres",
    details: {
      engine: "Postgres",
      config: {
        host: "localhost",
        port: 5432,
        database: "bmo",
        username: "postgres",
        password: "",
        ssl: "disable",
      },
    },
    status: "connected",
    lastChecked: "just now",
  },
  {
    id: "workspace-mongo",
    name: "Product MongoDB",
    details: { engine: "MongoDB", config: { uri: "mongodb://localhost:27017/bmo" } },
    status: "connected",
    lastChecked: "2 min ago",
  },
  {
    id: "workspace-redis",
    name: "Sessions Redis",
    details: { engine: "Redis", config: { host: "localhost", port: 6379, db: 0, tls: false } },
    status: "disconnected",
    lastChecked: "15 min ago",
  },
];

type DataRow = Record<string, string>;

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function statusClass(status: DbConn["status"]) {
  switch (status) {
    case "connected":
      return "bg-emerald-400/80";
    case "error":
      return "bg-destructive/80";
    default:
      return "bg-muted-foreground/50";
  }
}

function fallbackRows(noun: string): DataRow[] {
  return [
    { object: `${noun}_users`, records: "1.2k", health: "healthy" },
    { object: `${noun}_sessions`, records: "4.8k", health: "healthy" },
    { object: `${noun}_logs`, records: "27k", health: "warning" },
  ];
}

export function WorkspaceDatabasePanel() {
  const [items] = useState(MOCK_CONNECTIONS);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const [tab, setTab] = useState("explorer");
  const [lastRun, setLastRun] = useState("never");
  const [queryError, setQueryError] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [lastMeta, setLastMeta] = useState<QueryMeta | null>(null);
  const [resultColumns, setResultColumns] = useState<string[]>(["object", "records", "health"]);
  const [resultRows, setResultRows] = useState<DataRow[]>(fallbackRows("table"));

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const selectedAdapter = useMemo(
    () => (selected ? getEngineModule(selected.details.engine) : null),
    [selected],
  );
  const [queryDraft, setQueryDraft] = useState(() =>
    selectedAdapter?.studio.starterQuery ?? "SELECT 1;",
  );

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return items;
    return items.filter((item) => {
      const summary = withEngineDefinition(item.details, (def, details) => def.summary(details));
      return normalize(`${item.name} ${item.details.engine} ${summary}`).includes(q);
    });
  }, [items, query]);

  const engineMeta = useMemo(() => {
    if (!selected) return null;
    return withEngineDefinition(selected.details, (def, details) => ({
      label: def.label,
      group: def.group,
      summary: def.summary(details),
      detailsRows: def.DetailsRows(details),
    }));
  }, [selected]);

  async function runQuery() {
    if (!selected || !selectedAdapter) return;
    setIsRunning(true);
    setQueryError("");
    setLastRun(new Date().toLocaleTimeString());
    const result = await selectedAdapter.executeQuery({
      connectionId: selected.id,
      queryText: queryDraft,
    });
    if (result.error) setQueryError(result.error);
    setLastMeta(result.meta ?? null);
    setResultColumns(result.columns);
    setResultRows(result.rows);
    setIsRunning(false);
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex h-10 items-end justify-between border-b border-sidebar-border bg-sidebar px-2">
        <div className="pb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
          Database Studio
        </div>
        <div className="flex items-center gap-1 pb-1">
          <Button variant="outline" size="xs" title="Sync metadata (mock)">
            <RefreshCw className="h-3 w-3" />
            Sync
          </Button>
          <Button size="xs" onClick={runQuery} disabled={!selected || isRunning}>
            <Play className="h-3 w-3" />
            {isRunning ? "Running..." : "Run"}
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-2 p-2 lg:grid-cols-[280px_1fr]">
        <Card className="border-sidebar-border bg-sidebar">
          <CardHeader className="border-b border-sidebar-border">
            <CardTitle className="text-xs">Connections</CardTitle>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by engine or name..."
              className="h-7 w-full border border-sidebar-border bg-background/40 px-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </CardHeader>
          <CardContent className="space-y-1">
            {filtered.map((item) => {
              const active = item.id === selectedId;
              const adapter = getEngineModule(item.details.engine);
              const meta = withEngineDefinition(item.details, (def, details) => ({
                label: def.label,
                group: def.group,
                summary: def.summary(details),
              }));
              return (
                <button
                  key={item.id}
                  type="button"
	                  onClick={() => {
	                    setSelectedId(item.id);
	                    setQueryDraft(adapter.studio.starterQuery);
	                    setResultRows(fallbackRows(adapter.studio.objectNoun));
	                    setResultColumns(["object", "records", "health"]);
	                    setQueryError("");
	                    setTab("explorer");
	                  }}
                  className={cn(
                    "w-full border px-2.5 py-2 text-left text-xs",
                    active
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-transparent text-muted-foreground hover:border-sidebar-border hover:bg-secondary/40 hover:text-foreground",
                  )}
                >
                  <p className="truncate font-semibold text-foreground">{item.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground/70">
                    {meta.label} · {meta.group}
                  </p>
                  <p className="mt-1 truncate text-[10px] text-muted-foreground/70">{meta.summary}</p>
                  <span className="mt-1 inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70">
                    <span className={cn("h-2 w-2 rounded-full", statusClass(item.status))} />
                    {item.status}
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="min-h-0 border-sidebar-border bg-background">
          {!selected || !engineMeta || !selectedAdapter ? (
            <CardContent className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Select a database connection to open the full control view.
            </CardContent>
          ) : (
            <>
              <CardHeader className="border-b border-sidebar-border">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm">{selected.name}</CardTitle>
                    <p className="mt-1 text-[10px] text-muted-foreground/70">
                      {engineMeta.label} · {engineMeta.group} · {engineMeta.summary}
                    </p>
                  </div>
                  <div className="text-[10px] text-muted-foreground/70">
                    Last run: <span className="text-foreground">{lastRun}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="min-h-0 space-y-2">
                <Tabs value={tab} onValueChange={setTab} className="min-h-0">
                  <TabsList variant="line" className="h-7 rounded-none border-b border-sidebar-border p-0">
                    <TabsTrigger value="explorer" className="h-7 px-2 text-xs">
                      <TableProperties className="h-3.5 w-3.5" />
                      Explorer
                    </TabsTrigger>
                    <TabsTrigger value="query" className="h-7 px-2 text-xs">
                      <Braces className="h-3.5 w-3.5" />
                      Query
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="explorer" className="space-y-2 pt-2">
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="space-y-1 border border-sidebar-border bg-sidebar/30 p-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                          Data Objects
                        </p>
	                        {fallbackRows(selectedAdapter.studio.objectNoun).map((entity) => (
	                          <div key={entity.object} className="border border-sidebar-border bg-background/30 px-2 py-1.5">
	                            <div className="flex items-center justify-between gap-2 text-xs text-foreground">
	                              <span>{entity.object}</span>
	                              <span className="text-[10px] text-muted-foreground/70">{selectedAdapter.studio.objectNoun}</span>
	                            </div>
                            <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-muted-foreground/70">
                              <span>{entity.records}</span>
                              <span className={entity.health === "healthy" ? "text-emerald-400" : "text-amber-400"}>
                                {entity.health}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1 border border-sidebar-border bg-sidebar/30 p-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                          Adapter Capabilities
                        </p>
                        <div className="border border-sidebar-border bg-background/30 px-2 py-1.5 text-xs text-foreground">
                          Language: {selectedAdapter.capabilities.queryLanguage}
                        </div>
                        <div className="border border-sidebar-border bg-background/30 px-2 py-1.5 text-xs text-foreground">
                          Explorer: {selectedAdapter.capabilities.supportsSchemaExplorer ? "enabled" : "disabled"}
                        </div>
                        <div className="border border-sidebar-border bg-background/30 px-2 py-1.5 text-xs text-foreground">
                          Params: {selectedAdapter.capabilities.supportsQueryParams ? "enabled" : "disabled"}
                        </div>
                        <div className="border border-sidebar-border bg-background/30 px-2 py-1.5 text-xs text-foreground">
                          Transactions: {selectedAdapter.capabilities.supportsTransactions ? "enabled" : "disabled"}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="query" className="flex min-h-0 flex-col gap-2 pt-2">
                    <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
                      <span className="flex items-center gap-2">
                        <span className="rounded-full bg-sidebar/60 px-2 py-0.5 text-[9px] font-semibold">
                          {selectedAdapter.capabilities.queryLanguage.toUpperCase()}
                        </span>
                        <span>{selectedAdapter.studio.queryLabel}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-muted-foreground/70">
                          {lastRun === "never" ? "Not run yet" : `Last run ${lastRun}`}
                        </span>
                      </span>
                    </div>

                    <div className="grid min-h-0 gap-2 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)]">
                      <div className="flex min-h-0 flex-col gap-1">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground/80">
                          <span>Query editor</span>
                          <span className="font-mono text-[9px]">
                            {selected.details.engine}
                          </span>
                        </div>
                        <div className="min-h-[180px] overflow-hidden rounded border border-sidebar-border bg-sidebar/30">
                          <SqlMonacoEditor
                            value={queryDraft}
                            onChange={(value) => setQueryDraft(value ?? "")}
                            height="180px"
                            options={{
                              minimap: { enabled: false },
                              fontSize: 12,
                              lineNumbers: "on",
                              scrollBeyondLastLine: false,
                              wordWrap: "on",
                            }}
                          />
                        </div>
                        {queryError ? (
                          <p className="text-[10px] text-destructive">{queryError}</p>
                        ) : (
                          <p className="text-[10px] text-muted-foreground/70">
                            Press <span className="font-mono">Run</span> to execute against the selected connection.
                          </p>
                        )}
                      </div>

                      <div className="flex min-h-0 flex-col overflow-hidden rounded border border-sidebar-border bg-sidebar/10">
                        <div className="flex items-center justify-between border-b border-sidebar-border bg-sidebar/40 px-2 py-1.5 text-[10px] text-muted-foreground/80">
                          <span className="uppercase tracking-[0.14em]">Result</span>
                          <span className="flex items-center gap-2">
                            {lastMeta ? (
                              <>
                                <span>
                                  {lastMeta.rowCount ?? resultRows.length} rows
                                </span>
                                <span>·</span>
                                <span>{lastMeta.tookMs} ms</span>
                              </>
                            ) : (
                              <span>No runs yet</span>
                            )}
                          </span>
                        </div>
                        <div className="min-h-[140px] flex-1 overflow-auto">
                          <table className="w-full border-collapse text-[11px]">
                            <thead className="sticky top-0 z-10 bg-sidebar/60 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
                              <tr>
                                {resultColumns.map((column) => (
                                  <th
                                    key={column}
                                    className="border-b border-sidebar-border px-2 py-1 text-left font-semibold"
                                  >
                                    {column}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {resultRows.map((row, rowIndex) => (
                                <tr
                                  key={`${row[resultColumns[0] ?? "row"]}-${rowIndex}`}
                                  className={rowIndex % 2 === 0 ? "bg-background" : "bg-sidebar/30"}
                                >
                                  {resultColumns.map((column) => (
                                    <td
                                      key={`${rowIndex}-${column}`}
                                      className="border-t border-sidebar-border px-2 py-1 font-mono text-[10px] text-foreground"
                                    >
                                      {row[column]}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                              {resultRows.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={Math.max(resultColumns.length, 1)}
                                    className="border-t border-sidebar-border px-2 py-4 text-center text-[10px] text-muted-foreground/70"
                                  >
                                    No rows returned.
                                  </td>
                                </tr>
                              ) : null}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                </Tabs>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
