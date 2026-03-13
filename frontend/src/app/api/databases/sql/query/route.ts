import { NextResponse } from "next/server";

import type { SqlExecutorRequest, SqlQueryResult } from "@/components/runtime/databases/types";

export const runtime = "nodejs";

function mockRowsForQuery(query: string) {
  const q = query.toLowerCase();
  if (q.includes("from users")) {
    return [
      { id: "u_104", email: "dana@example.com", created_at: "2026-03-13 10:02" },
      { id: "u_103", email: "sam@example.com", created_at: "2026-03-13 09:41" },
    ];
  }
  if (q.includes("information_schema") || q.includes("sqlite_master")) {
    return [
      { name: "users", type: "table" },
      { name: "sessions", type: "table" },
    ];
  }
  return [{ result: "Query accepted (mock executor)." }];
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SqlExecutorRequest;
    const query = body?.payload?.query?.trim() ?? "";
    if (!query) {
      return NextResponse.json<SqlQueryResult>(
        {
          columns: [],
          rows: [],
          meta: { tookMs: 0, source: "sql-mock" },
          error: { code: "invalid_query", message: "Query text is required." },
        },
        { status: 400 },
      );
    }

    const started = Date.now();
    const rows = mockRowsForQuery(query);
    const columns = Object.keys(rows[0] ?? { result: "" });

    return NextResponse.json<SqlQueryResult>({
      columns,
      rows,
      meta: { tookMs: Date.now() - started, rowCount: rows.length, source: "sql-mock" },
    });
  } catch {
    return NextResponse.json<SqlQueryResult>(
      {
        columns: [],
        rows: [],
        meta: { tookMs: 0, source: "sql-mock" },
        error: { code: "invalid_payload", message: "Invalid SQL executor payload." },
      },
      { status: 400 },
    );
  }
}
