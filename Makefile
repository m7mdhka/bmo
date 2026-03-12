.PHONY: help install dev build lint format test clean docker-up docker-down

help:
	@echo "BMO Monorepo Commands:"
	@echo ""
	@echo "Setup:"
	@echo "  make install       Install all dependencies (frontend + backend)"
	@echo ""
	@echo "Development:"
	@echo "  make dev           Start dev servers (frontend + backend)"
	@echo "  make build         Build all workspaces"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint          Lint all workspaces"
	@echo "  make lint-fix      Fix linting issues"
	@echo "  make format        Format all code"
	@echo "  make format-check  Check formatting"
	@echo "  make typecheck     Run TypeScript checks"
	@echo ""
	@echo "Testing:"
	@echo "  make test          Run all tests"
	@echo "  make test-watch    Run tests in watch mode"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up     Start services with Docker Compose"
	@echo "  make docker-down   Stop Docker services"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean         Remove build artifacts and node_modules"

install:
	npm install
	cd frontend && npm install
	cd backend && pip install -e ".[dev]"

dev:
	npm run dev --workspaces

build:
	npm run build --workspaces

lint:
	npm run lint --workspaces
	cd backend && make lint

lint-fix:
	npm run lint:fix --workspaces
	cd backend && make format

format:
	npm run format --workspaces
	cd backend && make format

format-check:
	npm run format:check --workspaces

typecheck:
	npm run typecheck --workspaces

test:
	npm run test --workspaces
	cd backend && make test

test-watch:
	npm run test:watch --workspaces

docker-up:
	docker compose -f docker/docker-compose.yml up --build

docker-down:
	docker compose -f docker/docker-compose.yml down

clean:
	rm -rf frontend/node_modules frontend/.next frontend/dist
	rm -rf backend/.venv backend/__pycache__ backend/.pytest_cache backend/.coverage
	rm -rf node_modules
