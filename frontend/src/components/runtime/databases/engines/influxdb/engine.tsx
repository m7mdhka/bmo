"use client";

import { SiInfluxdb } from "react-icons/si";

import type { DatabaseEngineModule, EngineCapabilities, InfluxConfig } from "@/components/runtime/databases/types";
import { FAMILIES } from "@/components/runtime/databases/types/families";
import { GROUPS } from "@/components/runtime/databases/types/groups";
import { executeJson } from "@/components/runtime/databases/executors/json";
import { DetailRow } from "@/components/runtime/databases/ui/components/detail-row";
import type { EngineDefinition } from "@/components/runtime/databases/types/engine-definition";
import { Field } from "@/components/runtime/databases/ui/connections/form/field";
import { parseUrl } from "@/components/runtime/databases/ui/connections/shared/connection-string";
import { maskSecret } from "@/components/runtime/databases/ui/connections/shared/secrets";
import { iconFromReactIcons } from "@/components/runtime/databases/ui/connections/shared/react-icons";

const JSON_CAPABILITIES: EngineCapabilities = {
  queryLanguage: "json",
  supportsSchemaExplorer: true,
  supportsQueryParams: false,
  supportsTransactions: false,
  supportsStreamingResults: false,
};

const definition: EngineDefinition<"InfluxDB"> = {
  id: "InfluxDB",
  label: "InfluxDB",
  group: GROUPS.timeseries,
  Icon: iconFromReactIcons(SiInfluxdb),
  createDefaultDetails: () => ({
    engine: "InfluxDB",
    config: {
      url: "http://localhost:8086",
      org: "",
      bucket: "",
      token: "",
    },
  }),
  docker: {
    apply: (details, candidate) => {
      const env = candidate.env ?? {};
      return {
        ...details,
        config: {
          ...details.config,
          url: `http://${candidate.host}:${candidate.port}`,
          org: env.DOCKER_INFLUXDB_INIT_ORG?.trim().length ? env.DOCKER_INFLUXDB_INIT_ORG : details.config.org,
          bucket: env.DOCKER_INFLUXDB_INIT_BUCKET?.trim().length
            ? env.DOCKER_INFLUXDB_INIT_BUCKET
            : details.config.bucket,
          token: env.DOCKER_INFLUXDB_INIT_ADMIN_TOKEN?.trim().length
            ? env.DOCKER_INFLUXDB_INIT_ADMIN_TOKEN
            : details.config.token,
        },
      };
    },
  },
  connectionString: {
    placeholder: "http(s)://HOST:8086?org=ORG&bucket=BUCKET&token=TOKEN",
    apply: (details, raw) => {
      const u = parseUrl(raw);
      if (!u) return null;
      const org = u.searchParams.get("org") ?? details.config.org;
      const bucket = u.searchParams.get("bucket") ?? details.config.bucket;
      const token = u.searchParams.get("token") ?? details.config.token;
      return { ...details, config: { url: u.origin, org, bucket, token } };
    },
  },
  summary: (details) => {
    const c = details.config;
    return `${c.url}${c.org ? ` · ${c.org}` : ""}${c.bucket ? `/${c.bucket}` : ""}`;
  },
  validate: (details) => {
    const c = details.config;
    return !!(c.url.trim() && c.org.trim() && c.bucket.trim() && c.token.trim());
  },
  Fields: ({ details, onChange }) => {
    const c = details.config;
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="URL">
          <input
            value={c.url}
            onChange={(e) => onChange({ ...details, config: { ...c, url: e.target.value } })}
            placeholder="http://localhost:8086"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
        <Field label="Org">
          <input
            value={c.org}
            onChange={(e) => onChange({ ...details, config: { ...c, org: e.target.value } })}
            placeholder="my-org"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
        <Field label="Bucket">
          <input
            value={c.bucket}
            onChange={(e) => onChange({ ...details, config: { ...c, bucket: e.target.value } })}
            placeholder="metrics"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
        <Field label="Token">
          <input
            value={c.token}
            onChange={(e) => onChange({ ...details, config: { ...c, token: e.target.value } })}
            type="password"
            placeholder="(required)"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
      </div>
    );
  },
  DetailsRows: (details) => {
    const c: InfluxConfig = details.config;
    return (
      <>
        <DetailRow label="URL" value={c.url} mono />
        <DetailRow label="Org" value={c.org} mono />
        <DetailRow label="Bucket" value={c.bucket} mono />
        <DetailRow label="Token" value={maskSecret(c.token)} mono />
      </>
    );
  },
};

export const influxdb: DatabaseEngineModule<"InfluxDB"> = {
  id: "InfluxDB",
  family: FAMILIES.timeseries,
  definition,
  capabilities: JSON_CAPABILITIES,
  studio: {
    queryLabel: "Flux Payload",
    starterQuery:
      '{ "operation": "command", "payload": { "query": "from(bucket: \\"main\\") |> range(start: -1h) |> limit(n:20)" } }',
    objectNoun: "measurement",
  },
  executeQuery: ({ connectionId, queryText }) => executeJson({ connectionId, queryText }),
};

