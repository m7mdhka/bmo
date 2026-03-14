from __future__ import annotations

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="BMO_", extra="ignore")

    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8000)
    data_dir: Path = Field(default_factory=lambda: Path.home() / ".bmo")
    projects_root: Path = Field(default_factory=lambda: Path.home() / "bmo-projects")
    templates_root: Path = Field(default_factory=lambda: Path(__file__).resolve().parents[3] / "templates")

    @property
    def database_path(self) -> Path:
        return self.data_dir / "orchestrator.db"

    @property
    def legacy_registry_path(self) -> Path:
        return self.data_dir / "projects.json"


settings = Settings()
