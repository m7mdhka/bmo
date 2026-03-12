"use client";

import { SiMariadb } from "react-icons/si";

import type { EngineDefinition } from "../engine-definition";
import { defineSqlHostEngine } from "../builders/sql-host-engine";
import { iconFromReactIcons } from "../shared/react-icons";

export const mariadbEngine: EngineDefinition<"MariaDB"> = defineSqlHostEngine({
  id: "MariaDB",
  label: "MariaDB",
  group: "SQL",
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
