import { NextResponse } from "next/server";

import { orchestratorBaseUrl } from "@/lib/orchestrator-api";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{ projectId: string; sessionId: string }>;
};

export async function PATCH(req: Request, { params }: RouteProps) {
  const { projectId, sessionId } = await params;
  try {
    const body = (await req.json()) as { input?: string; cols?: number; rows?: number };
    const response = await fetch(`${orchestratorBaseUrl()}/projects/${encodeURIComponent(projectId)}/terminal/${encodeURIComponent(sessionId)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const payload = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: payload.detail ?? "Failed to write terminal input." }, { status: response.status });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to write terminal input." },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, { params }: RouteProps) {
  const { projectId, sessionId } = await params;
  const response = await fetch(`${orchestratorBaseUrl()}/projects/${encodeURIComponent(projectId)}/terminal/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
    cache: "no-store",
  });
  const payload = await response.json();
  if (!response.ok) {
    return NextResponse.json({ error: payload.detail ?? "Failed to close terminal session." }, { status: response.status });
  }
  return NextResponse.json(payload);
}
