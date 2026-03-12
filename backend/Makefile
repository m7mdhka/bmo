.PHONY: help install lint format test coverage

PYTHON ?= python3

help:
	@echo "Targets:"
	@echo "  install   Install backend (dev extras)"
	@echo "  lint      Run Ruff lint + format check"
	@echo "  format    Auto-format with Ruff"
	@echo "  test      Run pytest"
	@echo "  coverage  Run pytest with coverage (HTML + terminal)"

install:
	$(PYTHON) -m pip install -U pip
	$(PYTHON) -m pip install -e ".[dev]"

lint:
	ruff check .
	ruff format --check .

format:
	ruff check --fix .
	ruff format .

test:
	pytest

coverage:
	pytest --cov=src --cov-report=term-missing --cov-report=html

