"use client";

import type { EngineQueryResult } from "@/components/runtime/databases/types";
import type { JsonExecutorRequest, JsonQueryResult } from "@/components/runtime/databases/types";

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

export async function executeJson(input: {
  connectionId: string;
  queryText: string;
}): Promise<EngineQueryResult> {
  let operation = "query";
  let payload: Record<string, unknown> = {};

  try {
    const parsed = JSON.parse(input.queryText) as Record<string, unknown>;
    operation = typeof parsed.operation === "string" ? parsed.operation : "query";
    payload =
      typeof parsed.payload === "object" && parsed.payload && !Array.isArray(parsed.payload)
        ? (parsed.payload as Record<string, unknown>)
        : parsed;
  } catch {
    return { columns: ["error"], rows: [{ error: "Payload must be valid JSON." }], error: "Payload must be valid JSON." };
  }

  const request: JsonExecutorRequest = {
    connectionId: input.connectionId,
    payload: { operation, payload, page: { limit: 25 } },
  };

  let response: JsonQueryResult;
  try {
    const res = await fetch("/api/databases/nosql/query", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
    });
    response = (await res.json()) as JsonQueryResult;
  } catch {
    return { columns: ["error"], rows: [{ error: "Could not reach JSON query API." }], error: "Could not reach JSON query API." };
  }

  if (response.error) {
    return { columns: ["error"], rows: [{ error: response.error.message }], error: response.error.message };
  }

  const rows = response.documents.map((doc) =>
    Object.fromEntries(Object.entries(doc).map(([k, v]) => [k, normalizeValue(v)])),
  );
  const columns = Object.keys(rows[0] ?? { result: "" });
  return {
    columns,
    rows: rows.length ? rows : [{ result: "No documents returned." }],
    meta: response.meta,
  };
}
