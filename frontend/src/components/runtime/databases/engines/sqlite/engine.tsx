"use client";

import { SiSqlite } from "react-icons/si";

import type { DatabaseEngineModule, EngineCapabilities, SqliteConfig } from "@/components/runtime/databases/types";
import { FAMILIES } from "@/components/runtime/databases/types/families";
import { GROUPS } from "@/components/runtime/databases/types/groups";
import { executeSql } from "@/components/runtime/databases/executors/sql";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { DetailRow } from "@/components/runtime/databases/ui/components/detail-row";
import type { EngineDefinition } from "@/components/runtime/databases/types/engine-definition";
import { Field } from "@/components/runtime/databases/ui/connections/form/field";
import { iconFromReactIcons } from "@/components/runtime/databases/ui/connections/shared/react-icons";

const SQL_CAPABILITIES: EngineCapabilities = {
  queryLanguage: "sql",
  supportsSchemaExplorer: true,
  supportsQueryParams: true,
  supportsTransactions: true,
  supportsStreamingResults: false,
};

const definition: EngineDefinition<"SQLite"> = {
  id: "SQLite",
  label: "SQLite",
  group: GROUPS.sql,
  Icon: iconFromReactIcons(SiSqlite),
  createDefaultDetails: () => ({
    engine: "SQLite",
    config: { filePath: "./data/app.sqlite", readOnly: false },
  }),
  summary: (details) => `${details.config.filePath}${details.config.readOnly ? " · ro" : ""}`,
  validate: (details) => details.config.filePath.trim().length > 0,
  Fields: ({ details, onChange }) => {
    const c = details.config;
    return (
      <div className="space-y-3">
        <Field label="Database file path">
          <input
            value={c.filePath}
            onChange={(e) => onChange({ ...details, config: { ...c, filePath: e.target.value } })}
            placeholder="./data/app.sqlite"
            className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </Field>
        <Field label="Mode">
          <div className="flex items-center justify-between gap-3 border border-border bg-background px-3 py-2 text-xs">
            <span className="text-muted-foreground">Read-only</span>
            <ToggleSwitch
              checked={c.readOnly}
              onCheckedChange={(next) => onChange({ ...details, config: { ...c, readOnly: next } })}
            />
          </div>
        </Field>
      </div>
    );
  },
  DetailsRows: (details) => {
    const c: SqliteConfig = details.config;
    return (
      <>
        <DetailRow label="File path" value={c.filePath} mono />
        <DetailRow label="Mode" value={c.readOnly ? "read-only" : "read-write"} />
      </>
    );
  },
};

export const sqlite: DatabaseEngineModule<"SQLite"> = {
  id: "SQLite",
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

