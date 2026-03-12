import type { DbConfig, DbEngine } from "./types";

export function createDefaultDetails(engine: DbEngine): DbConfig {
  switch (engine) {
    case "Postgres":
      return {
        engine: "Postgres",
        config: {
          host: "localhost",
          port: 5432,
          database: "bmo",
          username: "postgres",
          password: "",
          ssl: "disable",
        },
      };
    case "MySQL":
      return {
        engine: "MySQL",
        config: {
          host: "localhost",
          port: 3306,
          database: "bmo",
          username: "root",
          password: "",
          ssl: "disable",
        },
      };
    case "MongoDB":
      return { engine: "MongoDB", config: { uri: "mongodb://localhost:27017/bmo" } };
    case "Redis":
      return {
        engine: "Redis",
        config: { host: "localhost", port: 6379, tls: false },
      };
    case "SQLite":
      return { engine: "SQLite", config: { filePath: "./data/app.sqlite", readOnly: false } };
  }
}

