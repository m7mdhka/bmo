"use client";

import { SiMongodb } from "react-icons/si";

import type { EngineDefinition } from "../engine-definition";
import type { MongoConfig } from "../types";
import { Field } from "../form/field";
import { DetailRow } from "../detail-row";
import { parseUrl } from "../shared/connection-string";
import { iconFromReactIcons } from "../shared/react-icons";

export const mongodbEngine: EngineDefinition<"MongoDB"> = {
  id: "MongoDB",
  label: "MongoDB",
  group: "NoSQL",
  Icon: iconFromReactIcons(SiMongodb),
  createDefaultDetails: () => ({ engine: "MongoDB", config: { uri: "mongodb://localhost:27017/bmo" } }),
  docker: {
    apply: (details, candidate) => {
      const env = candidate.env ?? {};
      const user = env.MONGO_INITDB_ROOT_USERNAME;
      const pass = env.MONGO_INITDB_ROOT_PASSWORD;
      const db = env.MONGO_INITDB_DATABASE;

      const auth = user && pass ? `${encodeURIComponent(user)}:${encodeURIComponent(pass)}@` : "";
      const path = db?.trim().length ? `/${encodeURIComponent(db)}` : "";
      const uri = `mongodb://${auth}${candidate.host}:${candidate.port}${path}`;

      return { ...details, config: { uri } };
    },
  },
  connectionString: {
    placeholder: "mongodb://USER:PASSWORD@HOST:27017/DB",
    apply: (details, raw) => {
      // Mongo is already a connection string; just validate it's parseable.
      const u = parseUrl(raw.replace(/^mongodb\+srv:/, "mongodb:"));
      if (!u) return null;
      return { ...details, config: { uri: raw.trim() } };
    },
  },
  summary: (details) => details.config.uri,
  validate: (details) => details.config.uri.trim().length > 0,
  Fields: ({ details, onChange }) => {
    const c = details.config;
    return (
      <Field label="Connection string (URI)">
        <input
          value={c.uri}
          onChange={(e) => onChange({ ...details, config: { uri: e.target.value } })}
          placeholder="mongodb://localhost:27017/bmo"
          className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
        <p className="mt-1 text-[10px] text-muted-foreground/70">
          Include credentials if needed: <span className="font-mono">mongodb://user:pass@host:27017/db</span>
        </p>
      </Field>
    );
  },
  DetailsRows: (details) => {
    const c: MongoConfig = details.config;
    return (
      <>
        <DetailRow label="URI" value={c.uri} mono />
        <DetailRow label="Auth" value={c.uri.includes("@") ? "included" : "not included"} />
      </>
    );
  },
};
