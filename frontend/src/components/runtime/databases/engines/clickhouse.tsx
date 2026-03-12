"use client";

import { SiClickhouse } from "react-icons/si";

import type { EngineDefinition } from "../engine-definition";
import type { ClickHouseConfig } from "../types";
import { Field } from "../form/field";
import { DetailRow } from "../detail-row";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { parseUrl } from "../shared/connection-string";
import { maskSecret } from "../shared/secrets";
import { iconFromReactIcons } from "../shared/react-icons";

export const clickhouseEngine: EngineDefinition<"ClickHouse"> = {
  id: "ClickHouse",
  label: "ClickHouse",
  group: "Analytics",
  Icon: iconFromReactIcons(SiClickhouse),
  createDefaultDetails: () => ({
    engine: "ClickHouse",
    config: {
      host: "localhost",
      port: 8123,
      database: "default",
      secure: false,
      username: "",
      password: "",
    },
  }),
  docker: {
    apply: (details, candidate) => {
      const env = candidate.env ?? {};
      return {
        ...details,
        config: {
          ...details.config,
          host: candidate.host,
          port: candidate.port,
          database: env.CLICKHOUSE_DB?.trim().length ? env.CLICKHOUSE_DB : details.config.database,
          username: env.CLICKHOUSE_USER?.trim().length ? env.CLICKHOUSE_USER : details.config.username,
          password: env.CLICKHOUSE_PASSWORD?.trim().length ? env.CLICKHOUSE_PASSWORD : details.config.password,
        },
      };
    },
  },
  connectionString: {
    placeholder: "http(s)://USER:PASSWORD@HOST:8123/DB",
    apply: (details, raw) => {
      const u = parseUrl(raw);
      if (!u) return null;
      const port = u.port ? Number(u.port) : 8123;
      if (!Number.isFinite(port) || port <= 0) return null;
      const database = decodeURIComponent(u.pathname.replace(/^\//, "")) || details.config.database;
      const secure = u.protocol === "https:";
      return {
        ...details,
        config: {
          ...details.config,
          host: u.hostname,
          port,
          database,
          secure,
          username: decodeURIComponent(u.username || details.config.username || ""),
          password: decodeURIComponent(u.password || details.config.password || ""),
        },
      };
    },
  },
  summary: (details) => {
    const c = details.config;
    return `${c.host}:${c.port} · ${c.database}${c.secure ? " · https" : ""}`;
  },
  validate: (details) => {
    const c = details.config;
    return !!(c.host.trim() && c.port > 0 && c.database.trim());
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
            placeholder="default"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
        <Field label="Secure">
          <div className="flex items-center justify-between gap-3 border border-border bg-background px-3 py-2 text-xs">
            <span className="text-muted-foreground">HTTPS</span>
            <ToggleSwitch
              checked={c.secure}
              onCheckedChange={(next) => onChange({ ...details, config: { ...c, secure: next } })}
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
            type="password"
            placeholder="(optional)"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
      </div>
    );
  },
  DetailsRows: (details) => {
    const c: ClickHouseConfig = details.config;
    return (
      <>
        <DetailRow label="Host" value={c.host} mono />
        <DetailRow label="Port" value={String(c.port)} mono />
        <DetailRow label="Database" value={c.database} mono />
        <DetailRow label="Secure" value={c.secure ? "https" : "http"} />
        <DetailRow label="Username" value={c.username?.trim().length ? c.username : "—"} mono />
        <DetailRow label="Password" value={maskSecret(c.password)} mono />
      </>
    );
  },
};
