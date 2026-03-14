import { NextResponse } from "next/server";

import { checkProjectPorts } from "@/lib/projects";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      templateId?: string;
      ports?: Record<string, number>;
    };
    if (!body.templateId?.trim()) {
      return NextResponse.json({ error: "Template id is required." }, { status: 400 });
    }
    const result = await checkProjectPorts({ templateId: body.templateId.trim(), ports: body.ports });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to check ports." }, { status: 500 });
  }
}
