import { NextResponse } from "next/server";

import { checkProjectPorts } from "@/lib/projects";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      frontendPort?: number;
      backendPort?: number;
    };
    const result = await checkProjectPorts({
      frontendPort: typeof body.frontendPort === "number" ? body.frontendPort : undefined,
      backendPort: typeof body.backendPort === "number" ? body.backendPort : undefined,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to check ports." }, { status: 500 });
  }
}
