# CouplesWorkout Backend Makefile

.PHONY: help install dev test lint format migrate seed clean docker-up docker-down

help:  ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install:  ## Install dependencies
	pip install -r requirements.txt

dev:  ## Run development server
	uvicorn server:app --host 0.0.0.0 --port 8001 --reload

test:  ## Run tests
	pytest -v

test-coverage:  ## Run tests with coverage
	pytest --cov=app --cov-report=html --cov-report=term

lint:  ## Run linting
	flake8 app/ --max-line-length=100
	mypy app/

format:  ## Format code
	black app/
	isort app/

migrate-init:  ## Initialize Alembic migrations
	alembic init alembic

migrate:  ## Run database migrations
	alembic upgrade head

migrate-create:  ## Create new migration (use: make migrate-create msg="migration message")
	alembic revision --autogenerate -m "$(msg)"

seed:  ## Seed database with sample data
	python -c "from scripts.seed import seed_database; seed_database()"

docker-up:  ## Start services with Docker Compose
	docker-compose up --build

docker-down:  ## Stop Docker Compose services
	docker-compose down

clean:  ## Clean up temporary files
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf .pytest_cache
	rm -rf htmlcov