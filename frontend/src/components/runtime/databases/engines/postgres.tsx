"use client";

import { SiPostgresql } from "react-icons/si";

import type { EngineDefinition } from "../engine-definition";
import { defineSqlHostEngine } from "../builders/sql-host-engine";
import { iconFromReactIcons } from "../shared/react-icons";

export const postgresEngine: EngineDefinition<"Postgres"> = defineSqlHostEngine({
  id: "Postgres",
  label: "Postgres",
  group: "SQL",
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
