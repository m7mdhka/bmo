"use client";

import { DiMsqlServer } from "react-icons/di";

import type { DatabaseEngineModule, EngineCapabilities, SqlServerConfig } from "@/components/runtime/databases/types";
import { FAMILIES } from "@/components/runtime/databases/types/families";
import { GROUPS } from "@/components/runtime/databases/types/groups";
import { executeSql } from "@/components/runtime/databases/executors/sql";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
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

const definition: EngineDefinition<"SQLServer"> = {
  id: "SQLServer",
  label: "SQL Server",
  group: GROUPS.sql,
  Icon: iconFromReactIcons(DiMsqlServer),
  createDefaultDetails: () => ({
    engine: "SQLServer",
    config: {
      host: "localhost",
      port: 1433,
      database: "master",
      username: "sa",
      password: "",
      encrypt: false,
      trustServerCertificate: true,
    },
  }),
  docker: {
    apply: (details, candidate) => {
      const env = candidate.env ?? {};
      const password = env.SA_PASSWORD ?? env.MSSQL_SA_PASSWORD;
      return {
        ...details,
        config: {
          ...details.config,
          host: candidate.host,
          port: candidate.port,
          username: "sa",
          password: password?.trim().length ? password : details.config.password,
        },
      };
    },
  },
  connectionString: {
    placeholder: "mssql://USER:PASSWORD@HOST:1433/DB?encrypt=true",
    apply: (details, raw) => {
      const u = parseUrl(raw);
      if (!u) return null;
      const port = u.port ? Number(u.port) : 1433;
      if (!Number.isFinite(port) || port <= 0) return null;

      const q = u.searchParams;
      const encrypt = q.get("encrypt");
      const trust = q.get("trustServerCertificate") ?? q.get("trust");

      return {
        ...details,
        config: {
          ...details.config,
          host: u.hostname,
          port,
          database: decodeURIComponent(u.pathname.replace(/^\//, "")) || details.config.database,
          username: decodeURIComponent(u.username || details.config.username),
          password: decodeURIComponent(u.password || details.config.password),
          encrypt: encrypt ? encrypt === "true" || encrypt === "1" : details.config.encrypt,
          trustServerCertificate: trust ? trust === "true" || trust === "1" : details.config.trustServerCertificate,
        },
      };
    },
  },
  summary: (details) => {
    const c = details.config;
    return `${c.host}:${c.port} · ${c.database}${c.encrypt ? " · encrypt" : ""}`;
  },
  validate: (details) => {
    const c = details.config;
    return !!(c.host.trim() && c.port > 0 && c.database.trim() && c.username.trim());
  },
  Fields: ({ details, onChange }) => {
    const c = details.config;
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Host">
          <input
            value={c.host}
            onChange={(e) => onChange({ ...details, config: { ...c, host: e.target.value } })}
            placeholder="localhost"
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
        <Field label="Database">
          <input
            value={c.database}
            onChange={(e) => onChange({ ...details, config: { ...c, database: e.target.value } })}
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
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
        <Field label="Encryption">
          <div className="flex items-center justify-between gap-3 border border-border bg-background px-3 py-2 text-xs">
            <span className="text-muted-foreground">Encrypt</span>
            <ToggleSwitch
              checked={c.encrypt}
              onCheckedChange={(next) => onChange({ ...details, config: { ...c, encrypt: next } })}
            />
          </div>
        </Field>
        <Field label="Certificates">
          <div className="flex items-center justify-between gap-3 border border-border bg-background px-3 py-2 text-xs">
            <span className="text-muted-foreground">Trust server cert</span>
            <ToggleSwitch
              checked={c.trustServerCertificate}
              onCheckedChange={(next) => onChange({ ...details, config: { ...c, trustServerCertificate: next } })}
            />
          </div>
        </Field>
      </div>
    );
  },
  DetailsRows: (details) => {
    const c: SqlServerConfig = details.config;
    return (
      <>
        <DetailRow label="Host" value={c.host} mono />
        <DetailRow label="Port" value={String(c.port)} mono />
        <DetailRow label="Database" value={c.database} mono />
        <DetailRow label="Username" value={c.username} mono />
        <DetailRow label="Password" value={maskSecret(c.password)} mono />
        <DetailRow label="Encrypt" value={c.encrypt ? "on" : "off"} />
        <DetailRow label="Trust cert" value={c.trustServerCertificate ? "on" : "off"} />
      </>
    );
  },
};

export const sqlserver: DatabaseEngineModule<"SQLServer"> = {
  id: "SQLServer",
  family: FAMILIES.relational,
  definition,
  capabilities: SQL_CAPABILITIES,
  studio: {
    queryLabel: "SQL Query",
    starterQuery: "SELECT 1;",
    objectNoun: "table",
  },
  executeQuery: ({ connectionId, queryText }) => executeSql({ connectionId, queryText }),
};

