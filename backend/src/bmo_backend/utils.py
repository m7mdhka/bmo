from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def expand_home(value: str) -> Path:
    return Path(os.path.expanduser(value)).resolve()


def format_relative_time(iso: str) -> str:
    delta = datetime.now(timezone.utc) - datetime.fromisoformat(iso)
    minutes = round(delta.total_seconds() / 60)
    if minutes <= 1:
        return "just now"
    if minutes < 60:
        return f"{minutes}m ago"
    hours = round(minutes / 60)
    if hours < 24:
        return f"{hours}h ago"
    days = round(hours / 24)
    if days == 1:
        return "yesterday"
    return f"{days}d ago"
