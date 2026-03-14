import { NextResponse } from "next/server";

import { orchestratorBaseUrl } from "@/lib/orchestrator-api";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{ projectId: string; sessionId: string }>;
};

export async function GET(req: Request, { params }: RouteProps) {
  const { projectId, sessionId } = await params;
  const url = new URL(req.url);
  const cursor = Number(url.searchParams.get("cursor") ?? "0");

  try {
    const response = await fetch(
      `${orchestratorBaseUrl()}/projects/${encodeURIComponent(projectId)}/terminal/${encodeURIComponent(sessionId)}/output?cursor=${Number.isFinite(cursor) ? cursor : 0}`,
      { cache: "no-store" },
    );
    const payload = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: payload.detail ?? "Failed to read terminal output." }, { status: response.status });
    }
    return NextResponse.json({
      chunks: payload.chunks,
      cursor: payload.cursor,
      closed: payload.closed,
      exitCode: payload.exit_code,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to read terminal output." },
      { status: 500 },
    );
  }
}
