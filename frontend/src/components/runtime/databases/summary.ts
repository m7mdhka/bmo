import type { DbConn } from "./types";

export function engineSummary(conn: DbConn): string {
  const d = conn.details;
  switch (d.engine) {
    case "Postgres":
    case "MySQL":
      return `${d.config.host}:${d.config.port} · ${d.config.database}`;
    case "Redis":
      return `${d.config.host}:${d.config.port}${typeof d.config.db === "number" ? ` · db ${d.config.db}` : ""}${d.config.tls ? " · tls" : ""}`;
    case "MongoDB":
      return d.config.uri;
    case "SQLite":
      return `${d.config.filePath}${d.config.readOnly ? " · ro" : ""}`;
  }
}

