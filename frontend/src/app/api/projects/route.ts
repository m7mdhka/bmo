import { NextResponse } from "next/server";

import { createProject } from "@/lib/projects";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      id?: string;
      description?: string;
      templateId?: string;
      templateName?: string;
      language?: string;
      path?: string;
      frontendPort?: number;
      backendPort?: number;
    };

    const id = body.id?.trim() ?? "";
    const templateId = body.templateId?.trim() ?? "";
    const path = body.path?.trim() ?? "";
    if (!id || !templateId || !path) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const project = await createProject({
      id,
      description: body.description?.trim() ?? "",
      templateId,
      templateName: body.templateName?.trim() ?? templateId,
      language: body.language?.trim() ?? "TypeScript",
      path,
      frontendPort: typeof body.frontendPort === "number" ? body.frontendPort : undefined,
      backendPort: typeof body.backendPort === "number" ? body.backendPort : undefined,
    });

    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create project." },
      { status: 500 },
    );
  }
}
