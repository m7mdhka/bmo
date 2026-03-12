"use client";

import { SiApachecouchdb } from "react-icons/si";

import type { EngineDefinition } from "../engine-definition";
import type { CouchDbConfig } from "../types";
import { Field } from "../form/field";
import { DetailRow } from "../detail-row";
import { parseUrl } from "../shared/connection-string";
import { iconFromReactIcons } from "../shared/react-icons";

export const couchdbEngine: EngineDefinition<"CouchDB"> = {
  id: "CouchDB",
  label: "CouchDB",
  group: "NoSQL",
  Icon: iconFromReactIcons(SiApachecouchdb),
  createDefaultDetails: () => ({ engine: "CouchDB", config: { url: "http://localhost:5984" } }),
  docker: {
    apply: (details, candidate) => {
      const env = candidate.env ?? {};
      return {
        ...details,
        config: {
          url: `http://${candidate.host}:${candidate.port}`,
          username: env.COUCHDB_USER?.trim().length ? env.COUCHDB_USER : details.config.username,
          password: env.COUCHDB_PASSWORD?.trim().length ? env.COUCHDB_PASSWORD : details.config.password,
        },
      };
    },
  },
  connectionString: {
    placeholder: "http(s)://USER:PASSWORD@HOST:5984",
    apply: (details, raw) => {
      const u = parseUrl(raw);
      if (!u) return null;
      return {
        ...details,
        config: {
          url: u.origin,
          username: u.username ? decodeURIComponent(u.username) : undefined,
          password: u.password ? decodeURIComponent(u.password) : undefined,
        },
      };
    },
  },
  summary: (details) => details.config.url,
  validate: (details) => details.config.url.trim().length > 0,
  Fields: ({ details, onChange }) => {
    const c = details.config;
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="URL">
          <input
            value={c.url}
            onChange={(e) => onChange({ ...details, config: { ...c, url: e.target.value } })}
            placeholder="http://localhost:5984"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
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
    const c: CouchDbConfig = details.config;
    return (
      <>
        <DetailRow label="URL" value={c.url} mono />
        <DetailRow label="Username" value={c.username?.length ? c.username : "—"} mono />
        <DetailRow label="Password" value={c.password?.length ? "********" : "—"} mono />
      </>
    );
  },
};
