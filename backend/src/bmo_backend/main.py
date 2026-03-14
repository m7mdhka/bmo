from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from .config import settings
from .database import connect, ensure_database
from .models import (
    FileWriteRequest,
    PortCheckResult,
    ProjectActionRequest,
    ProjectCreateRequest,
    RuntimeActionRequest,
    TerminalOpenRequest,
    TerminalOpenResponse,
    TerminalOutputResponse,
    TerminalWriteRequest,
)
from .project_service import (
    apply_runtime_changes,
    build_project_service,
    check_ports,
    create_project,
    delete_project,
    get_project,
    get_project_logs,
    get_project_runtime,
    get_project_tree,
    list_projects,
    project_card,
    restart_project,
    restart_project_service,
    start_project,
    stop_project,
    write_project_file,
)
from .template_registry import load_template, load_templates
from .terminal_manager import terminal_manager
from .utils import now_iso

app = FastAPI(title="BMO Orchestrator", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    ensure_database()
    with connect() as connection:
        connection.execute("UPDATE terminal_sessions SET status = 'stale', updated_at = ?", (now_iso(),))


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/templates")
def templates() -> dict[str, object]:
    return {"templates": [template.model_dump(by_alias=False) for template in load_templates()]}


@app.get("/templates/{template_id}")
def template_detail(template_id: str) -> dict[str, object]:
    template = load_template(template_id)
    if template is None:
        raise HTTPException(status_code=404, detail="Template not found.")
    return {"template": template.model_dump(by_alias=False)}


@app.get("/projects")
def projects() -> dict[str, object]:
    project_rows = list_projects()
    return {
        "projects": [project.model_dump(by_alias=False) for project in project_rows],
        "cards": [project_card(project).model_dump(by_alias=False) for project in project_rows],
    }


@app.post("/projects/ports")
def project_ports(body: dict[str, object]) -> PortCheckResult:
    template_id = str(body.get("templateId") or "").strip()
    if not template_id:
        raise HTTPException(status_code=400, detail="Template id is required.")
    try:
        return check_ports(template_id, body.get("ports") if isinstance(body.get("ports"), dict) else None)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.post("/projects")
def projects_create(body: ProjectCreateRequest) -> dict[str, object]:
    try:
        project = create_project(body)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return {"project": project.model_dump(by_alias=False)}


@app.get("/projects/{project_id}")
def project_detail(project_id: str) -> dict[str, object]:
    project = get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")
    return {"project": project.model_dump(by_alias=False)}


@app.delete("/projects/{project_id}")
def project_delete(project_id: str) -> dict[str, bool]:
    try:
        delete_project(project_id)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return {"ok": True}


@app.patch("/projects/{project_id}")
def project_action(project_id: str, body: ProjectActionRequest) -> dict[str, object]:
    try:
        if body.action == "start":
            project = start_project(project_id)
        elif body.action == "stop":
            project = stop_project(project_id)
        else:
            project = restart_project(project_id)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return {"project": project.model_dump(by_alias=False)}


@app.get("/projects/{project_id}/tree")
def project_tree(project_id: str) -> dict[str, object]:
    try:
        tree = get_project_tree(project_id)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return {"tree": [node.model_dump(by_alias=False) for node in tree]}


@app.patch("/projects/{project_id}/files")
def project_write_file(project_id: str, body: FileWriteRequest) -> dict[str, bool]:
    try:
        write_project_file(project_id, body.file_id, body.content)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return {"ok": True}


@app.get("/projects/{project_id}/runtime")
def project_runtime(project_id: str) -> dict[str, object]:
    try:
        runtime = get_project_runtime(project_id)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return {"runtime": runtime.model_dump(by_alias=False)}


@app.patch("/projects/{project_id}/runtime")
def project_runtime_action(project_id: str, body: RuntimeActionRequest) -> dict[str, object]:
    try:
        if body.action == "apply":
            project = apply_runtime_changes(project_id)
        elif body.action == "build-service":
            if not body.service:
                raise HTTPException(status_code=400, detail="Service is required.")
            project = build_project_service(project_id, body.service)
        else:
            if not body.service:
                raise HTTPException(status_code=400, detail="Service is required.")
            project = restart_project_service(project_id, body.service)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return {"project": project.model_dump(by_alias=False)}


@app.get("/projects/{project_id}/logs")
def project_logs(
    project_id: str,
    service: str | None = Query(default=None),
    tail: int = Query(default=200),
    since: str | None = Query(default=None),
) -> dict[str, object]:
    try:
        logs = get_project_logs(project_id, service, tail, since)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return {"logs": logs, "fetchedAt": now_iso()}


@app.post("/projects/{project_id}/terminal")
def open_terminal(project_id: str, body: TerminalOpenRequest) -> TerminalOpenResponse:
    project = get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")
    session = terminal_manager.create(project_id=project_id, service=body.service, cwd=Path(project.path))
    with connect() as connection:
        connection.execute(
            "INSERT OR REPLACE INTO terminal_sessions (session_id, project_id, service, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            (session.session_id, project_id, body.service, "open", now_iso(), now_iso()),
        )
    return TerminalOpenResponse(session_id=session.session_id, service=body.service, cursor=session.seq)


@app.patch("/projects/{project_id}/terminal/{session_id}")
def write_terminal(project_id: str, session_id: str, body: TerminalWriteRequest) -> dict[str, bool]:
    del project_id
    try:
        if body.input:
            terminal_manager.write(session_id, body.input)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except RuntimeError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return {"ok": True}


@app.delete("/projects/{project_id}/terminal/{session_id}")
def close_terminal(project_id: str, session_id: str) -> dict[str, bool]:
    del project_id
    terminal_manager.close(session_id)
    with connect() as connection:
        connection.execute("UPDATE terminal_sessions SET status = 'closed', updated_at = ? WHERE session_id = ?", (now_iso(), session_id))
    return {"ok": True}


@app.get("/projects/{project_id}/terminal/{session_id}/output")
def terminal_output(project_id: str, session_id: str, cursor: int = Query(default=0)) -> TerminalOutputResponse:
    del project_id
    try:
        chunks, next_cursor, closed, exit_code = terminal_manager.read(session_id, cursor)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return TerminalOutputResponse(
        chunks=[{"seq": chunk.seq, "data": chunk.data} for chunk in chunks],
        cursor=next_cursor,
        closed=closed,
        exit_code=exit_code,
    )


def run() -> None:
    uvicorn.run("bmo_backend.main:app", host=settings.host, port=settings.port, reload=False)
