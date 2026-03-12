"use client";

import { useMemo, useState } from "react";
import { Plus, Server } from "lucide-react";

import type { DbConfig, DbConn, DbEngine } from "./types";
import { createDefaultDetails } from "./defaults";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function newId() {
  try {
    return crypto.randomUUID();
  } catch {
    return String(Date.now());
  }
}

export function AddConnectionButton({ onAdd }: { onAdd: (c: DbConn) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [details, setDetails] = useState<DbConfig>(() => createDefaultDetails("Postgres"));

  const engine = details.engine;

  const canSave = useMemo(() => {
    if (!name.trim()) return false;
    if (engine === "MongoDB") return details.config.uri.trim().length > 0;
    if (engine === "SQLite") return details.config.filePath.trim().length > 0;
    if (engine === "Redis") return details.config.host.trim().length > 0 && details.config.port > 0;
    return (
      details.config.host.trim().length > 0 &&
      details.config.port > 0 &&
      details.config.database.trim().length > 0 &&
      details.config.username.trim().length > 0
    );
  }, [name, details, engine]);

  function reset() {
    setName("");
    setDetails(createDefaultDetails("Postgres"));
  }

  function save() {
    if (!canSave) return;
    onAdd({
      id: newId(),
      name: name.trim(),
      engine: details.engine,
      details,
      status: "disconnected",
      lastChecked: "never",
    });
    setOpen(false);
    reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="xs">
          <Plus className="h-3 w-3" />
          Add connection
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add database connection</DialogTitle>
          <DialogDescription>
            Enter connection details for this engine. Fields change based on the selected database.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Local Postgres"
              className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Engine">
              <select
                value={engine}
                onChange={(e) => setDetails(createDefaultDetails(e.target.value as DbEngine))}
                className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                <option value="Postgres">Postgres</option>
                <option value="MySQL">MySQL</option>
                <option value="MongoDB">MongoDB</option>
                <option value="Redis">Redis</option>
                <option value="SQLite">SQLite</option>
              </select>
            </Field>
            {engine !== "MongoDB" && engine !== "SQLite" ? (
              <Field label="Host">
                <div className="flex items-center gap-2 border border-border bg-background px-3 py-2 text-xs">
                  <Server className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                  <input
                    value={details.config.host}
                    onChange={(e) => {
                      const host = e.target.value;
                      setDetails((prev) => {
                        if (prev.engine === "Redis") return { ...prev, config: { ...prev.config, host } };
                        if (prev.engine === "Postgres" || prev.engine === "MySQL")
                          return { ...prev, config: { ...prev.config, host } };
                        return prev;
                      });
                    }}
                    placeholder="localhost"
                    className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                  />
                </div>
              </Field>
            ) : null}
          </div>

          <EngineFields details={details} onChange={setDetails} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
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

function EngineFields({
  details,
  onChange,
}: {
  details: DbConfig;
  onChange: (next: DbConfig) => void;
}) {
  if (details.engine === "MongoDB") {
    return (
      <div className="space-y-3">
        <Field label="Connection string (URI)">
          <input
            value={details.config.uri}
            onChange={(e) => onChange({ ...details, config: { uri: e.target.value } })}
            placeholder="mongodb://localhost:27017/bmo"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
          <p className="mt-1 text-[10px] text-muted-foreground/70">
            Include credentials in the URI if needed:{" "}
            <span className="font-mono">mongodb://user:pass@host:27017/db</span>
          </p>
        </Field>
      </div>
    );
  }

  if (details.engine === "SQLite") {
    return (
      <div className="space-y-3">
        <Field label="Database file path">
          <input
            value={details.config.filePath}
            onChange={(e) => onChange({ ...details, config: { ...details.config, filePath: e.target.value } })}
            placeholder="./data/app.sqlite"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
        <Field label="Mode">
          <label className="flex items-center justify-between gap-3 border border-border bg-background px-3 py-2 text-xs">
            <span className="text-muted-foreground">Read-only</span>
            <input
              type="checkbox"
              checked={details.config.readOnly}
              onChange={(e) => onChange({ ...details, config: { ...details.config, readOnly: e.target.checked } })}
              className="h-4 w-4 accent-primary"
            />
          </label>
        </Field>
      </div>
    );
  }

  if (details.engine === "Redis") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Port">
          <input
            value={String(details.config.port)}
            onChange={(e) =>
              onChange({ ...details, config: { ...details.config, port: Number(e.target.value || 0) } })
            }
            placeholder="6379"
            inputMode="numeric"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
        <Field label="DB index (optional)">
          <input
            value={typeof details.config.db === "number" ? String(details.config.db) : ""}
            onChange={(e) =>
              onChange({
                ...details,
                config: {
                  ...details.config,
                  db: e.target.value.trim().length ? Number(e.target.value) : undefined,
                },
              })
            }
            placeholder="0"
            inputMode="numeric"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
        <Field label="Username (optional)">
          <input
            value={details.config.username ?? ""}
            onChange={(e) =>
              onChange({
                ...details,
                config: { ...details.config, username: e.target.value.trim().length ? e.target.value : undefined },
              })
            }
            placeholder="default"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
        <Field label="Password (optional)">
          <input
            value={details.config.password ?? ""}
            onChange={(e) =>
              onChange({
                ...details,
                config: { ...details.config, password: e.target.value.trim().length ? e.target.value : undefined },
              })
            }
            placeholder="(optional)"
            type="password"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
        <Field label="TLS">
          <label className="flex items-center justify-between gap-3 border border-border bg-background px-3 py-2 text-xs">
            <span className="text-muted-foreground">Enable TLS</span>
            <input
              type="checkbox"
              checked={details.config.tls}
              onChange={(e) => onChange({ ...details, config: { ...details.config, tls: e.target.checked } })}
              className="h-4 w-4 accent-primary"
            />
          </label>
        </Field>
        <div className="border border-border bg-secondary/30 p-3 text-[10px] text-muted-foreground/70 sm:col-span-2">
          <p className="font-semibold uppercase tracking-[0.16em] text-muted-foreground">Example</p>
          <p className="mt-1 font-mono">redis://HOST:6379</p>
        </div>
      </div>
    );
  }

  // Postgres / MySQL
  const placeholderPort = details.engine === "Postgres" ? "5432" : "3306";
  const placeholderUser = details.engine === "Postgres" ? "postgres" : "root";
  const example =
    details.engine === "Postgres" ? "postgres://USER:PASSWORD@HOST:5432/DB" : "mysql://USER:PASSWORD@HOST:3306/DB";

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Port">
        <input
          value={String(details.config.port)}
          onChange={(e) =>
            onChange({ ...details, config: { ...details.config, port: Number(e.target.value || 0) } })
          }
          placeholder={placeholderPort}
          inputMode="numeric"
          className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </Field>
      <Field label="Database">
        <input
          value={details.config.database}
          onChange={(e) => onChange({ ...details, config: { ...details.config, database: e.target.value } })}
          placeholder="bmo"
          className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </Field>
      <Field label="Username">
        <input
          value={details.config.username}
          onChange={(e) => onChange({ ...details, config: { ...details.config, username: e.target.value } })}
          placeholder={placeholderUser}
          className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </Field>
      <Field label="Password">
        <input
          value={details.config.password}
          onChange={(e) => onChange({ ...details, config: { ...details.config, password: e.target.value } })}
          placeholder="(optional)"
          type="password"
          className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </Field>
      <Field label="SSL">
        <select
          value={details.config.ssl}
          onChange={(e) => onChange({ ...details, config: { ...details.config, ssl: e.target.value as "disable" | "require" } })}
          className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
        >
          <option value="disable">Disable</option>
          <option value="require">Require</option>
        </select>
      </Field>
      <div className="border border-border bg-secondary/30 p-3 text-[10px] text-muted-foreground/70 sm:col-span-2">
        <p className="font-semibold uppercase tracking-[0.16em] text-muted-foreground">Example</p>
        <p className="mt-1 font-mono">{example}</p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}
