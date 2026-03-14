import "server-only";

import { OrchestratorUnavailableError, orchestratorFetch } from "@/lib/orchestrator-api";

export type TemplateSource = "official" | "community";

export type TemplateRuntimeService = {
  name: string;
  label: string;
  role: "workspace" | "frontend" | "backend" | "service";
  terminal: boolean;
  logs: boolean;
  buildable: boolean;
  restartable: boolean;
  defaultShell?: string | null;
  agentAllowed: boolean;
};

export type TemplateRuntimePort = {
  id: string;
  label: string;
  service: string;
  containerPort: number;
  preferredHostPort: number;
  envVar: string;
  kind: "preview" | "api" | "service";
  preview?: boolean;
};

export type TemplateRuntimeConfig = {
  defaultTerminalService: string | null;
  previewPortId: string | null;
  services: TemplateRuntimeService[];
  ports: TemplateRuntimePort[];
  envTemplates: Record<string, string>;
  capabilities: {
    applyRuntimeChanges: boolean;
    perServiceBuild: boolean;
    perServiceRestart: boolean;
  };
  agentPolicy: {
    mode: "backend-mediated" | "full-in-container" | "mixed";
    dockerAccess: boolean;
  };
};

export type TemplateRecord = {
  id: string;
  name: string;
  description: string;
  source: TemplateSource;
  tags: string[];
  language: string;
  maintainedBy: string;
  url?: string;
  icon: string;
  category: string;
  runtime: TemplateRuntimeConfig;
};

const WEB_APP_FALLBACK: TemplateRecord = {
  id: "web-app",
  name: "Web App",
  description: "Full-stack web application starter with a Next.js frontend, NestJS backend, Docker Compose runtime, and AWS Terraform infra.",
  source: "official",
  tags: ["nextjs", "react", "nestjs", "typescript", "tailwind", "docker", "compose", "terraform", "aws"],
  language: "TypeScript",
  maintainedBy: "BMO team",
  icon: "nextjs",
  category: "fullstack",
  runtime: {
    defaultTerminalService: "workspace",
    previewPortId: "web",
    services: [
      {
        name: "workspace",
        label: "Workspace shell",
        role: "workspace",
        terminal: true,
        logs: true,
        buildable: false,
        restartable: false,
        defaultShell: "sh",
        agentAllowed: true,
      },
      {
        name: "frontend",
        label: "Web app",
        role: "frontend",
        terminal: true,
        logs: true,
        buildable: true,
        restartable: true,
        defaultShell: "sh",
        agentAllowed: true,
      },
      {
        name: "backend",
        label: "API server",
        role: "backend",
        terminal: true,
        logs: true,
        buildable: true,
        restartable: true,
        defaultShell: "sh",
        agentAllowed: true,
      },
    ],
    ports: [
      {
        id: "web",
        label: "Web preview",
        service: "frontend",
        containerPort: 3000,
        preferredHostPort: 3000,
        envVar: "FRONTEND_PORT",
        kind: "preview",
        preview: true,
      },
      {
        id: "api",
        label: "API",
        service: "backend",
        containerPort: 4000,
        preferredHostPort: 4000,
        envVar: "BACKEND_PORT",
        kind: "api",
      },
    ],
    envTemplates: {
      NEXT_PUBLIC_API_BASE_URL: "http://localhost:${port:api}/api",
      CORS_ORIGIN: "http://localhost:${port:web}",
    },
    capabilities: {
      applyRuntimeChanges: true,
      perServiceBuild: true,
      perServiceRestart: true,
    },
    agentPolicy: {
      mode: "full-in-container",
      dockerAccess: false,
    },
  },
};

type TemplateApiRecord = {
  id: string;
  name: string;
  description: string;
  source: TemplateSource;
  tags: string[];
  language: string;
  maintained_by: string;
  url?: string | null;
  icon: string;
  category: string;
  runtime: {
    default_terminal_service: string | null;
    preview_port_id: string | null;
    services: Array<{
      name: string;
      label: string;
      role: "workspace" | "frontend" | "backend" | "service";
      terminal: boolean;
      logs: boolean;
      buildable: boolean;
      restartable: boolean;
      default_shell?: string | null;
      agent_allowed: boolean;
    }>;
    ports: Array<{
      id: string;
      label: string;
      service: string;
      container_port: number;
      preferred_host_port: number;
      env_var: string;
      kind: "preview" | "api" | "service";
      preview?: boolean;
    }>;
    env_templates: Record<string, string>;
    capabilities: {
      apply_runtime_changes: boolean;
      per_service_build: boolean;
      per_service_restart: boolean;
    };
    agent_policy: {
      mode: "backend-mediated" | "full-in-container" | "mixed";
      docker_access: boolean;
    };
  };
};

function mapTemplate(record: TemplateApiRecord): TemplateRecord {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    source: record.source,
    tags: record.tags,
    language: record.language,
    maintainedBy: record.maintained_by,
    url: record.url ?? undefined,
    icon: record.icon,
    category: record.category,
    runtime: {
      defaultTerminalService: record.runtime.default_terminal_service,
      previewPortId: record.runtime.preview_port_id,
      services: record.runtime.services.map((service) => ({
        name: service.name,
        label: service.label,
        role: service.role,
        terminal: service.terminal,
        logs: service.logs,
        buildable: service.buildable,
        restartable: service.restartable,
        defaultShell: service.default_shell,
        agentAllowed: service.agent_allowed,
      })),
      ports: record.runtime.ports.map((port) => ({
        id: port.id,
        label: port.label,
        service: port.service,
        containerPort: port.container_port,
        preferredHostPort: port.preferred_host_port,
        envVar: port.env_var,
        kind: port.kind,
        preview: port.preview,
      })),
      envTemplates: record.runtime.env_templates,
      capabilities: {
        applyRuntimeChanges: record.runtime.capabilities.apply_runtime_changes,
        perServiceBuild: record.runtime.capabilities.per_service_build,
        perServiceRestart: record.runtime.capabilities.per_service_restart,
      },
      agentPolicy: {
        mode: record.runtime.agent_policy.mode,
        dockerAccess: record.runtime.agent_policy.docker_access,
      },
    },
  };
}

export async function loadTemplates(): Promise<TemplateRecord[]> {
  try {
    const payload = await orchestratorFetch<{ templates: TemplateApiRecord[] }>("/templates");
    return payload.templates.map(mapTemplate);
  } catch (error) {
    if (error instanceof OrchestratorUnavailableError) {
      return [WEB_APP_FALLBACK];
    }
    throw error;
  }
}

export async function loadTemplate(templateId: string): Promise<TemplateRecord | null> {
  try {
    const payload = await orchestratorFetch<{ template: TemplateApiRecord }>(`/templates/${encodeURIComponent(templateId)}`);
    return mapTemplate(payload.template);
  } catch {
    return null;
  }
}
