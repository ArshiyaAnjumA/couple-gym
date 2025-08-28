FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash api
RUN chown -R api:api /app
USER api

# Expose port
EXPOSE 8001

# Command will be overridden in docker-compose
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]