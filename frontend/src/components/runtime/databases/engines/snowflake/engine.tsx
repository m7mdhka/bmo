"use client";

import { SiSnowflake } from "react-icons/si";

import type { DatabaseEngineModule, EngineCapabilities, SnowflakeConfig } from "@/components/runtime/databases/types";
import { FAMILIES } from "@/components/runtime/databases/types/families";
import { GROUPS } from "@/components/runtime/databases/types/groups";
import { executeSql } from "@/components/runtime/databases/executors/sql";
import { DetailRow } from "@/components/runtime/databases/ui/components/detail-row";
import type { EngineDefinition } from "@/components/runtime/databases/types/engine-definition";
import { Field } from "@/components/runtime/databases/ui/connections/form/field";
import { parseUrl } from "@/components/runtime/databases/ui/connections/shared/connection-string";
import { maskSecret } from "@/components/runtime/databases/ui/connections/shared/secrets";
import { iconFromReactIcons } from "@/components/runtime/databases/ui/connections/shared/react-icons";

const SQL_CAPABILITIES: EngineCapabilities = {
  queryLanguage: "sql",
  supportsSchemaExplorer: true,
  supportsQueryParams: true,
  supportsTransactions: true,
  supportsStreamingResults: false,
};

const definition: EngineDefinition<"Snowflake"> = {
  id: "Snowflake",
  label: "Snowflake",
  group: GROUPS.analytics,
  Icon: iconFromReactIcons(SiSnowflake),
  createDefaultDetails: () => ({
    engine: "Snowflake",
    config: {
      account: "",
      warehouse: "",
      database: "",
      schema: "PUBLIC",
      username: "",
      password: "",
      role: "",
    },
  }),
  connectionString: {
    placeholder: "snowflake://USER:PASSWORD@ACCOUNT/?warehouse=WH&database=DB&schema=SCHEMA&role=ROLE",
    apply: (details, raw) => {
      const u = parseUrl(raw);
      if (!u) return null;
      const q = u.searchParams;
      return {
        ...details,
        config: {
          ...details.config,
          account: u.hostname || details.config.account,
          username: decodeURIComponent(u.username || details.config.username),
          password: decodeURIComponent(u.password || details.config.password),
          warehouse: q.get("warehouse") ?? details.config.warehouse,
          database: q.get("database") ?? details.config.database,
          schema: q.get("schema") ?? details.config.schema,
          role: q.get("role") ?? details.config.role,
        },
      };
    },
  },
  summary: (details) => {
    const c = details.config;
    const bits = [c.account, c.database, c.schema].filter(Boolean);
    return bits.join(" · ") || "not configured";
  },
  validate: (details) => {
    const c = details.config;
    return !!(c.account.trim() && c.warehouse.trim() && c.database.trim() && c.schema.trim() && c.username.trim());
  },
  Fields: ({ details, onChange }) => {
    const c = details.config;
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Account">
          <input
            value={c.account}
            onChange={(e) => onChange({ ...details, config: { ...c, account: e.target.value } })}
            placeholder="xy12345.us-east-1"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
        <Field label="Warehouse">
          <input
            value={c.warehouse}
            onChange={(e) => onChange({ ...details, config: { ...c, warehouse: e.target.value } })}
            placeholder="COMPUTE_WH"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
        <Field label="Database">
          <input
            value={c.database}
            onChange={(e) => onChange({ ...details, config: { ...c, database: e.target.value } })}
            placeholder="MY_DB"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
        <Field label="Schema">
          <input
            value={c.schema}
            onChange={(e) => onChange({ ...details, config: { ...c, schema: e.target.value } })}
            placeholder="PUBLIC"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
        <Field label="Username">
          <input
            value={c.username}
            onChange={(e) => onChange({ ...details, config: { ...c, username: e.target.value } })}
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
        <Field label="Password">
          <input
            value={c.password}
            onChange={(e) => onChange({ ...details, config: { ...c, password: e.target.value } })}
            type="password"
            placeholder="(optional)"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
        <Field label="Role (optional)" className="sm:col-span-2">
          <input
            value={c.role ?? ""}
            onChange={(e) => onChange({ ...details, config: { ...c, role: e.target.value || undefined } })}
            placeholder="(optional)"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
      </div>
    );
  },
  DetailsRows: (details) => {
    const c: SnowflakeConfig = details.config;
    return (
      <>
        <DetailRow label="Account" value={c.account} mono />
        <DetailRow label="Warehouse" value={c.warehouse} mono />
        <DetailRow label="Database" value={c.database} mono />
        <DetailRow label="Schema" value={c.schema} mono />
        <DetailRow label="Username" value={c.username} mono />
        <DetailRow label="Password" value={maskSecret(c.password)} mono />
        <DetailRow label="Role" value={c.role?.trim().length ? c.role : "—"} mono />
      </>
    );
  },
};

export const snowflake: DatabaseEngineModule<"Snowflake"> = {
  id: "Snowflake",
  family: FAMILIES.analytics,
  definition,
  capabilities: SQL_CAPABILITIES,
  studio: {
    queryLabel: "SQL Query",
    starterQuery: "SELECT * FROM INFORMATION_SCHEMA.TABLES LIMIT 25;",
    objectNoun: "table",
  },
  executeQuery: ({ connectionId, queryText }) => executeSql({ connectionId, queryText }),
};

