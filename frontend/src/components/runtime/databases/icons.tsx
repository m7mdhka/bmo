"use client";

import type { IconType } from "react-icons";
import { SiMongodb, SiMysql, SiPostgresql, SiRedis, SiSqlite } from "react-icons/si";

import type { DbEngine } from "./types";

export function engineIcon(engine: DbEngine): IconType {
  switch (engine) {
    case "Postgres":
      return SiPostgresql;
    case "MySQL":
      return SiMysql;
    case "MongoDB":
      return SiMongodb;
    case "Redis":
      return SiRedis;
    case "SQLite":
      return SiSqlite;
  }
}

