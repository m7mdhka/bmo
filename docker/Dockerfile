# Multi-stage Dockerfile for the BMO monorepo.
# These stages are intentionally minimal placeholders and should be
# updated once the real backend and frontend apps are implemented.

############################
# Backend (Python) service #
############################
FROM python:3.11-slim AS backend

WORKDIR /app/backend

# Copy backend sources (currently mostly empty scaffolding).
COPY backend/ .

# Install backend dependencies here once backend is implemented, e.g.:
# COPY backend/pyproject.toml backend/poetry.lock ./
# RUN pip install -U pip && pip install -r requirements.txt

CMD ["bash", "-lc", "echo 'Backend container placeholder – add your app entrypoint here.' && sleep infinity"]


#############################
# Frontend (Next.js) app    #
#############################
FROM node:22-alpine AS frontend

WORKDIR /app/frontend

# Copy frontend sources (currently mostly empty scaffolding).
COPY frontend/ .

# Install frontend dependencies here once frontend is implemented, e.g.:
# RUN npm install && npm run dev

CMD ["sh", "-c", "echo 'Frontend container placeholder – add your app entrypoint here.' && sleep infinity"]

