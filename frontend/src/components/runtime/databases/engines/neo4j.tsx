"use client";

import { SiNeo4J } from "react-icons/si";

import type { EngineDefinition } from "../engine-definition";
import type { Neo4jConfig } from "../types";
import { Field } from "../form/field";
import { DetailRow } from "../detail-row";
import { parseUrl } from "../shared/connection-string";
import { maskSecret } from "../shared/secrets";
import { iconFromReactIcons } from "../shared/react-icons";

export const neo4jEngine: EngineDefinition<"Neo4j"> = {
  id: "Neo4j",
  label: "Neo4j",
  group: "Graph",
  Icon: iconFromReactIcons(SiNeo4J),
  createDefaultDetails: () => ({ engine: "Neo4j", config: { uri: "bolt://localhost:7687", username: "neo4j", password: "" } }),
  docker: {
    apply: (details, candidate) => {
      const env = candidate.env ?? {};
      const auth = env.NEO4J_AUTH;
      let username = details.config.username;
      let password = details.config.password;
      if (auth && auth.includes("/")) {
        const [u, p] = auth.split("/", 2);
        if (u?.trim().length) username = u;
        if (p?.trim().length) password = p;
      }

      return {
        ...details,
        config: {
          ...details.config,
          uri: `bolt://${candidate.host}:${candidate.port}`,
          username,
          password,
        },
      };
    },
  },
  connectionString: {
    placeholder: "bolt://USER:PASSWORD@HOST:7687",
    apply: (details, raw) => {
      const u = parseUrl(raw.replace(/^neo4j:/, "bolt:"));
      if (!u) return null;
      const c = details.config;
      return {
        ...details,
        config: {
          ...c,
          uri: raw.trim(),
          username: u.username ? decodeURIComponent(u.username) : c.username,
          password: u.password ? decodeURIComponent(u.password) : c.password,
        },
      };
    },
  },
  summary: (details) => details.config.uri,
  validate: (details) => !!(details.config.uri.trim() && details.config.username.trim()),
  Fields: ({ details, onChange }) => {
    const c = details.config;
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="URI">
          <input
            value={c.uri}
            onChange={(e) => onChange({ ...details, config: { ...c, uri: e.target.value } })}
            placeholder="bolt://localhost:7687"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
        <Field label="Database (optional)">
          <input
            value={c.database ?? ""}
            onChange={(e) => onChange({ ...details, config: { ...c, database: e.target.value || undefined } })}
            placeholder="neo4j"
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
    const c: Neo4jConfig = details.config;
    return (
      <>
        <DetailRow label="URI" value={c.uri} mono />
        <DetailRow label="Username" value={c.username} mono />
        <DetailRow label="Password" value={maskSecret(c.password)} mono />
        <DetailRow label="Database" value={c.database?.length ? c.database : "—"} mono />
      </>
    );
  },
};
