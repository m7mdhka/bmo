import { NextResponse } from "next/server";

import { getProjectLogs } from "@/lib/projects";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{ projectId: string }>;
};

export async function GET(req: Request, { params }: RouteProps) {
  const { projectId } = await params;
  const url = new URL(req.url);
  const service = url.searchParams.get("service")?.trim() ?? "";
  const since = url.searchParams.get("since");
  const tailParam = Number(url.searchParams.get("tail") ?? "200");

  try {
    const logs = await getProjectLogs(projectId, {
      service: service || undefined,
      since: since?.trim() ? since : null,
      tail: Number.isFinite(tailParam) && tailParam > 0 ? tailParam : 200,
    });
    return NextResponse.json({ logs, fetchedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load project logs." },
      { status: 500 },
    );
  }
}
