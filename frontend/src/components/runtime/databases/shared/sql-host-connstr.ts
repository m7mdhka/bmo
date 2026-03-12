import type { SqlHostConfig } from "../types";
import { parseUrl } from "./connection-string";

export function applySqlHostConnectionString(
  current: SqlHostConfig,
  raw: string,
): SqlHostConfig | null {
  const u = parseUrl(raw);
  if (!u) return null;
  return {
    ...current,
    host: u.hostname || current.host,
    port: u.port ? Number(u.port) : current.port,
    database: u.pathname?.replace(/^\//, "") || current.database,
    username: decodeURIComponent(u.username || current.username),
    password: decodeURIComponent(u.password || current.password),
    ssl: u.searchParams.get("sslmode") === "require" ? "require" : current.ssl,
  };
}

