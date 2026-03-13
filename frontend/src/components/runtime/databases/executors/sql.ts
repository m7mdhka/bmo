"use client";

import type { EngineQueryResult } from "@/components/runtime/databases/types";
import type { SqlExecutorRequest, SqlQueryResult } from "@/components/runtime/databases/types";

function normalizeValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export async function executeSql(input: {
  connectionId: string;
  queryText: string;
}): Promise<EngineQueryResult> {
  const request: SqlExecutorRequest = {
    connectionId: input.connectionId,
    payload: { query: input.queryText, page: { limit: 25 } },
  };

  let payload: SqlQueryResult;
  try {
    const res = await fetch("/api/databases/sql/query", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
    });
    payload = (await res.json()) as SqlQueryResult;
  } catch {
    return { columns: ["error"], rows: [{ error: "Could not reach SQL query API." }], error: "Could not reach SQL query API." };
  }

  if (payload.error) {
    return { columns: ["error"], rows: [{ error: payload.error.message }], error: payload.error.message };
  }

  const columns = payload.columns.length ? payload.columns : ["result"];
  const rows = payload.rows.map((row) =>
    Object.fromEntries(columns.map((c) => [c, normalizeValue((row as Record<string, unknown>)[c])])),
  );
  return {
    columns,
    rows: rows.length ? rows : [{ result: "No rows returned." }],
    meta: payload.meta,
  };
}
