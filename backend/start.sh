#!/bin/bash

echo "Starting application setup..."

# Fetch Prisma binaries at runtime
echo "Fetching Prisma binaries..."
prisma generate
prisma py fetch --force

# Start the application
echo "Starting FastAPI application..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}