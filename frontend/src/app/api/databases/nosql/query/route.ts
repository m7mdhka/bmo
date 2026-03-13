import { NextResponse } from "next/server";

import type { JsonExecutorRequest, JsonQueryResult } from "@/components/runtime/databases/types";

export const runtime = "nodejs";

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as JsonExecutorRequest;
    const operation = body?.payload?.operation ?? "command";
    const payload = asRecord(body?.payload?.payload);
    const started = Date.now();

    const documents =
      operation === "scan"
        ? [
            { key: "session:093b", ttl: 1042, bytes: 294 },
            { key: "session:102a", ttl: 918, bytes: 301 },
          ]
        : operation === "aggregate"
          ? [
              { bucket: "active", count: 421 },
              { bucket: "inactive", count: 87 },
            ]
          : operation === "find"
            ? [
                { id: "u_104", email: "dana@example.com", active: true },
                { id: "u_103", email: "sam@example.com", active: true },
              ]
            : [{ result: "Command accepted (mock executor).", payload }];

    return NextResponse.json<JsonQueryResult>({
      documents,
      meta: { tookMs: Date.now() - started, rowCount: documents.length, source: "nosql-mock" },
    });
  } catch {
    return NextResponse.json<JsonQueryResult>(
      {
        documents: [],
        meta: { tookMs: 0, source: "nosql-mock" },
        error: { code: "invalid_payload", message: "Invalid NoSQL executor payload." },
      },
      { status: 400 },
    );
  }
}
