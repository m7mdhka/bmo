import "server-only";

import type { FileNode, ProjectRuntimeInfo } from "@/components/projects/workspace/workspace-types";
import { orchestratorFetch } from "@/lib/orchestrator-api";

export type ProjectPortBinding = {
  id: string;
  label: string;
  service: string;
  containerPort: number;
  hostPort: number;
  envVar: string;
  kind: "preview" | "api" | "service";
};

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
  portBindings: ProjectPortBinding[];
  previewPortId: string | null;
};

export type PortCheckResult = {
  desired: Record<string, number>;
  suggested: Record<string, number>;
  conflicts: Array<{
    id: string;
    label: string;
    desired: number;
    suggested: number;
  }>;
};

type ApiStoredProject = {
  id: string;
  name: string;
  description: string;
  path: string;
  template_id: string;
  template_name: string;
  language: string;
  status: "running" | "stopped";
  created_at: string;
  updated_at: string;
  preview_port_id: string | null;
  port_bindings: Array<{
    id: string;
    label: string;
    service: string;
    container_port: number;
    host_port: number;
    env_var: string;
    kind: "preview" | "api" | "service";
  }>;
};

type ApiRuntimeInfo = {
  project_status: "running" | "stopped";
  services: Array<{
    name: string;
    label: string;
    status: "running" | "stopped";
    role: "workspace" | "frontend" | "backend" | "service";
    terminal: boolean;
    logs: boolean;
    buildable: boolean;
    restartable: boolean;
    agent_allowed: boolean;
  }>;
  default_terminal_service: string | null;
  preview_service: string | null;
  preview_url: string | null;
  has_pending_runtime_changes: boolean;
};

function mapProject(project: ApiStoredProject): StoredProject {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    path: project.path,
    templateId: project.template_id,
    templateName: project.template_name,
    language: project.language,
    status: project.status,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    previewPortId: project.preview_port_id,
    portBindings: project.port_bindings.map((binding) => ({
      id: binding.id,
      label: binding.label,
      service: binding.service,
      containerPort: binding.container_port,
      hostPort: binding.host_port,
      envVar: binding.env_var,
      kind: binding.kind,
    })),
  };
}

function mapRuntime(runtime: ApiRuntimeInfo): ProjectRuntimeInfo {
  return {
    projectStatus: runtime.project_status,
    services: runtime.services.map((service) => ({
      name: service.name,
      label: service.label,
      status: service.status,
      role: service.role,
    })),
    defaultTerminalService: runtime.default_terminal_service,
    previewService: runtime.preview_service,
  };
}

export async function listProjects() {
  const payload = await orchestratorFetch<{ projects: ApiStoredProject[] }>("/projects");
  return payload.projects.map(mapProject);
}

export async function getProject(id: string) {
  try {
    const payload = await orchestratorFetch<{ project: ApiStoredProject }>(`/projects/${encodeURIComponent(id)}`);
    return mapProject(payload.project);
  } catch {
    return null;
  }
}

export async function createProject(input: {
  id: string;
  description: string;
  templateId: string;
  templateName: string;
  language: string;
  path: string;
  ports?: Record<string, number>;
}) {
  const payload = await orchestratorFetch<{ project: ApiStoredProject }>("/projects", {
    method: "POST",
    body: {
      id: input.id,
      description: input.description,
      template_id: input.templateId,
      template_name: input.templateName,
      language: input.language,
      path: input.path,
      ports: input.ports,
    },
  });
  return mapProject(payload.project);
}

export async function checkProjectPorts(input: { templateId: string; ports?: Record<string, number> }): Promise<PortCheckResult> {
  return orchestratorFetch<PortCheckResult>("/projects/ports", {
    method: "POST",
    body: {
      templateId: input.templateId,
      ports: input.ports,
    },
  });
}

export async function getProjectTree(projectId: string): Promise<FileNode[] | null> {
  try {
    const payload = await orchestratorFetch<{ tree: FileNode[] }>(`/projects/${encodeURIComponent(projectId)}/tree`);
    return payload.tree;
  } catch {
    return null;
  }
}

export async function writeProjectFile(projectId: string, fileId: string, content: string) {
  await orchestratorFetch(`/projects/${encodeURIComponent(projectId)}/files`, {
    method: "PATCH",
    body: { file_id: fileId, content },
  });
}

export async function getProjectRuntime(projectId: string): Promise<ProjectRuntimeInfo> {
  const payload = await orchestratorFetch<{ runtime: ApiRuntimeInfo }>(`/projects/${encodeURIComponent(projectId)}/runtime`);
  return mapRuntime(payload.runtime);
}

export async function startProject(projectId: string) {
  const payload = await orchestratorFetch<{ project: ApiStoredProject }>(`/projects/${encodeURIComponent(projectId)}`, {
    method: "PATCH",
    body: { action: "start" },
  });
  return mapProject(payload.project);
}

export async function stopProject(projectId: string) {
  const payload = await orchestratorFetch<{ project: ApiStoredProject }>(`/projects/${encodeURIComponent(projectId)}`, {
    method: "PATCH",
    body: { action: "stop" },
  });
  return mapProject(payload.project);
}

export async function restartProject(projectId: string) {
  const payload = await orchestratorFetch<{ project: ApiStoredProject }>(`/projects/${encodeURIComponent(projectId)}`, {
    method: "PATCH",
    body: { action: "restart" },
  });
  return mapProject(payload.project);
}

export async function applyProjectRuntimeChanges(projectId: string) {
  const payload = await orchestratorFetch<{ project: ApiStoredProject }>(`/projects/${encodeURIComponent(projectId)}/runtime`, {
    method: "PATCH",
    body: { action: "apply" },
  });
  return mapProject(payload.project);
}

export async function buildProjectService(projectId: string, service: string) {
  const payload = await orchestratorFetch<{ project: ApiStoredProject }>(`/projects/${encodeURIComponent(projectId)}/runtime`, {
    method: "PATCH",
    body: { action: "build-service", service },
  });
  return mapProject(payload.project);
}

export async function restartProjectService(projectId: string, service: string) {
  const payload = await orchestratorFetch<{ project: ApiStoredProject }>(`/projects/${encodeURIComponent(projectId)}/runtime`, {
    method: "PATCH",
    body: { action: "restart-service", service },
  });
  return mapProject(payload.project);
}

export async function getProjectLogs(projectId: string, input?: { service?: string; tail?: number; since?: string | null }) {
  const params = new URLSearchParams();
  if (input?.service) params.set("service", input.service);
  if (input?.tail) params.set("tail", String(input.tail));
  if (input?.since) params.set("since", input.since);
  const suffix = params.size ? `?${params.toString()}` : "";
  const payload = await orchestratorFetch<{ logs: string }>(`/projects/${encodeURIComponent(projectId)}/logs${suffix}`);
  return payload.logs;
}

export async function deleteProject(projectId: string) {
  await orchestratorFetch(`/projects/${encodeURIComponent(projectId)}`, { method: "DELETE" });
}

export function getProjectPreviewUrl(project: StoredProject) {
  const previewBinding =
    project.portBindings.find((binding) => binding.id === project.previewPortId) ??
    project.portBindings.find((binding) => binding.kind === "preview");
  return previewBinding ? `http://localhost:${previewBinding.hostPort}` : null;
}

export function toProjectCard(project: StoredProject) {
  const deltaMs = Date.now() - new Date(project.updatedAt).getTime();
  const minutes = Math.round(deltaMs / 60000);
  const lastOpened =
    minutes <= 1 ? "just now" : minutes < 60 ? `${minutes}m ago` : minutes < 24 * 60 ? `${Math.round(minutes / 60)}h ago` : `${Math.round(minutes / 1440)}d ago`;
  return {
    id: project.id,
    name: project.name,
    description: project.description || `${project.templateName} project`,
    path: project.path.replace(process.env.HOME ?? "", "~"),
    lastOpened,
    lang: project.language,
    status: project.status,
  };
}
