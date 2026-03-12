"use client";

import { Database as LucideDatabase } from "lucide-react";

import type { EngineDefinition } from "../engine-definition";
import { defineSqlHostEngine } from "../builders/sql-host-engine";

export const db2Engine: EngineDefinition<"Db2"> = defineSqlHostEngine({
  id: "Db2",
  label: "Db2",
  group: "SQL",
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
