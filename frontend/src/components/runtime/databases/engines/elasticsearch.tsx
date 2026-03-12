"use client";

import { SiElasticsearch } from "react-icons/si";

import type { EngineDefinition } from "../engine-definition";
import type { SearchConfig } from "../types";
import { Field } from "../form/field";
import { DetailRow } from "../detail-row";
import { parseUrl } from "../shared/connection-string";
import { iconFromReactIcons } from "../shared/react-icons";

export const elasticsearchEngine: EngineDefinition<"Elasticsearch"> = {
  id: "Elasticsearch",
  label: "Elasticsearch",
  group: "Search",
  Icon: iconFromReactIcons(SiElasticsearch),
  createDefaultDetails: () => ({ engine: "Elasticsearch", config: { url: "http://localhost:9200", authMode: "none" } }),
  docker: {
    apply: (details, candidate) => {
      const env = candidate.env ?? {};
      const password = env.ELASTIC_PASSWORD;

      return {
        ...details,
        config: {
          ...details.config,
          url: `http://${candidate.host}:${candidate.port}`,
          authMode: password ? "basic" : "none",
          username: password ? "elastic" : undefined,
          password: password ? password : undefined,
          apiKey: undefined,
        },
      };
    },
  },
  connectionString: {
    placeholder: "http(s)://USER:PASSWORD@HOST:9200",
    apply: (details, raw) => {
      const u = parseUrl(raw);
      if (!u) return null;
      const next: SearchConfig = {
        ...details.config,
        url: u.origin,
        authMode: u.username || u.password ? "basic" : "none",
        username: u.username ? decodeURIComponent(u.username) : undefined,
        password: u.password ? decodeURIComponent(u.password) : undefined,
      };
      return { ...details, config: next };
    },
  },
  summary: (details) => details.config.url,
  validate: (details) => {
    const c = details.config;
    if (!c.url.trim()) return false;
    if (c.authMode === "basic") return !!c.username?.trim();
    if (c.authMode === "apiKey") return !!c.apiKey?.trim();
    return true;
  },
  Fields: ({ details, onChange }) => {
    const c = details.config;
    return (
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="URL">
            <input
              value={c.url}
              onChange={(e) => onChange({ ...details, config: { ...c, url: e.target.value } })}
              placeholder="http://localhost:9200"
              className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </Field>
          <Field label="Auth mode">
            <select
              value={c.authMode}
              onChange={(e) => onChange({ ...details, config: { ...c, authMode: e.target.value as SearchConfig["authMode"] } })}
              className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="none">None</option>
              <option value="basic">Basic</option>
              <option value="apiKey">API key</option>
            </select>
          </Field>
        </div>
        {c.authMode === "basic" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Username">
              <input
                value={c.username ?? ""}
                onChange={(e) => onChange({ ...details, config: { ...c, username: e.target.value || undefined } })}
                className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </Field>
            <Field label="Password">
              <input
                value={c.password ?? ""}
                onChange={(e) => onChange({ ...details, config: { ...c, password: e.target.value || undefined } })}
                type="password"
                className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </Field>
          </div>
        ) : null}
        {c.authMode === "apiKey" ? (
          <Field label="API key">
            <input
              value={c.apiKey ?? ""}
              onChange={(e) => onChange({ ...details, config: { ...c, apiKey: e.target.value || undefined } })}
              type="password"
              placeholder="(optional)"
              className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </Field>
        ) : null}
      </div>
    );
  },
  DetailsRows: (details) => {
    const c: SearchConfig = details.config;
    return (
      <>
        <DetailRow label="URL" value={c.url} mono />
        <DetailRow label="Auth" value={c.authMode} />
        <DetailRow label="Username" value={c.username?.length ? c.username : "—"} mono />
        <DetailRow label="Password" value={c.password?.length ? "********" : "—"} mono />
        <DetailRow label="API key" value={c.apiKey?.length ? "configured" : "—"} />
      </>
    );
  },
};
