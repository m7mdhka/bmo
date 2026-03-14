from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


ServiceRole = Literal["workspace", "frontend", "backend", "service"]
PortKind = Literal["preview", "api", "service"]
ProjectStatus = Literal["running", "stopped"]


class RuntimeServiceSpec(BaseModel):
    name: str
    label: str
    role: ServiceRole = "service"
    terminal: bool = True
    logs: bool = True
    buildable: bool = False
    restartable: bool = False
    default_shell: str | None = None
    agent_allowed: bool = True


class RuntimePortSpec(BaseModel):
    id: str
    label: str
    service: str
    container_port: int
    preferred_host_port: int
    env_var: str
    kind: PortKind = "service"
    preview: bool = False


class RuntimeCapabilities(BaseModel):
    apply_runtime_changes: bool = True
    per_service_build: bool = True
    per_service_restart: bool = True


class AgentPolicy(BaseModel):
    mode: Literal["backend-mediated", "full-in-container", "mixed"] = "full-in-container"
    docker_access: bool = False


class TemplateRuntimeSpec(BaseModel):
    default_terminal_service: str | None = None
    preview_port_id: str | None = None
    services: list[RuntimeServiceSpec] = []
    ports: list[RuntimePortSpec] = []
    env_templates: dict[str, str] = {}
    capabilities: RuntimeCapabilities = RuntimeCapabilities()
    agent_policy: AgentPolicy = AgentPolicy()


class TemplateRecord(BaseModel):
    id: str
    name: str
    description: str
    source: Literal["official", "community"]
    tags: list[str]
    language: str
    maintained_by: str
    url: str | None = None
    icon: str
    category: str
    runtime: TemplateRuntimeSpec


class ProjectPortBinding(BaseModel):
    id: str
    label: str
    service: str
    container_port: int
    host_port: int
    env_var: str
    kind: PortKind = "service"


class StoredProject(BaseModel):
    id: str
    name: str
    description: str
    path: str
    template_id: str
    template_name: str
    language: str
    status: ProjectStatus
    created_at: str
    updated_at: str
    port_bindings: list[ProjectPortBinding] = []
    preview_port_id: str | None = None


class ProjectCard(BaseModel):
    id: str
    name: str
    description: str
    path: str
    last_opened: str
    lang: str
    status: ProjectStatus


class ProjectRuntimeService(BaseModel):
    name: str
    label: str
    status: ProjectStatus
    role: ServiceRole
    terminal: bool = True
    logs: bool = True
    buildable: bool = False
    restartable: bool = False
    agent_allowed: bool = True


class ProjectRuntimeInfo(BaseModel):
    project_status: ProjectStatus
    services: list[ProjectRuntimeService]
    default_terminal_service: str | None
    preview_service: str | None
    preview_url: str | None = None
    has_pending_runtime_changes: bool = False


class FileNode(BaseModel):
    id: str
    name: str
    type: Literal["file", "folder"]
    language: str | None = None
    content: str | None = None
    children: list["FileNode"] | None = None


class PortConflict(BaseModel):
    id: str
    label: str
    desired: int
    suggested: int


class PortCheckResult(BaseModel):
    desired: dict[str, int]
    suggested: dict[str, int]
    conflicts: list[PortConflict]


class ProjectCreateRequest(BaseModel):
    id: str
    description: str = ""
    template_id: str
    template_name: str
    language: str
    path: str
    ports: dict[str, int] | None = None


class ProjectActionRequest(BaseModel):
    action: Literal["start", "stop", "restart"]


class RuntimeActionRequest(BaseModel):
    action: Literal["apply", "build-service", "restart-service"]
    service: str | None = None


class FileWriteRequest(BaseModel):
    file_id: str
    content: str


class TerminalOpenRequest(BaseModel):
    service: str


class TerminalWriteRequest(BaseModel):
    input: str | None = None
    cols: int | None = None
    rows: int | None = None


class TerminalOpenResponse(BaseModel):
    session_id: str
    service: str
    cursor: int


class TerminalChunk(BaseModel):
    seq: int
    data: str


class TerminalOutputResponse(BaseModel):
    chunks: list[TerminalChunk]
    cursor: int
    closed: bool
    exit_code: int | None = None


FileNode.model_rebuild()
