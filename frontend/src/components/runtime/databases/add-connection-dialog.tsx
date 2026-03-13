"use client";

import { useMemo, useState } from "react";
import { Container, Pencil, Plus, RefreshCw } from "lucide-react";

import type { DbConn, DbDetails, DbEngine, DockerDbCandidate } from "./types";
import {
  ENGINE_DEFINITIONS,
  ENGINE_FAMILY_GROUPS,
  getEngineDefinition,
  withEngineDefinition,
} from "./registry";
import { Field } from "./form/field";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function newId() {
  try {
    return crypto.randomUUID();
  } catch {
    return String(Date.now());
  }
}

type ConnectionDialogMode = "add" | "edit";

type ConnectionDraft = {
  name: string;
  details: DbDetails;
};

function ConnectionDialog({
  mode,
  initialConn,
  initialDraft,
  onClose,
  onSave,
}: {
  mode: ConnectionDialogMode;
  initialConn?: DbConn;
  initialDraft?: ConnectionDraft;
  onClose: () => void;
  onSave: (next: ConnectionDraft) => void;
}) {
  const [name, setName] = useState(() => {
    if (mode === "edit" && initialConn) return initialConn.name;
    if (initialDraft) return initialDraft.name;
    return "";
  });
  const [details, setDetails] = useState<DbDetails>(() => {
    if (mode === "edit" && initialConn) return initialConn.details;
    if (initialDraft) return initialDraft.details;
    return getEngineDefinition("Postgres").createDefaultDetails();
  });
  const [connStr, setConnStr] = useState("");
  const [connStrError, setConnStrError] = useState("");

  const engineLabel = withEngineDefinition(details, (def) => def.label);
  const connectionString = withEngineDefinition(details, (def) => def.connectionString);

  const canSave = useMemo(() => {
    if (!name.trim()) return false;
    return withEngineDefinition(details, (def, d) => def.validate(d));
  }, [name, details]);

  function save() {
    if (!canSave) return;
    onSave({ name: name.trim(), details });
    onClose();
  }

  return (
    <Dialog open onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add database connection" : "Edit database connection"}
          </DialogTitle>
          <DialogDescription>Configure name, engine, and connection details.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <section className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Name and engine
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`Local ${engineLabel}`}
                  className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </Field>
              <Field label="Engine">
                <select
                  value={details.engine}
                  onChange={(e) => {
                    setConnStr("");
                    setConnStrError("");
                    setDetails(
                      getEngineDefinition(e.target.value as DbEngine).createDefaultDetails(),
                    );
                  }}
                  className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
                >
                  {ENGINE_FAMILY_GROUPS.map((family) => (
                    <optgroup key={family.id} label={family.label}>
                      {ENGINE_DEFINITIONS.filter((d) => family.engineIds.includes(d.id)).map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          <Separator />

          <section className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Connection string
            </p>
            <div className="flex items-center gap-2">
              <input
                value={connStr}
                onChange={(e) => {
                  setConnStr(e.target.value);
                  setConnStrError("");
                }}
                placeholder={connectionString?.placeholder ?? "Not available for this engine"}
                disabled={!connectionString}
                className="h-8 flex-1 border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground/50 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="h-8"
                disabled={!connectionString}
                onClick={() => {
                  withEngineDefinition(details, (def, d) => {
                    if (!def.connectionString) return;
                    const next = def.connectionString.apply(d as never, connStr);
                    if (!next) {
                      setConnStrError("Could not parse connection string.");
                      return;
                    }
                    setDetails(next);
                    setConnStrError("");
                  });
                }}
              >
                Apply
              </Button>
            </div>
            {connStrError ? <p className="text-[10px] text-destructive">{connStrError}</p> : null}
            {!connectionString ? (
              <p className="text-[10px] text-muted-foreground/70">
                This engine does not support parsing a connection string yet. Use the fields below.
              </p>
            ) : null}
          </section>

          <Separator />

          <section className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Field connections
            </p>
            {withEngineDefinition(details, (def, d) =>
              def.Fields({ details: d as never, onChange: (next) => setDetails(next) }),
            )}
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!canSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DockerPickerDialog({
  onSelect,
}: {
  onSelect: (candidate: DockerDbCandidate) => void;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<DockerDbCandidate[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/docker/databases", { method: "GET" });
      const data = (await res.json()) as { items?: DockerDbCandidate[]; error?: string };
      if (!res.ok) {
        setItems([]);
        setError(data.error ?? "Failed to query Docker.");
        return;
      }
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setItems([]);
      setError("Failed to query Docker.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
    const q = norm(query.trim());
    if (!q) return items;
    return items.filter((i) => {
      const hay = norm(`${i.containerName} ${i.image} ${i.engine} ${i.host}:${i.port}`);
      return hay.includes(q);
    });
  }, [items, query]);

  return (
    <>
      <Button
        size="xs"
        variant="outline"
        onClick={async () => {
          setOpen(true);
          setItems([]);
          setQuery("");
          setError("");
          await load();
        }}
      >
        <Container className="h-3 w-3" />
        Connect from Docker
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Connect from Docker</DialogTitle>
          <DialogDescription>Select a running database container that exposes a port.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center border border-border bg-background px-2 py-1 text-xs">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search containers..."
                className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={loading}
              onClick={load}
              title="Refresh list"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </Button>
          </div>

          {error ? (
            <div className="border border-dashed border-border bg-card px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="border border-dashed border-border bg-card px-3 py-2 text-xs text-muted-foreground">
              Loading containers...
            </div>
          ) : filtered.length === 0 ? (
            <div className="border border-dashed border-border bg-card px-3 py-2 text-xs text-muted-foreground">
              No matching running database containers found.
            </div>
          ) : (
            <div className="max-h-[360px] space-y-1 overflow-auto border border-border bg-background p-1">
              {filtered.map((c) => (
                <button
                  key={c.containerId}
                  type="button"
                  onClick={() => {
                    onSelect(c);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-2 border border-transparent px-2.5 py-2 text-left text-xs text-muted-foreground hover:border-border hover:bg-secondary/50 hover:text-foreground"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">
                      {c.containerName || c.containerId.slice(0, 12)}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground/70">
                      {c.engine} · {c.host}:{c.port} · {c.image}
                    </p>
                  </div>
                  <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                    Select
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    </>
  );
}

export function AddConnectionButton({ onAdd }: { onAdd: (c: DbConn) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="xs" onClick={() => setOpen(true)}>
        <Plus className="h-3 w-3" />
        Add connection
      </Button>
      {open ? (
        <ConnectionDialog
          mode="add"
          onClose={() => setOpen(false)}
          onSave={({ name, details }) => {
            onAdd({
              id: newId(),
              name,
              details,
              status: "disconnected",
              lastChecked: "never",
            });
          }}
        />
      ) : null}
    </>
  );
}

export function ConnectFromDockerButton({ onAdd }: { onAdd: (c: DbConn) => void }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<ConnectionDraft | undefined>(undefined);

  return (
    <>
      <DockerPickerDialog
        onSelect={(c) => {
          const base = getEngineDefinition(c.engine).createDefaultDetails();
          const nextDetails = withEngineDefinition(base, (def, d) =>
            def.docker ? def.docker.apply(d as never, c as never) : d,
          );
          setDraft({
            name: c.containerName || `${c.engine} ${c.host}:${c.port}`,
            details: nextDetails,
          });
          setDialogOpen(true);
        }}
      />

      {dialogOpen ? (
        <ConnectionDialog
          mode="add"
          initialDraft={draft}
          onClose={() => setDialogOpen(false)}
          onSave={({ name, details }) => {
            onAdd({
              id: newId(),
              name,
              details,
              status: "disconnected",
              lastChecked: "never",
            });
          }}
        />
      ) : null}
    </>
  );
}

export function EditConnectionButton({
  conn,
  onUpdate,
}: {
  conn: DbConn;
  onUpdate: (next: DbConn) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="xs" onClick={() => setOpen(true)}>
        <Pencil className="h-3 w-3" />
        Edit
      </Button>
      {open ? (
        <ConnectionDialog
          mode="edit"
          initialConn={conn}
          onClose={() => setOpen(false)}
          onSave={({ name, details }) => onUpdate({ ...conn, name, details })}
        />
      ) : null}
    </>
  );
}
