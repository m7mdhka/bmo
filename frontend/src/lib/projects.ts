import "server-only";

import { execFile } from "node:child_process";
import net from "node:net";
import { promisify } from "node:util";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import type { FileNode } from "@/components/projects/workspace/workspace-types";

const execFileAsync = promisify(execFile);

export type StoredProject = {
  id: string;
  name: string;
  description: string;
  path: string;
  templateId: string;
  templateName: string;
  language: string;
  status: "running" | "stopped";
  createdAt: string;
  updatedAt: string;
  frontendPort?: number;
  backendPort?: number;
};

export type PortCheckResult = {
  desired: {
    frontendPort: number;
    backendPort: number;
  };
  suggested: {
    frontendPort: number;
    backendPort: number;
  };
  conflicts: Array<{
    key: "frontendPort" | "backendPort";
    desired: number;
    suggested: number;
  }>;
};

type ProjectRegistry = {
  projects: StoredProject[];
};

const DATA_DIR = path.join(os.homedir(), ".bmo");
const REGISTRY_PATH = path.join(DATA_DIR, "projects.json");
const DEFAULT_PROJECTS_ROOT = path.join(os.homedir(), "bmo-projects");
const SKIPPED_DIRS = new Set([".git", "node_modules", ".next", "dist"]);

function toIso(ts: number) {
  return new Date(ts).toISOString();
}

function expandHome(input: string) {
  if (input === "~") return os.homedir();
  if (input.startsWith("~/")) return path.join(os.homedir(), input.slice(2));
  return input;
}

function formatRelativeTime(iso: string) {
  const deltaMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(deltaMs / 60000);
  if (minutes <= 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

function detectLanguage(name: string) {
  const ext = path.extname(name).toLowerCase();
  switch (ext) {
    case ".ts":
    case ".tsx":
      return "typescript";
    case ".js":
    case ".jsx":
      return "javascript";
    case ".json":
      return "json";
    case ".md":
      return "markdown";
    case ".html":
      return "html";
    case ".css":
      return "css";
    case ".yml":
    case ".yaml":
      return "yaml";
    case ".tf":
      return "hcl";
    case ".py":
      return "python";
    case ".sh":
      return "shell";
    default:
      return "plaintext";
  }
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(DEFAULT_PROJECTS_ROOT, { recursive: true });
}

async function readRegistry(): Promise<ProjectRegistry> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(REGISTRY_PATH, "utf8");
    const parsed = JSON.parse(raw) as ProjectRegistry;
    return { projects: Array.isArray(parsed.projects) ? parsed.projects : [] };
  } catch {
    return { projects: [] };
  }
}

async function writeRegistry(registry: ProjectRegistry) {
  await ensureDataDir();
  await fs.writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

async function isPortFree(port: number) {
  await new Promise<void>((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once("error", reject);
    server.listen(port, "0.0.0.0", () => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  });
  return true;
}

async function nextPort(projects: StoredProject[], key: "frontendPort" | "backendPort", start: number) {
  const used = new Set(projects.map((project) => project[key]).filter((value): value is number => typeof value === "number"));
  let port = start;
  while (used.has(port)) port += 1;
  while (true) {
    if (!used.has(port)) {
      try {
        await isPortFree(port);
        return port;
      } catch {
        // Try the next candidate.
      }
    }
    port += 1;
  }
}

async function isPortAvailable(projects: StoredProject[], key: "frontendPort" | "backendPort", port: number) {
  const used = new Set(projects.map((project) => project[key]).filter((value): value is number => typeof value === "number"));
  if (used.has(port)) return false;
  try {
    await isPortFree(port);
    return true;
  } catch {
    return false;
  }
}

async function findTemplatePath(templateId: string) {
  const root = path.resolve(process.cwd(), "..", "templates");
  for (const source of ["official", "community"]) {
    const templatePath = path.join(root, source, templateId);
    try {
      const stat = await fs.stat(templatePath);
      if (stat.isDirectory()) return templatePath;
    } catch {
      // continue
    }
  }
  return null;
}

async function copyTemplate(templatePath: string, destPath: string) {
  await fs.mkdir(destPath, { recursive: true });
  const entries = await fs.readdir(templatePath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "bmo-template.json") continue;
    const src = path.join(templatePath, entry.name);
    const dst = path.join(destPath, entry.name);
    await fs.cp(src, dst, { recursive: true });
  }
}

async function writeProjectEnv(project: StoredProject) {
  const envPath = path.join(project.path, ".env");
  const content = [
    `FRONTEND_PORT=${project.frontendPort ?? 3000}`,
    `BACKEND_PORT=${project.backendPort ?? 4000}`,
    `NEXT_PUBLIC_API_BASE_URL=http://localhost:${project.backendPort ?? 4000}/api`,
    `CORS_ORIGIN=http://localhost:${project.frontendPort ?? 3000}`,
    "",
  ].join("\n");
  await fs.writeFile(envPath, content, "utf8");
}

async function startCompose(project: StoredProject) {
  const composePath = path.join(project.path, "docker-compose.yml");
  try {
    await fs.access(composePath);
  } catch {
    return;
  }

  await execFileAsync("docker", ["compose", "up", "--build", "-d"], {
    cwd: project.path,
    env: process.env,
    maxBuffer: 10 * 1024 * 1024,
  });
}

async function stopCompose(project: StoredProject) {
  const composePath = path.join(project.path, "docker-compose.yml");
  try {
    await fs.access(composePath);
  } catch {
    return;
  }

  await execFileAsync("docker", ["compose", "stop"], {
    cwd: project.path,
    env: process.env,
    maxBuffer: 10 * 1024 * 1024,
  });
}

async function downCompose(project: StoredProject) {
  const composePath = path.join(project.path, "docker-compose.yml");
  try {
    await fs.access(composePath);
  } catch {
    return;
  }

  await execFileAsync("docker", ["compose", "down", "--remove-orphans"], {
    cwd: project.path,
    env: process.env,
    maxBuffer: 10 * 1024 * 1024,
  });
}

export async function listProjects() {
  const registry = await readRegistry();
  return registry.projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getProject(id: string) {
  const registry = await readRegistry();
  return registry.projects.find((project) => project.id === id) ?? null;
}

async function saveProject(updated: StoredProject) {
  const registry = await readRegistry();
  registry.projects = registry.projects.map((project) => (project.id === updated.id ? updated : project));
  await writeRegistry(registry);
  return updated;
}

export async function createProject(input: {
  id: string;
  description: string;
  templateId: string;
  templateName: string;
  language: string;
  path: string;
  frontendPort?: number;
  backendPort?: number;
}) {
  const registry = await readRegistry();
  if (registry.projects.some((project) => project.id === input.id)) {
    throw new Error("A project with this name already exists.");
  }

  const templatePath = await findTemplatePath(input.templateId);
  if (!templatePath) {
    throw new Error("Template not found.");
  }

  const destPath = path.resolve(expandHome(input.path));
  try {
    const existing = await fs.readdir(destPath);
    if (existing.length > 0) {
      throw new Error("Project path already exists and is not empty.");
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  await copyTemplate(templatePath, destPath);

  const desiredFrontendPort = input.frontendPort ?? 3000;
  const desiredBackendPort = input.backendPort ?? 4000;
  if (!(await isPortAvailable(registry.projects, "frontendPort", desiredFrontendPort))) {
    throw new Error(`Frontend port ${desiredFrontendPort} is not available.`);
  }
  if (!(await isPortAvailable(registry.projects, "backendPort", desiredBackendPort))) {
    throw new Error(`Backend port ${desiredBackendPort} is not available.`);
  }

  const now = toIso(Date.now());
  const project: StoredProject = {
    id: input.id,
    name: input.id,
    description: input.description,
    path: destPath,
    templateId: input.templateId,
    templateName: input.templateName,
    language: input.language,
    status: "stopped",
    createdAt: now,
    updatedAt: now,
    frontendPort: desiredFrontendPort,
    backendPort: desiredBackendPort,
  };

  await writeProjectEnv(project);

  try {
    await startCompose(project);
    project.status = "running";
    project.updatedAt = toIso(Date.now());
  } catch {
    project.status = "stopped";
  }

  registry.projects.unshift(project);
  await writeRegistry(registry);
  return project;
}

export async function checkProjectPorts(input?: {
  frontendPort?: number;
  backendPort?: number;
}): Promise<PortCheckResult> {
  const registry = await readRegistry();
  const desired = {
    frontendPort: input?.frontendPort ?? 3000,
    backendPort: input?.backendPort ?? 4000,
  };
  const suggested = {
    frontendPort: desired.frontendPort,
    backendPort: desired.backendPort,
  };
  const conflicts: PortCheckResult["conflicts"] = [];

  if (!(await isPortAvailable(registry.projects, "frontendPort", desired.frontendPort))) {
    suggested.frontendPort = await nextPort(registry.projects, "frontendPort", desired.frontendPort);
    conflicts.push({ key: "frontendPort", desired: desired.frontendPort, suggested: suggested.frontendPort });
  }

  if (!(await isPortAvailable(registry.projects, "backendPort", desired.backendPort))) {
    suggested.backendPort = await nextPort(registry.projects, "backendPort", desired.backendPort);
    conflicts.push({ key: "backendPort", desired: desired.backendPort, suggested: suggested.backendPort });
  }

  return { desired, suggested, conflicts };
}

async function buildFileTree(dirPath: string, rootPath: string): Promise<FileNode[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const nodes: FileNode[] = [];

  for (const entry of entries.sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()) || a.name.localeCompare(b.name))) {
    if (SKIPPED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(rootPath, fullPath);
    if (entry.isDirectory()) {
      nodes.push({
        id: relativePath,
        name: entry.name,
        type: "folder",
        children: await buildFileTree(fullPath, rootPath),
      });
      continue;
    }

    let content = "";
    try {
      content = await fs.readFile(fullPath, "utf8");
    } catch {
      content = "";
    }

    nodes.push({
      id: relativePath,
      name: entry.name,
      type: "file",
      language: detectLanguage(entry.name),
      content,
    });
  }

  return nodes;
}

export async function getProjectTree(projectId: string) {
  const project = await getProject(projectId);
  if (!project) return null;
  return buildFileTree(project.path, project.path);
}

export async function startProject(projectId: string) {
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found.");
  await startCompose(project);
  return saveProject({ ...project, status: "running", updatedAt: toIso(Date.now()) });
}

export async function stopProject(projectId: string) {
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found.");
  await stopCompose(project);
  return saveProject({ ...project, status: "stopped", updatedAt: toIso(Date.now()) });
}

export async function restartProject(projectId: string) {
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found.");
  await stopCompose(project);
  await startCompose(project);
  return saveProject({ ...project, status: "running", updatedAt: toIso(Date.now()) });
}

export async function deleteProject(projectId: string) {
  const registry = await readRegistry();
  const project = registry.projects.find((entry) => entry.id === projectId);
  if (!project) throw new Error("Project not found.");

  try {
    await downCompose(project);
  } catch {
    // If docker is unavailable, continue with deletion of local project data.
  }

  await fs.rm(project.path, { recursive: true, force: true });
  registry.projects = registry.projects.filter((entry) => entry.id !== projectId);
  await writeRegistry(registry);
}

export function toProjectCard(project: StoredProject) {
  return {
    id: project.id,
    name: project.name,
    description: project.description || `${project.templateName} project`,
    path: project.path.replace(os.homedir(), "~"),
    lastOpened: formatRelativeTime(project.updatedAt),
    lang: project.language,
    status: project.status,
  };
}
