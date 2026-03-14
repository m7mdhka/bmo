import { NextResponse } from "next/server";

import { orchestratorBaseUrl } from "@/lib/orchestrator-api";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{ projectId: string }>;
};

export async function POST(req: Request, { params }: RouteProps) {
  const { projectId } = await params;
  try {
    const body = (await req.json()) as { service?: string };
    if (!body.service?.trim()) {
      return NextResponse.json({ error: "Service is required." }, { status: 400 });
    }
    const response = await fetch(`${orchestratorBaseUrl()}/projects/${encodeURIComponent(projectId)}/terminal`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ service: body.service.trim() }),
      cache: "no-store",
    });
    const payload = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: payload.detail ?? "Failed to open terminal session." }, { status: response.status });
    }
    return NextResponse.json({
      sessionId: payload.session_id,
      service: payload.service,
      cursor: payload.cursor,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to open terminal session." },
      { status: 500 },
    );
  }
}
