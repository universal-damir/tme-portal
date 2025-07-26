#!/bin/bash
# Docker Development Setup Script
# This starts the full Docker environment

echo "🐳 Starting Docker Development Environment..."

# Stop local services that might conflict
echo "🛑 Stopping local services..."
brew services stop postgresql@14 2>/dev/null || true
brew services stop redis 2>/dev/null || true

# Set Docker environment flag
export DOCKER_ENV=true

# Start Docker containers
echo "📦 Starting Docker containers..."
docker-compose up -d

# Wait for all services to be healthy
echo "⏳ Waiting for services to be ready..."
timeout=60
while [ $timeout -gt 0 ]; do
    if docker-compose ps | grep -q "app.*healthy" && \
       docker-compose ps | grep -q "postgres.*healthy" && \
       docker-compose ps | grep -q "redis.*healthy"; then
        echo "✅ All services are ready!"
        break
    fi
    sleep 2
    timeout=$((timeout - 2))
done

if [ $timeout -eq 0 ]; then
    echo "❌ Services failed to start properly"
    docker-compose logs
    exit 1
fi

echo "✅ Docker development environment ready!"
echo "🔧 Environment: DOCKER"
echo "🌐 Application: http://localhost:3000"
echo "🗄️  Database: postgres:5432 (internal)"
echo "🗃️  Redis: redis:6379 (internal)"
echo ""
echo "📊 Container status:"
docker-compose ps