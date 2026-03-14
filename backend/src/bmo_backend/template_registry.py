from __future__ import annotations

import json
from pathlib import Path

from .config import settings
from .models import AgentPolicy, RuntimeCapabilities, RuntimePortSpec, RuntimeServiceSpec, TemplateRecord, TemplateRuntimeSpec


def _title_from_slug(slug: str) -> str:
    return " ".join(part.capitalize() for part in slug.replace("_", "-").split("-") if part)


def _infer_language(raw: dict) -> str:
    language = str(raw.get("language") or "").strip()
    if language:
        return language
    tags = {str(tag).lower() for tag in raw.get("tags", [])}
    if "typescript" in tags:
        return "TypeScript"
    if "javascript" in tags:
        return "JavaScript"
    if "python" in tags:
        return "Python"
    if "markdown" in tags:
        return "Markdown"
    if "html" in tags:
        return "HTML"
    return "Any"


def _load_runtime(raw: dict) -> TemplateRuntimeSpec:
    runtime = raw.get("runtime") or {}
    services = [
        RuntimeServiceSpec(
            name=item["name"],
            label=str(item.get("label") or item["name"]).strip(),
            role=item.get("role", "service"),
            terminal=bool(item.get("terminal", True)),
            logs=bool(item.get("logs", True)),
            buildable=bool(item.get("buildable", False)),
            restartable=bool(item.get("restartable", False)),
            default_shell=item.get("defaultShell"),
            agent_allowed=bool(item.get("agentAllowed", True)),
        )
        for item in runtime.get("services", [])
    ]
    ports = [
        RuntimePortSpec(
            id=item["id"],
            label=item["label"],
            service=item["service"],
            container_port=int(item["containerPort"]),
            preferred_host_port=int(item["preferredHostPort"]),
            env_var=item["envVar"],
            kind=item.get("kind", "service"),
            preview=bool(item.get("preview", False)),
        )
        for item in runtime.get("ports", [])
    ]
    preview_port_id = runtime.get("previewPortId")
    if not preview_port_id:
        preview_port_id = next((port.id for port in ports if port.preview or port.kind == "preview"), None)
    return TemplateRuntimeSpec(
        default_terminal_service=runtime.get("defaultTerminalService"),
        preview_port_id=preview_port_id,
        services=services,
        ports=ports,
        env_templates={str(key): str(value) for key, value in (runtime.get("envTemplates") or {}).items()},
        capabilities=RuntimeCapabilities(**(runtime.get("capabilities") or {})),
        agent_policy=AgentPolicy(**(runtime.get("agentPolicy") or {})),
    )


def _manifest_paths() -> list[tuple[str, Path]]:
    if not settings.templates_root.exists():
        return []
    paths: list[tuple[str, Path]] = []
    for source_dir in settings.templates_root.iterdir():
        if not source_dir.is_dir() or source_dir.name not in {"official", "community"}:
            continue
        for template_dir in source_dir.iterdir():
            if template_dir.is_dir() and (template_dir / "bmo-template.json").exists():
                paths.append((source_dir.name, template_dir / "bmo-template.json"))
    return paths


def load_templates() -> list[TemplateRecord]:
    templates: list[TemplateRecord] = []
    for source, manifest_path in _manifest_paths():
        raw = json.loads(manifest_path.read_text("utf-8"))
        slug = manifest_path.parent.name
        templates.append(
            TemplateRecord(
                id=slug,
                name=str(raw.get("name") or _title_from_slug(slug)).strip(),
                description=str(raw.get("description") or "No description provided.").strip(),
                source=source,  # type: ignore[arg-type]
                tags=[str(tag) for tag in raw.get("tags", [])],
                language=_infer_language(raw),
                maintained_by=str(raw.get("maintainedBy") or ("BMO team" if source == "official" else "community")).strip(),
                url=raw.get("homepage"),
                icon=str(raw.get("icon") or raw.get("category") or "template").strip(),
                category=str(raw.get("category") or "general").strip(),
                runtime=_load_runtime(raw),
            )
        )
    return sorted(templates, key=lambda item: (item.source, item.name.lower()))


def load_template(template_id: str) -> TemplateRecord | None:
    for template in load_templates():
        if template.id == template_id:
            return template
    return None
