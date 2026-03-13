"use client";

import { SiMongodb } from "react-icons/si";

import type { DatabaseEngineModule, EngineCapabilities, MongoConfig } from "@/components/runtime/databases/types";
import { FAMILIES } from "@/components/runtime/databases/types/families";
import { GROUPS } from "@/components/runtime/databases/types/groups";
import { executeJson } from "@/components/runtime/databases/executors/json";
import { DetailRow } from "@/components/runtime/databases/ui/components/detail-row";
import type { EngineDefinition } from "@/components/runtime/databases/types/engine-definition";
import { Field } from "@/components/runtime/databases/ui/connections/form/field";
import { parseUrl } from "@/components/runtime/databases/ui/connections/shared/connection-string";
import { iconFromReactIcons } from "@/components/runtime/databases/ui/connections/shared/react-icons";

const JSON_CAPABILITIES: EngineCapabilities = {
  queryLanguage: "json",
  supportsSchemaExplorer: true,
  supportsQueryParams: false,
  supportsTransactions: false,
  supportsStreamingResults: false,
};

const definition: EngineDefinition<"MongoDB"> = {
  id: "MongoDB",
  label: "MongoDB",
  group: GROUPS.document,
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
      const u = parseUrl(raw.replace(/^mongodb\\+srv:/, "mongodb:"));
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

export const mongodb: DatabaseEngineModule<"MongoDB"> = {
  id: "MongoDB",
  family: FAMILIES.document,
  definition,
  capabilities: JSON_CAPABILITIES,
  studio: {
    queryLabel: "Document Filter",
    starterQuery: '{ "collection": "users", "filter": { "active": true }, "limit": 20 }',
    objectNoun: "collection",
  },
  executeQuery: ({ connectionId, queryText }) => executeJson({ connectionId, queryText }),
};

