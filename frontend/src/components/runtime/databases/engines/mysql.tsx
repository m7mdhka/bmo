"use client";

import { SiMysql } from "react-icons/si";

import type { EngineDefinition } from "../engine-definition";
import { defineSqlHostEngine } from "../builders/sql-host-engine";
import { iconFromReactIcons } from "../shared/react-icons";

export const mysqlEngine: EngineDefinition<"MySQL"> = defineSqlHostEngine({
  id: "MySQL",
  label: "MySQL",
  group: "SQL",
  Icon: iconFromReactIcons(SiMysql),
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
      database: ["MYSQL_DATABASE"],
      username: ["MYSQL_USER"],
      password: ["MYSQL_PASSWORD", "MYSQL_ROOT_PASSWORD"],
    },
  },
  connectionStringPlaceholder: "mysql://USER:PASSWORD@HOST:3306/DB",
});
