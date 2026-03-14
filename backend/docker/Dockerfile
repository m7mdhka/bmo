FROM python:3.14-slim

WORKDIR /app

COPY backend/pyproject.toml backend/README.md /app/backend/
RUN python -m pip install -U pip && python -m pip install -e /app/backend

COPY backend/ /app/backend/
COPY templates/ /app/templates/

EXPOSE 8000

ENV BMO_TEMPLATES_ROOT=/app/templates

CMD ["bmo-backend"]
