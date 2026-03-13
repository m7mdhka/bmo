"use client";

import { SiCockroachlabs } from "react-icons/si";

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
  id: "CockroachDB",
  label: "CockroachDB",
  group: GROUPS.sql,
  Icon: iconFromReactIcons(SiCockroachlabs),
  defaults: {
    host: "localhost",
    port: 26257,
    database: "defaultdb",
    username: "root",
    password: "",
    ssl: "require",
  },
  docker: {
    env: {
      database: ["COCKROACH_DATABASE"],
      username: ["COCKROACH_USER"],
      password: ["COCKROACH_PASSWORD"],
    },
  },
  connectionStringPlaceholder: "postgres://USER:PASSWORD@HOST:26257/DB?sslmode=require",
});

export const cockroachdb: DatabaseEngineModule<"CockroachDB"> = {
  id: "CockroachDB",
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

