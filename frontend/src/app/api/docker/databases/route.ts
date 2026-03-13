import Docker, { type ContainerInfo, type Port } from "dockerode";
import { NextResponse } from "next/server";

import { getDockerPreferredPrivatePorts, inferDockerEngineFromImage } from "@/components/runtime/databases/docker-discovery";
import type { DbEngine, DockerDbCandidate, DockerPublishedPort } from "@/components/runtime/databases/types";

export const runtime = "nodejs";

function normalizeContainerName(names?: string[]) {
  const raw = names?.[0] ?? "";
  return raw.startsWith("/") ? raw.slice(1) : raw;
}

function dockerHostFromIp(ip?: string) {
  if (!ip || ip === "0.0.0.0" || ip === "::") return "localhost";
  return ip;
}

function pickPublishedPort(engine: DbEngine, ports: Port[] | undefined): { port: DockerPublishedPort; all: DockerPublishedPort[] } | null {
  const all: DockerPublishedPort[] = (ports ?? [])
    .filter((p) => typeof p.PublicPort === "number")
    .map((p) => ({
      ip: typeof p.IP === "string" ? p.IP : undefined,
      privatePort: Number(p.PrivatePort),
      publicPort: Number(p.PublicPort),
      type: typeof p.Type === "string" ? p.Type : "tcp",
    }));

  if (all.length === 0) return null;

  const preferred = getDockerPreferredPrivatePorts(engine);
  for (const priv of preferred) {
    const match = all.find((p) => p.privatePort === priv);
    if (match) return { port: match, all };
  }

  return { port: all[0], all };
}

function envToRecord(env?: string[]) {
  const out: Record<string, string> = {};
  for (const e of env ?? []) {
    const idx = e.indexOf("=");
    if (idx === -1) continue;
    const k = e.slice(0, idx);
    const v = e.slice(idx + 1);
    if (!k) continue;
    out[k] = v;
  }
  return out;
}

export async function GET() {
  try {
    const docker = new Docker();
    const containers: ContainerInfo[] = await docker.listContainers({ all: false });

    const items: DockerDbCandidate[] = [];

    for (const c of containers) {
      const image = String(c.Image ?? "");
      const engine = inferDockerEngineFromImage(image);
      if (!engine) continue;

      const picked = pickPublishedPort(engine, c.Ports);
      if (!picked) continue;

      const containerId = String(c.Id ?? "");
      const containerName = normalizeContainerName(c.Names);
      const host = dockerHostFromIp(picked.port.ip);

      let env: Record<string, string> = {};
      try {
        const inspect = await docker.getContainer(containerId).inspect();
        env = envToRecord(inspect?.Config?.Env);
      } catch {
        // If inspect fails (permissions), still return the basic host/port.
      }

      items.push({
        containerId,
        containerName,
        image,
        engine,
        host,
        port: picked.port.publicPort,
        privatePort: picked.port.privatePort,
        ports: picked.all,
        env,
      });
    }

    items.sort((a, b) => a.engine.localeCompare(b.engine) || a.containerName.localeCompare(b.containerName));
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json(
      {
        items: [],
        error: "Docker is not available. Make sure Docker Desktop is running.",
      },
      { status: 503 },
    );
  }
}
