FROM python:3.14-slim

WORKDIR /app

# Install runtime dependencies (kept minimal for now).
COPY backend/pyproject.toml backend/README.md /app/backend/
RUN python -m pip install -U pip && python -m pip install -e /app/backend

# Copy backend source tree (scaffold will be added later).
COPY backend/ /app/backend/

EXPOSE 8000

# Placeholder until the FastAPI app exists.
CMD ["bash", "-lc", "echo 'Backend container placeholder – implement backend/src and set an entrypoint.' && sleep infinity"]

