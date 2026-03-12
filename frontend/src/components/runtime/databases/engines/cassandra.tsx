"use client";

import { SiApachecassandra } from "react-icons/si";

import type { EngineDefinition } from "../engine-definition";
import type { CassandraConfig } from "../types";
import { Field } from "../form/field";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { DetailRow } from "../detail-row";
import { iconFromReactIcons } from "../shared/react-icons";

export const cassandraEngine: EngineDefinition<"Cassandra"> = {
  id: "Cassandra",
  label: "Cassandra",
  group: "NoSQL",
  Icon: iconFromReactIcons(SiApachecassandra),
  createDefaultDetails: () => ({ engine: "Cassandra", config: { hosts: "localhost", port: 9042, keyspace: "bmo", ssl: false } }),
  docker: {
    apply: (details, candidate) => ({
      ...details,
      config: {
        ...details.config,
        hosts: candidate.host,
        port: candidate.port,
      },
    }),
  },
  summary: (details) => `${details.config.hosts}:${details.config.port} · ${details.config.keyspace}`,
  validate: (details) => !!(details.config.hosts.trim() && details.config.port > 0 && details.config.keyspace.trim()),
  Fields: ({ details, onChange }) => {
    const c = details.config;
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Hosts">
          <input
            value={c.hosts}
            onChange={(e) => onChange({ ...details, config: { ...c, hosts: e.target.value } })}
            placeholder="host1,host2"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
        <Field label="Port">
          <input
            value={String(c.port)}
            onChange={(e) => onChange({ ...details, config: { ...c, port: Number(e.target.value || 0) } })}
            inputMode="numeric"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
        <Field label="Keyspace">
          <input
            value={c.keyspace}
            onChange={(e) => onChange({ ...details, config: { ...c, keyspace: e.target.value } })}
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
        <Field label="SSL">
          <div className="flex items-center justify-between gap-3 border border-border bg-background px-3 py-2 text-xs">
            <span className="text-muted-foreground">Enable SSL</span>
            <ToggleSwitch checked={c.ssl} onCheckedChange={(next) => onChange({ ...details, config: { ...c, ssl: next } })} />
          </div>
        </Field>
        <Field label="Username (optional)">
          <input
            value={c.username ?? ""}
            onChange={(e) => onChange({ ...details, config: { ...c, username: e.target.value || undefined } })}
            placeholder="(optional)"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
        <Field label="Password (optional)">
          <input
            value={c.password ?? ""}
            onChange={(e) => onChange({ ...details, config: { ...c, password: e.target.value || undefined } })}
            placeholder="(optional)"
            type="password"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
      </div>
    );
  },
  DetailsRows: (details) => {
    const c: CassandraConfig = details.config;
    return (
      <>
        <DetailRow label="Hosts" value={c.hosts} mono />
        <DetailRow label="Port" value={String(c.port)} mono />
        <DetailRow label="Keyspace" value={c.keyspace} mono />
        <DetailRow label="SSL" value={c.ssl ? "enabled" : "disabled"} />
        <DetailRow label="Username" value={c.username?.length ? c.username : "—"} mono />
        <DetailRow label="Password" value={c.password?.length ? "********" : "—"} mono />
      </>
    );
  },
};
