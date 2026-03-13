"use client";

import { SiRedis } from "react-icons/si";

import type { DatabaseEngineModule, EngineCapabilities, RedisConfig } from "@/components/runtime/databases/types";
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

const definition: EngineDefinition<"Redis"> = {
  id: "Redis",
  label: "Redis",
  group: GROUPS.keyvalue,
  Icon: iconFromReactIcons(SiRedis),
  createDefaultDetails: () => ({ engine: "Redis", config: { host: "localhost", port: 6379, tls: false } }),
  docker: {
    apply: (details, candidate) => ({
      ...details,
      config: {
        ...details.config,
        host: candidate.host,
        port: candidate.port,
      },
    }),
  },
  summary: (details) => {
    const c = details.config;
    return `${c.host}:${c.port}${typeof c.db === "number" ? ` · db ${c.db}` : ""}${c.tls ? " · tls" : ""}`;
  },
  validate: (details) => !!(details.config.host.trim() && details.config.port > 0),
  Fields: ({ details, onChange }) => {
    const c = details.config;
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Host">
          <input
            value={c.host}
            onChange={(e) => onChange({ ...details, config: { ...c, host: e.target.value } })}
            placeholder="localhost"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
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
        <Field label="DB index (optional)">
          <input
            value={typeof c.db === "number" ? String(c.db) : ""}
            onChange={(e) =>
              onChange({
                ...details,
                config: { ...c, db: e.target.value.trim().length ? Number(e.target.value) : undefined },
              })
            }
            inputMode="numeric"
            placeholder="0"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
        <Field label="TLS">
          <div className="flex items-center justify-between gap-3 border border-border bg-background px-3 py-2 text-xs">
            <span className="text-muted-foreground">Enable TLS</span>
            <ToggleSwitch
              checked={c.tls}
              onCheckedChange={(next) => onChange({ ...details, config: { ...c, tls: next } })}
            />
          </div>
        </Field>
      </div>
    );
  },
  DetailsRows: (details) => {
    const c: RedisConfig = details.config;
    return (
      <>
        <DetailRow label="Host" value={c.host} mono />
        <DetailRow label="Port" value={String(c.port)} mono />
        <DetailRow label="DB index" value={typeof c.db === "number" ? String(c.db) : "—"} mono />
        <DetailRow label="TLS" value={c.tls ? "enabled" : "disabled"} />
        <DetailRow label="Username" value={c.username?.length ? c.username : "—"} mono />
        <DetailRow label="Password" value={c.password?.length ? "********" : "—"} mono />
      </>
    );
  },
};

export const redis: DatabaseEngineModule<"Redis"> = {
  id: "Redis",
  family: FAMILIES.keyvalue,
  definition,
  capabilities: JSON_CAPABILITIES,
  studio: {
    queryLabel: "Command",
    starterQuery: '{ "operation": "command", "payload": { "command": "SCAN", "cursor": 0, "count": 50 } }',
    objectNoun: "key",
  },
  executeQuery: ({ connectionId, queryText }) => executeJson({ connectionId, queryText }),
};

