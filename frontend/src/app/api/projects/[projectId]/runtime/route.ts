import { NextResponse } from "next/server";

import {
  applyProjectRuntimeChanges,
  buildProjectService,
  getProjectRuntime,
  restartProjectService,
} from "@/lib/projects";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{ projectId: string }>;
};

export async function GET(_req: Request, { params }: RouteProps) {
  const { projectId } = await params;
  try {
    return NextResponse.json({ runtime: await getProjectRuntime(projectId) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load project runtime." },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request, { params }: RouteProps) {
  const { projectId } = await params;
  try {
    const body = (await req.json()) as { action?: string; service?: string };
    switch (body.action) {
      case "apply":
        return NextResponse.json({ project: await applyProjectRuntimeChanges(projectId) });
      case "build-service":
        if (!body.service) {
          return NextResponse.json({ error: "Service is required." }, { status: 400 });
        }
        return NextResponse.json({ project: await buildProjectService(projectId, body.service) });
      case "restart-service":
        if (!body.service) {
          return NextResponse.json({ error: "Service is required." }, { status: 400 });
        }
        return NextResponse.json({ project: await restartProjectService(projectId, body.service) });
      default:
        return NextResponse.json({ error: "Unsupported runtime action." }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Project runtime action failed." },
      { status: 500 },
    );
  }
}
