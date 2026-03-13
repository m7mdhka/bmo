"use client";

import { SiApachecassandra } from "react-icons/si";

import type { CassandraConfig, DatabaseEngineModule, EngineCapabilities } from "@/components/runtime/databases/types";
import { FAMILIES } from "@/components/runtime/databases/types/families";
import { GROUPS } from "@/components/runtime/databases/types/groups";
import { executeJson } from "@/components/runtime/databases/executors/json";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { DetailRow } from "@/components/runtime/databases/ui/components/detail-row";
import type { EngineDefinition } from "@/components/runtime/databases/types/engine-definition";
import { Field } from "@/components/runtime/databases/ui/connections/form/field";
import { iconFromReactIcons } from "@/components/runtime/databases/ui/connections/shared/react-icons";

const JSON_CAPABILITIES: EngineCapabilities = {
  queryLanguage: "json",
  supportsSchemaExplorer: true,
  supportsQueryParams: false,
  supportsTransactions: false,
  supportsStreamingResults: false,
};

const definition: EngineDefinition<"Cassandra"> = {
  id: "Cassandra",
  label: "Cassandra",
  group: GROUPS.widecolumn,
  Icon: iconFromReactIcons(SiApachecassandra),
  createDefaultDetails: () => ({
    engine: "Cassandra",
    config: { hosts: "localhost", port: 9042, keyspace: "bmo", ssl: false },
  }),
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
            <ToggleSwitch
              checked={c.ssl}
              onCheckedChange={(next) => onChange({ ...details, config: { ...c, ssl: next } })}
            />
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

export const cassandra: DatabaseEngineModule<"Cassandra"> = {
  id: "Cassandra",
  family: FAMILIES.widecolumn,
  definition,
  capabilities: JSON_CAPABILITIES,
  studio: {
    queryLabel: "Query Payload",
    starterQuery: '{ "operation": "find", "payload": { "table": "users", "limit": 20 } }',
    objectNoun: "table",
  },
  executeQuery: ({ connectionId, queryText }) => executeJson({ connectionId, queryText }),
};

