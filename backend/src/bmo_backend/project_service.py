from __future__ import annotations

import os
import shutil
import socket
import sqlite3
import subprocess
from pathlib import Path

from .config import settings
from .database import connect
from .models import (
    FileNode,
    PortCheckResult,
    PortConflict,
    ProjectCard,
    ProjectCreateRequest,
    ProjectPortBinding,
    ProjectRuntimeInfo,
    ProjectRuntimeService,
    StoredProject,
)
from .template_registry import load_template
from .utils import expand_home, format_relative_time, now_iso

SKIPPED_DIRS = {".git", "node_modules", ".next", "dist"}


def _detect_language(name: str) -> str:
    mapping = {
        ".ts": "typescript",
        ".tsx": "typescript",
        ".js": "javascript",
        ".jsx": "javascript",
        ".json": "json",
        ".md": "markdown",
        ".html": "html",
        ".css": "css",
        ".yml": "yaml",
        ".yaml": "yaml",
        ".tf": "hcl",
        ".py": "python",
        ".sh": "shell",
    }
    return mapping.get(Path(name).suffix.lower(), "plaintext")


def _row_to_project(connection: sqlite3.Connection, row: sqlite3.Row) -> StoredProject:
    bindings_rows = connection.execute(
        """
        SELECT binding_id, label, service, container_port, host_port, env_var, kind
        FROM project_port_bindings WHERE project_id = ? ORDER BY binding_id
        """,
        (row["id"],),
    ).fetchall()
    return StoredProject(
        id=row["id"],
        name=row["name"],
        description=row["description"],
        path=row["path"],
        template_id=row["template_id"],
        template_name=row["template_name"],
        language=row["language"],
        status=row["status"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        preview_port_id=row["preview_port_id"],
        port_bindings=[
            ProjectPortBinding(
                id=item["binding_id"],
                label=item["label"],
                service=item["service"],
                container_port=item["container_port"],
                host_port=item["host_port"],
                env_var=item["env_var"],
                kind=item["kind"],
            )
            for item in bindings_rows
        ],
    )


def list_projects() -> list[StoredProject]:
    with connect() as connection:
        rows = connection.execute("SELECT * FROM projects ORDER BY updated_at DESC").fetchall()
        return [_row_to_project(connection, row) for row in rows]


def get_project(project_id: str) -> StoredProject | None:
    with connect() as connection:
        row = connection.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
        if row is None:
            return None
        return _row_to_project(connection, row)


def _used_ports() -> set[int]:
    with connect() as connection:
        rows = connection.execute("SELECT host_port FROM project_port_bindings").fetchall()
        return {int(row["host_port"]) for row in rows}


def _is_port_free(port: int) -> bool:
    if port in _used_ports():
        return False
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            sock.bind(("0.0.0.0", port))
        except OSError:
            return False
    return True


def _next_port(start: int) -> int:
    port = start
    while not _is_port_free(port):
        port += 1
    return port


def check_ports(template_id: str, ports: dict[str, int] | None = None) -> PortCheckResult:
    template = load_template(template_id)
    if template is None:
        raise ValueError("Template not found.")
    desired: dict[str, int] = {}
    suggested: dict[str, int] = {}
    conflicts: list[PortConflict] = []
    for port in template.runtime.ports:
        desired_port = (ports or {}).get(port.id, port.preferred_host_port)
        desired[port.id] = desired_port
        suggested[port.id] = desired_port
        if not _is_port_free(desired_port):
            next_free = _next_port(desired_port)
            suggested[port.id] = next_free
            conflicts.append(PortConflict(id=port.id, label=port.label, desired=desired_port, suggested=next_free))
    return PortCheckResult(desired=desired, suggested=suggested, conflicts=conflicts)


def _copy_template(template_id: str, destination: Path) -> None:
    template_path = settings.templates_root / "official" / template_id
    if not template_path.exists():
        template_path = settings.templates_root / "community" / template_id
    if not template_path.exists():
        raise ValueError("Template not found.")
    destination.mkdir(parents=True, exist_ok=True)
    for entry in template_path.iterdir():
        if entry.name == "bmo-template.json":
            continue
        target = destination / entry.name
        if entry.is_dir():
            shutil.copytree(entry, target)
        else:
            shutil.copy2(entry, target)


def _apply_env_template(value: str, bindings: list[ProjectPortBinding]) -> str:
    rendered = value
    for binding in bindings:
        rendered = rendered.replace(f"${{port:{binding.id}}}", str(binding.host_port))
    return rendered


def _write_project_env(project: StoredProject) -> None:
    template = load_template(project.template_id)
    if template is None:
        return
    content = [
        *[f"{binding.env_var}={binding.host_port}" for binding in project.port_bindings],
        *[f"{key}={_apply_env_template(value, project.port_bindings)}" for key, value in template.runtime.env_templates.items()],
        "",
    ]
    (Path(project.path) / ".env").write_text("\n".join(content), "utf-8")


def _run_compose(project: StoredProject, *args: str) -> subprocess.CompletedProcess[str]:
    compose_path = Path(project.path) / "docker-compose.yml"
    if not compose_path.exists():
        raise ValueError("Project docker-compose.yml was not found.")
    return subprocess.run(
        ["docker", "compose", *args],
        cwd=project.path,
        env=os.environ.copy(),
        capture_output=True,
        text=True,
        check=True,
    )


def create_project(payload: ProjectCreateRequest) -> StoredProject:
    template = load_template(payload.template_id)
    if template is None:
        raise ValueError("Template not found.")
    destination = expand_home(payload.path)
    if destination.exists() and any(destination.iterdir()):
        raise ValueError("Project path already exists and is not empty.")
    port_check = check_ports(payload.template_id, payload.ports)
    if port_check.conflicts and payload.ports and payload.ports != port_check.suggested:
        conflict = port_check.conflicts[0]
        raise ValueError(f"{conflict.label} port {conflict.desired} is not available.")

    _copy_template(payload.template_id, destination)
    bindings = [
        ProjectPortBinding(
            id=port.id,
            label=port.label,
            service=port.service,
            container_port=port.container_port,
            host_port=port_check.suggested[port.id],
            env_var=port.env_var,
            kind=port.kind,
        )
        for port in template.runtime.ports
    ]
    now = now_iso()
    project = StoredProject(
        id=payload.id,
        name=payload.id,
        description=payload.description,
        path=str(destination),
        template_id=payload.template_id,
        template_name=payload.template_name,
        language=payload.language,
        status="stopped",
        created_at=now,
        updated_at=now,
        preview_port_id=template.runtime.preview_port_id,
        port_bindings=bindings,
    )
    _write_project_env(project)

    with connect() as connection:
        exists = connection.execute("SELECT 1 FROM projects WHERE id = ?", (project.id,)).fetchone()
        if exists:
            raise ValueError("A project with this name already exists.")
        connection.execute(
            """
            INSERT INTO projects (
              id, name, description, path, template_id, template_name, language, status, created_at, updated_at, preview_port_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                project.id,
                project.name,
                project.description,
                project.path,
                project.template_id,
                project.template_name,
                project.language,
                project.status,
                project.created_at,
                project.updated_at,
                project.preview_port_id,
            ),
        )
        for binding in project.port_bindings:
            connection.execute(
                """
                INSERT INTO project_port_bindings (
                  project_id, binding_id, label, service, container_port, host_port, env_var, kind
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    project.id,
                    binding.id,
                    binding.label,
                    binding.service,
                    binding.container_port,
                    binding.host_port,
                    binding.env_var,
                    binding.kind,
                ),
            )
    try:
        _run_compose(project, "up", "--build", "-d")
        project.status = "running"
        _update_project_status(project.id, "running")
    except subprocess.CalledProcessError:
        pass
    return get_project(project.id) or project


def _update_project_status(project_id: str, status: str) -> None:
    with connect() as connection:
        connection.execute(
            "UPDATE projects SET status = ?, updated_at = ? WHERE id = ?",
            (status, now_iso(), project_id),
        )


def _service_label(name: str) -> str:
    return " ".join(part.capitalize() for part in name.replace("_", "-").split("-") if part)


def _resolve_default_terminal_service(
    declared_default: str | None,
    ordered_services: list[str],
    declared_services: list,
) -> str | None:
    if declared_default and declared_default in ordered_services:
        return declared_default
    for service in declared_services:
        if service.terminal and service.name in ordered_services:
            return service.name
    for candidate in ["workspace", "frontend", "backend"]:
        if candidate in ordered_services:
            return candidate
    return ordered_services[0] if ordered_services else None


def _compose_service_names(project: StoredProject) -> list[str]:
    try:
        result = _run_compose(project, "config", "--services")
    except subprocess.CalledProcessError:
        return []
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def _running_services(project: StoredProject) -> set[str]:
    try:
        result = _run_compose(project, "ps", "--status", "running", "--services")
    except subprocess.CalledProcessError:
        return set()
    return {line.strip() for line in result.stdout.splitlines() if line.strip()}


def get_preview_url(project: StoredProject) -> str | None:
    preview_binding = next((binding for binding in project.port_bindings if binding.id == project.preview_port_id), None)
    if preview_binding is None:
        preview_binding = next((binding for binding in project.port_bindings if binding.kind == "preview"), None)
    return f"http://localhost:{preview_binding.host_port}" if preview_binding else None


def get_project_runtime(project_id: str) -> ProjectRuntimeInfo:
    project = get_project(project_id)
    if project is None:
        raise ValueError("Project not found.")
    template = load_template(project.template_id)
    compose_names = _compose_service_names(project)
    running = _running_services(project)
    declared = template.runtime.services if template else []
    ordered = (
        [service.name for service in declared if service.name in compose_names]
        + [name for name in compose_names if name not in {service.name for service in declared}]
    )
    services = []
    for name in ordered:
        spec = next((item for item in declared if item.name == name), None)
        services.append(
            ProjectRuntimeService(
                name=name,
                label=spec.label if spec else _service_label(name),
                status="running" if name in running else "stopped",
                role=spec.role if spec else ("service"),
                terminal=spec.terminal if spec else True,
                logs=spec.logs if spec else True,
                buildable=spec.buildable if spec else True,
                restartable=spec.restartable if spec else True,
                agent_allowed=spec.agent_allowed if spec else True,
            )
        )
    preview_service = None
    preview_binding = next((binding for binding in project.port_bindings if binding.id == project.preview_port_id), None)
    if preview_binding and preview_binding.service in ordered:
        preview_service = preview_binding.service
    default_terminal = _resolve_default_terminal_service(
        template.runtime.default_terminal_service if template else None,
        ordered,
        declared,
    )
    return ProjectRuntimeInfo(
        project_status=project.status,
        services=services,
        default_terminal_service=default_terminal,
        preview_service=preview_service,
        preview_url=get_preview_url(project) if project.status == "running" else None,
        has_pending_runtime_changes=False,
    )


def _walk_tree(root: Path, current: Path) -> list[FileNode]:
    nodes: list[FileNode] = []
    for entry in sorted(current.iterdir(), key=lambda item: (not item.is_dir(), item.name.lower())):
        if entry.name in SKIPPED_DIRS:
            continue
        relative = entry.relative_to(root).as_posix()
        if entry.is_dir():
            nodes.append(FileNode(id=relative, name=entry.name, type="folder", children=_walk_tree(root, entry)))
        else:
            try:
                content = entry.read_text("utf-8")
            except Exception:
                content = ""
            nodes.append(
                FileNode(
                    id=relative,
                    name=entry.name,
                    type="file",
                    language=_detect_language(entry.name),
                    content=content,
                )
            )
    return nodes


def get_project_tree(project_id: str) -> list[FileNode]:
    project = get_project(project_id)
    if project is None:
        raise ValueError("Project not found.")
    return _walk_tree(Path(project.path), Path(project.path))


def write_project_file(project_id: str, file_id: str, content: str) -> None:
    project = get_project(project_id)
    if project is None:
        raise ValueError("Project not found.")
    root = Path(project.path).resolve()
    target = (root / file_id).resolve()
    if root not in target.parents and target != root:
        raise ValueError("Invalid project file path.")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, "utf-8")
    _update_project_status(project.id, project.status)


def project_card(project: StoredProject) -> ProjectCard:
    return ProjectCard(
        id=project.id,
        name=project.name,
        description=project.description or f"{project.template_name} project",
        path=project.path.replace(str(Path.home()), "~"),
        last_opened=format_relative_time(project.updated_at),
        lang=project.language,
        status=project.status,
    )


def start_project(project_id: str) -> StoredProject:
    project = get_project(project_id)
    if project is None:
        raise ValueError("Project not found.")
    _run_compose(project, "up", "--build", "-d")
    _update_project_status(project.id, "running")
    return get_project(project.id) or project


def stop_project(project_id: str) -> StoredProject:
    project = get_project(project_id)
    if project is None:
        raise ValueError("Project not found.")
    _run_compose(project, "stop")
    _update_project_status(project.id, "stopped")
    return get_project(project.id) or project


def restart_project(project_id: str) -> StoredProject:
    project = get_project(project_id)
    if project is None:
        raise ValueError("Project not found.")
    _run_compose(project, "stop")
    _run_compose(project, "up", "--build", "-d")
    _update_project_status(project.id, "running")
    return get_project(project.id) or project


def apply_runtime_changes(project_id: str) -> StoredProject:
    return start_project(project_id)


def build_project_service(project_id: str, service: str) -> StoredProject:
    project = get_project(project_id)
    if project is None:
        raise ValueError("Project not found.")
    _run_compose(project, "build", service)
    _update_project_status(project.id, project.status)
    return get_project(project.id) or project


def restart_project_service(project_id: str, service: str) -> StoredProject:
    project = get_project(project_id)
    if project is None:
        raise ValueError("Project not found.")
    _run_compose(project, "up", "-d", "--build", service)
    _update_project_status(project.id, "running")
    return get_project(project.id) or project


def get_project_logs(project_id: str, service: str | None, tail: int, since: str | None) -> str:
    project = get_project(project_id)
    if project is None:
        raise ValueError("Project not found.")
    args = ["logs", "--timestamps", "--tail", str(tail)]
    if since:
        args += ["--since", since]
    if service:
        args.append(service)
    result = _run_compose(project, *args)
    return f"{result.stdout}{result.stderr}".strip()


def delete_project(project_id: str) -> None:
    project = get_project(project_id)
    if project is None:
        raise ValueError("Project not found.")
    try:
        _run_compose(project, "down", "--remove-orphans")
    except subprocess.CalledProcessError:
        pass
    shutil.rmtree(project.path, ignore_errors=True)
    with connect() as connection:
        connection.execute("DELETE FROM projects WHERE id = ?", (project.id,))
