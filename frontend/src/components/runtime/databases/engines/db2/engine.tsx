"use client";

import { Database as LucideDatabase } from "lucide-react";

import type { DatabaseEngineModule, EngineCapabilities } from "@/components/runtime/databases/types";
import { FAMILIES } from "@/components/runtime/databases/types/families";
import { GROUPS } from "@/components/runtime/databases/types/groups";
import { executeSql } from "@/components/runtime/databases/executors/sql";
import { defineSqlHostEngine } from "@/components/runtime/databases/ui/connections/builders/sql-host-engine";

const SQL_CAPABILITIES: EngineCapabilities = {
  queryLanguage: "sql",
  supportsSchemaExplorer: true,
  supportsQueryParams: true,
  supportsTransactions: true,
  supportsStreamingResults: false,
};

const definition = defineSqlHostEngine({
  id: "Db2",
  label: "Db2",
  group: GROUPS.sql,
  Icon: LucideDatabase,
  defaults: {
    host: "localhost",
    port: 50000,
    database: "bmo",
    username: "db2inst1",
    password: "",
    ssl: "disable",
  },
  docker: {
    env: {
      database: ["DBNAME"],
      username: ["DB2INSTANCE"],
      password: ["DB2INST1_PASSWORD", "DB2_PASSWORD"],
    },
  },
  connectionStringPlaceholder: "db2://USER:PASSWORD@HOST:50000/DB",
});

export const db2: DatabaseEngineModule<"Db2"> = {
  id: "Db2",
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

