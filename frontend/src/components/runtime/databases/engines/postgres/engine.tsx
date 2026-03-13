"use client";

import { SiPostgresql } from "react-icons/si";

import type { DatabaseEngineModule, EngineCapabilities } from "@/components/runtime/databases/types";
import { FAMILIES } from "@/components/runtime/databases/types/families";
import { GROUPS } from "@/components/runtime/databases/types/groups";
import { executeSql } from "@/components/runtime/databases/executors/sql";
import { defineSqlHostEngine } from "@/components/runtime/databases/ui/connections/builders/sql-host-engine";
import { iconFromReactIcons } from "@/components/runtime/databases/ui/connections/shared/react-icons";

const SQL_CAPABILITIES: EngineCapabilities = {
  queryLanguage: "sql",
  supportsSchemaExplorer: true,
  supportsQueryParams: true,
  supportsTransactions: true,
  supportsStreamingResults: false,
};

const definition = defineSqlHostEngine({
  id: "Postgres",
  label: "Postgres",
  group: GROUPS.sql,
  Icon: iconFromReactIcons(SiPostgresql),
  defaults: {
    host: "localhost",
    port: 5432,
    database: "bmo",
    username: "postgres",
    password: "",
    ssl: "disable",
  },
  docker: {
    env: {
      database: ["POSTGRES_DB"],
      username: ["POSTGRES_USER"],
      password: ["POSTGRES_PASSWORD"],
    },
  },
  connectionStringPlaceholder: "postgres://USER:PASSWORD@HOST:5432/DB",
});

export const postgres: DatabaseEngineModule<"Postgres"> = {
  id: "Postgres",
  family: FAMILIES.relational,
  definition,
  capabilities: SQL_CAPABILITIES,
  studio: {
    queryLabel: "SQL Query",
    starterQuery: "SELECT id, email, created_at FROM users ORDER BY created_at DESC LIMIT 25;",
    objectNoun: "table",
  },
  executeQuery: ({ connectionId, queryText }) => executeSql({ connectionId, queryText }),
};

