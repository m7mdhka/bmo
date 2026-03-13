"use client";

import { SiMariadb } from "react-icons/si";

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
  id: "MariaDB",
  label: "MariaDB",
  group: GROUPS.sql,
  Icon: iconFromReactIcons(SiMariadb),
  defaults: {
    host: "localhost",
    port: 3306,
    database: "bmo",
    username: "root",
    password: "",
    ssl: "disable",
  },
  docker: {
    env: {
      database: ["MYSQL_DATABASE", "MARIADB_DATABASE"],
      username: ["MYSQL_USER", "MARIADB_USER"],
      password: ["MYSQL_PASSWORD", "MYSQL_ROOT_PASSWORD", "MARIADB_PASSWORD", "MARIADB_ROOT_PASSWORD"],
    },
  },
  connectionStringPlaceholder: "mysql://USER:PASSWORD@HOST:3306/DB",
});

export const mariadb: DatabaseEngineModule<"MariaDB"> = {
  id: "MariaDB",
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

