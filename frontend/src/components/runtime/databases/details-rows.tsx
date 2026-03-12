"use client";

import type { DbConn } from "./types";

import { DetailRow } from "./detail-row";

export function ConnectionDetailsRows({ conn }: { conn: DbConn }) {
  const d = conn.details;

  if (d.engine === "MongoDB") {
    return (
      <>
        <DetailRow label="URI" value={d.config.uri} mono />
        <DetailRow label="Auth" value={d.config.uri.includes("@") ? "included" : "not included"} />
      </>
    );
  }

  if (d.engine === "SQLite") {
    return (
      <>
        <DetailRow label="File path" value={d.config.filePath} mono />
        <DetailRow label="Mode" value={d.config.readOnly ? "read-only" : "read-write"} />
      </>
    );
  }

  if (d.engine === "Redis") {
    return (
      <>
        <DetailRow label="Host" value={d.config.host} mono />
        <DetailRow label="Port" value={String(d.config.port)} mono />
        <DetailRow
          label="DB index"
          value={typeof d.config.db === "number" ? String(d.config.db) : "—"}
          mono
        />
        <DetailRow label="TLS" value={d.config.tls ? "enabled" : "disabled"} />
        <DetailRow
          label="Username"
          value={d.config.username?.length ? d.config.username : "—"}
          mono
        />
        <DetailRow
          label="Password"
          value={d.config.password?.length ? "********" : "—"}
          mono
        />
      </>
    );
  }

  // Postgres / MySQL
  const common = d.config;
  return (
    <>
      <DetailRow label="Host" value={common.host} mono />
      <DetailRow label="Port" value={String(common.port)} mono />
      <DetailRow label="Database" value={common.database} mono />
      <DetailRow label="Username" value={common.username} mono />
      <DetailRow label="Password" value={common.password.length ? "********" : "—"} mono />
      <DetailRow label="SSL" value={common.ssl === "require" ? "require" : "disable"} />
    </>
  );
}

