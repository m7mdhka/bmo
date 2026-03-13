"use client";

import { Database as LucideDatabase } from "lucide-react";

import type { DatabaseEngineModule, DynamoConfig, EngineCapabilities } from "@/components/runtime/databases/types";
import { FAMILIES } from "@/components/runtime/databases/types/families";
import { GROUPS } from "@/components/runtime/databases/types/groups";
import { executeJson } from "@/components/runtime/databases/executors/json";
import { DetailRow } from "@/components/runtime/databases/ui/components/detail-row";
import type { EngineDefinition } from "@/components/runtime/databases/types/engine-definition";
import { Field } from "@/components/runtime/databases/ui/connections/form/field";
import { parseUrl } from "@/components/runtime/databases/ui/connections/shared/connection-string";
import { maskSecret } from "@/components/runtime/databases/ui/connections/shared/secrets";

const JSON_CAPABILITIES: EngineCapabilities = {
  queryLanguage: "json",
  supportsSchemaExplorer: true,
  supportsQueryParams: false,
  supportsTransactions: false,
  supportsStreamingResults: false,
};

const definition: EngineDefinition<"DynamoDB"> = {
  id: "DynamoDB",
  label: "DynamoDB",
  group: GROUPS.document,
  Icon: LucideDatabase,
  createDefaultDetails: () => ({
    engine: "DynamoDB",
    config: {
      region: "us-east-1",
      endpoint: "",
      accessKeyId: "",
      secretAccessKey: "",
      sessionToken: "",
    },
  }),
  docker: {
    apply: (details, candidate) => {
      const env = candidate.env ?? {};
      const region = env.AWS_REGION ?? env.AWS_DEFAULT_REGION ?? details.config.region;
      return {
        ...details,
        config: {
          ...details.config,
          region,
          endpoint: `http://${candidate.host}:${candidate.port}`,
        },
      };
    },
  },
  connectionString: {
    placeholder: "dynamodb://?region=us-east-1&endpoint=http://localhost:8000",
    apply: (details, raw) => {
      const u = parseUrl(raw);
      if (!u) return null;
      const region = u.searchParams.get("region") ?? details.config.region;
      const endpoint = u.searchParams.get("endpoint") ?? details.config.endpoint;
      const accessKeyId = u.searchParams.get("accessKeyId") ?? details.config.accessKeyId;
      const secretAccessKey = u.searchParams.get("secretAccessKey") ?? details.config.secretAccessKey;
      const sessionToken = u.searchParams.get("sessionToken") ?? details.config.sessionToken;
      return { ...details, config: { region, endpoint, accessKeyId, secretAccessKey, sessionToken } };
    },
  },
  summary: (details) => {
    const c = details.config;
    return `${c.region}${c.endpoint?.trim().length ? ` · ${c.endpoint}` : ""}`;
  },
  validate: (details) => !!details.config.region.trim(),
  Fields: ({ details, onChange }) => {
    const c = details.config;
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Region">
          <input
            value={c.region}
            onChange={(e) => onChange({ ...details, config: { ...c, region: e.target.value } })}
            placeholder="us-east-1"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
        <Field label="Endpoint (optional)">
          <input
            value={c.endpoint ?? ""}
            onChange={(e) => onChange({ ...details, config: { ...c, endpoint: e.target.value || undefined } })}
            placeholder="http://localhost:8000"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
        <Field label="Access key ID (optional)">
          <input
            value={c.accessKeyId ?? ""}
            onChange={(e) => onChange({ ...details, config: { ...c, accessKeyId: e.target.value || undefined } })}
            placeholder="(optional)"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
        <Field label="Secret access key (optional)">
          <input
            value={c.secretAccessKey ?? ""}
            onChange={(e) =>
              onChange({ ...details, config: { ...c, secretAccessKey: e.target.value || undefined } })
            }
            type="password"
            placeholder="(optional)"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
        <Field label="Session token (optional)" className="sm:col-span-2">
          <input
            value={c.sessionToken ?? ""}
            onChange={(e) => onChange({ ...details, config: { ...c, sessionToken: e.target.value || undefined } })}
            type="password"
            placeholder="(optional)"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
      </div>
    );
  },
  DetailsRows: (details) => {
    const c: DynamoConfig = details.config;
    return (
      <>
        <DetailRow label="Region" value={c.region} mono />
        <DetailRow label="Endpoint" value={c.endpoint?.trim().length ? c.endpoint : "—"} mono />
        <DetailRow label="Access key" value={c.accessKeyId?.trim().length ? c.accessKeyId : "—"} mono />
        <DetailRow label="Secret" value={maskSecret(c.secretAccessKey)} mono />
        <DetailRow label="Token" value={maskSecret(c.sessionToken)} mono />
      </>
    );
  },
};

export const dynamodb: DatabaseEngineModule<"DynamoDB"> = {
  id: "DynamoDB",
  family: FAMILIES.document,
  definition,
  capabilities: JSON_CAPABILITIES,
  studio: {
    queryLabel: "Operation Payload",
    starterQuery: '{ "operation": "scan", "payload": { "table": "users", "limit": 20 } }',
    objectNoun: "table",
  },
  executeQuery: ({ connectionId, queryText }) => executeJson({ connectionId, queryText }),
};

