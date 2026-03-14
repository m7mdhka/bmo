## Web App

Official BMO starter for a full-stack TypeScript web application.

## Stack

- `frontend/`: React + Next.js
- `backend/`: NestJS
- `docker-compose.yml`: local multi-service startup
- `infra/`: AWS infrastructure with Terraform

## Run locally

Install dependencies:

```bash
npm install --prefix frontend
npm install --prefix backend
```

Run the apps directly:

```bash
npm run dev --prefix frontend
npm run start:dev --prefix backend
```

Run with Docker Compose:

```bash
docker compose up --build
```

## Infrastructure

Use `infra/` for AWS provisioning with Terraform.
