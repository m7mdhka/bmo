import { NextResponse } from "next/server";

import { deleteProject, restartProject, startProject, stopProject } from "@/lib/projects";

export const runtime = "nodejs";

type ProjectRouteProps = {
  params: Promise<{ projectId: string }>;
};

export async function PATCH(req: Request, { params }: ProjectRouteProps) {
  const { projectId } = await params;
  try {
    const body = (await req.json()) as { action?: string };
    switch (body.action) {
      case "start":
        return NextResponse.json({ project: await startProject(projectId) });
      case "stop":
        return NextResponse.json({ project: await stopProject(projectId) });
      case "restart":
        return NextResponse.json({ project: await restartProject(projectId) });
      default:
        return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Project action failed." },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, { params }: ProjectRouteProps) {
  const { projectId } = await params;
  try {
    await deleteProject(projectId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete project." },
      { status: 500 },
    );
  }
}
