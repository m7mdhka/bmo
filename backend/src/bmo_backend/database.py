from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path

from .config import settings


SCHEMA = """
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  path TEXT NOT NULL,
  template_id TEXT NOT NULL,
  template_name TEXT NOT NULL,
  language TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  preview_port_id TEXT
);

CREATE TABLE IF NOT EXISTS project_port_bindings (
  project_id TEXT NOT NULL,
  binding_id TEXT NOT NULL,
  label TEXT NOT NULL,
  service TEXT NOT NULL,
  container_port INTEGER NOT NULL,
  host_port INTEGER NOT NULL,
  env_var TEXT NOT NULL,
  kind TEXT NOT NULL,
  PRIMARY KEY (project_id, binding_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS terminal_sessions (
  session_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  service TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
"""


def ensure_database() -> None:
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    settings.projects_root.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(settings.database_path) as connection:
        connection.executescript(SCHEMA)
        connection.commit()
    migrate_legacy_registry()


@contextmanager
def connect():
    connection = sqlite3.connect(settings.database_path)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def migrate_legacy_registry() -> None:
    legacy_path = settings.legacy_registry_path
    if not legacy_path.exists():
        return
    payload = json.loads(legacy_path.read_text("utf-8"))
    projects = payload.get("projects", [])
    with connect() as connection:
        existing = connection.execute("SELECT COUNT(*) FROM projects").fetchone()[0]
        if existing:
            return
        for project in projects:
            connection.execute(
                """
                INSERT INTO projects (
                  id, name, description, path, template_id, template_name, language, status, created_at, updated_at, preview_port_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    project["id"],
                    project.get("name", project["id"]),
                    project.get("description", ""),
                    project["path"],
                    project["templateId"],
                    project.get("templateName", project["templateId"]),
                    project.get("language", "Any"),
                    project.get("status", "stopped"),
                    project.get("createdAt"),
                    project.get("updatedAt"),
                    project.get("previewPortId"),
                ),
            )
            bindings = project.get("portBindings", [])
            if not bindings:
                if isinstance(project.get("frontendPort"), int):
                    bindings.append(
                        {
                            "id": "web",
                            "label": "Web preview",
                            "service": "frontend",
                            "containerPort": 3000,
                            "hostPort": project["frontendPort"],
                            "envVar": "FRONTEND_PORT",
                            "kind": "preview",
                        }
                    )
                if isinstance(project.get("backendPort"), int):
                    bindings.append(
                        {
                            "id": "api",
                            "label": "API",
                            "service": "backend",
                            "containerPort": 4000,
                            "hostPort": project["backendPort"],
                            "envVar": "BACKEND_PORT",
                            "kind": "api",
                        }
                    )
            for binding in bindings:
                connection.execute(
                    """
                    INSERT INTO project_port_bindings (
                      project_id, binding_id, label, service, container_port, host_port, env_var, kind
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        project["id"],
                        binding["id"],
                        binding["label"],
                        binding["service"],
                        binding["containerPort"],
                        binding["hostPort"],
                        binding["envVar"],
                        binding["kind"],
                    ),
                )
