import { NextResponse } from "next/server";

import { writeProjectFile } from "@/lib/projects";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{ projectId: string }>;
};

export async function PATCH(req: Request, { params }: RouteProps) {
  const { projectId } = await params;
  try {
    const body = (await req.json()) as { fileId?: string; content?: string };
    if (!body.fileId || typeof body.content !== "string") {
      return NextResponse.json({ error: "File id and content are required." }, { status: 400 });
    }

    await writeProjectFile(projectId, body.fileId, body.content);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save project file." },
      { status: 500 },
    );
  }
}
