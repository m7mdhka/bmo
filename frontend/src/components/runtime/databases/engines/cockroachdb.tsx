"use client";

import { SiCockroachlabs } from "react-icons/si";

import type { EngineDefinition } from "../engine-definition";
import { defineSqlHostEngine } from "../builders/sql-host-engine";
import { iconFromReactIcons } from "../shared/react-icons";

export const cockroachdbEngine: EngineDefinition<"CockroachDB"> = defineSqlHostEngine({
  id: "CockroachDB",
  label: "CockroachDB",
  group: "SQL",
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
