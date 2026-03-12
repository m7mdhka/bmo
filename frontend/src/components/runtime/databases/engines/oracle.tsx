"use client";

import { Database as LucideDatabase } from "lucide-react";

import type { EngineDefinition } from "../engine-definition";
import type { OracleConfig } from "../types";
import { Field } from "../form/field";
import { DetailRow } from "../detail-row";
import { parseUrl } from "../shared/connection-string";
import { maskSecret } from "../shared/secrets";

export const oracleEngine: EngineDefinition<"Oracle"> = {
  id: "Oracle",
  label: "Oracle",
  group: "SQL",
  Icon: LucideDatabase,
  createDefaultDetails: () => ({
    engine: "Oracle",
    config: {
      host: "localhost",
      port: 1521,
      serviceName: "ORCLCDB",
      username: "system",
      password: "",
    },
  }),
  docker: {
    apply: (details, candidate) => {
      const env = candidate.env ?? {};
      const serviceName =
        env.ORACLE_PDB?.trim().length ? env.ORACLE_PDB : env.ORACLE_SID?.trim().length ? env.ORACLE_SID : undefined;
      const password = env.ORACLE_PWD ?? env.ORACLE_PASSWORD;
      return {
        ...details,
        config: {
          ...details.config,
          host: candidate.host,
          port: candidate.port,
          serviceName: serviceName ?? details.config.serviceName,
          password: password?.trim().length ? password : details.config.password,
        },
      };
    },
  },
  connectionString: {
    placeholder: "oracle://USER:PASSWORD@HOST:1521/SERVICE",
    apply: (details, raw) => {
      const u = parseUrl(raw);
      if (!u) return null;
      const port = u.port ? Number(u.port) : 1521;
      if (!Number.isFinite(port) || port <= 0) return null;
      const serviceName = decodeURIComponent(u.pathname.replace(/^\//, ""));
      if (!serviceName) return null;
      return {
        ...details,
        config: {
          ...details.config,
          host: u.hostname,
          port,
          serviceName,
          username: decodeURIComponent(u.username || details.config.username),
          password: decodeURIComponent(u.password || details.config.password),
        },
      };
    },
  },
  summary: (details) => `${details.config.host}:${details.config.port} · ${details.config.serviceName}`,
  validate: (details) => {
    const c = details.config;
    return !!(c.host.trim() && c.port > 0 && c.serviceName.trim() && c.username.trim());
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
        <Field label="Service name">
          <input
            value={c.serviceName}
            onChange={(e) => onChange({ ...details, config: { ...c, serviceName: e.target.value } })}
            placeholder="ORCLCDB"
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
      </div>
    );
  },
  DetailsRows: (details) => {
    const c: OracleConfig = details.config;
    return (
      <>
        <DetailRow label="Host" value={c.host} mono />
        <DetailRow label="Port" value={String(c.port)} mono />
        <DetailRow label="Service" value={c.serviceName} mono />
        <DetailRow label="Username" value={c.username} mono />
        <DetailRow label="Password" value={maskSecret(c.password)} mono />
      </>
    );
  },
};
