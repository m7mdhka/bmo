from __future__ import annotations

import os
import pty
import select
import subprocess
import threading
import uuid
from dataclasses import dataclass, field
from pathlib import Path

from .utils import now_iso


@dataclass
class TerminalChunk:
    seq: int
    data: str


@dataclass
class TerminalSession:
    session_id: str
    project_id: str
    service: str
    cwd: Path
    process: subprocess.Popen[str]
    master_fd: int | None = None
    buffer: list[TerminalChunk] = field(default_factory=list)
    seq: int = 0
    closed: bool = False
    exit_code: int | None = None

    def append(self, data: str) -> None:
        if not data:
            return
        self.seq += 1
        self.buffer.append(TerminalChunk(seq=self.seq, data=data))
        if len(self.buffer) > 2000:
            self.buffer = self.buffer[-2000:]


class TerminalManager:
    def __init__(self) -> None:
        self._sessions: dict[str, TerminalSession] = {}
        self._lock = threading.Lock()

    def create(self, *, project_id: str, service: str, cwd: Path) -> TerminalSession:
        session_id = str(uuid.uuid4())
        shell_command = "if command -v bash >/dev/null 2>&1; then exec bash -i; else exec sh -i; fi"
        args = ["docker", "compose", "exec", service, "sh", "-lc", shell_command]

        try:
            master_fd, slave_fd = pty.openpty()
            process = subprocess.Popen(
                args,
                cwd=cwd,
                env=os.environ.copy(),
                stdin=slave_fd,
                stdout=slave_fd,
                stderr=slave_fd,
                text=True,
                close_fds=True,
            )
            os.close(slave_fd)
        except Exception:
            master_fd = None
            process = subprocess.Popen(
                ["docker", "compose", "exec", "-T", service, "sh", "-lc", shell_command],
                cwd=cwd,
                env=os.environ.copy(),
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
            )

        session = TerminalSession(
            session_id=session_id,
            project_id=project_id,
            service=service,
            cwd=cwd,
            process=process,
            master_fd=master_fd,
        )
        with self._lock:
            self._sessions[session_id] = session
        self._start_reader(session)
        return session

    def _start_reader(self, session: TerminalSession) -> None:
        def reader() -> None:
            if session.master_fd is not None:
                while not session.closed:
                    ready, _, _ = select.select([session.master_fd], [], [], 0.2)
                    if not ready:
                        if session.process.poll() is not None:
                            break
                        continue
                    data = os.read(session.master_fd, 4096).decode("utf-8", errors="replace")
                    session.append(data)
            else:
                assert session.process.stdout is not None
                while True:
                    chunk = session.process.stdout.read(4096)
                    if not chunk:
                        break
                    session.append(chunk)
            session.closed = True
            session.exit_code = session.process.poll()
            session.append(f"\r\n[process exited{'' if session.exit_code is None else f' with code {session.exit_code}'}]")

        threading.Thread(target=reader, daemon=True).start()

    def get(self, session_id: str) -> TerminalSession | None:
        with self._lock:
            return self._sessions.get(session_id)

    def read(self, session_id: str, cursor: int) -> tuple[list[TerminalChunk], int, bool, int | None]:
        session = self.get(session_id)
        if session is None:
            raise KeyError("Terminal session not found.")
        chunks = [chunk for chunk in session.buffer if chunk.seq > cursor]
        next_cursor = chunks[-1].seq if chunks else cursor
        return chunks, next_cursor, session.closed, session.exit_code

    def write(self, session_id: str, data: str) -> None:
        session = self.get(session_id)
        if session is None:
            raise KeyError("Terminal session not found.")
        if session.closed:
            raise RuntimeError("Terminal session is closed.")
        if session.master_fd is not None:
            os.write(session.master_fd, data.encode("utf-8"))
            return
        if session.process.stdin is None:
            raise RuntimeError("Terminal session input is unavailable.")
        session.process.stdin.write(data)
        session.process.stdin.flush()

    def close(self, session_id: str) -> None:
        session = self.get(session_id)
        if session is None:
            return
        session.closed = True
        session.process.kill()
        if session.master_fd is not None:
            try:
                os.close(session.master_fd)
            except OSError:
                pass
        with self._lock:
            self._sessions.pop(session_id, None)


terminal_manager = TerminalManager()
