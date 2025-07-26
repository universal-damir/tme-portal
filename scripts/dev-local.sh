#!/bin/bash
# Local Development Setup Script
# This ensures Redis is running locally and starts the development server

echo "🚀 Starting Local Development Environment..."

# Check if Redis is running locally
if ! redis-cli ping > /dev/null 2>&1; then
    echo "📦 Starting Redis locally..."
    brew services start redis
    sleep 2
fi

# Check if Docker PostgreSQL is running (for database access)
if ! docker-compose ps | grep -q "postgres.*healthy"; then
    echo "📦 Starting Docker PostgreSQL..."
    docker-compose up -d postgres redis
    
    # Wait for PostgreSQL to be ready
    echo "⏳ Waiting for PostgreSQL to be ready..."
    timeout=30
    while [ $timeout -gt 0 ]; do
        if docker-compose ps | grep -q "postgres.*healthy"; then
            echo "✅ PostgreSQL is ready!"
            break
        fi
        sleep 1
        timeout=$((timeout - 1))
    done
    
    if [ $timeout -eq 0 ]; then
        echo "❌ PostgreSQL failed to start"
        exit 1
    fi
fi

echo "✅ Local development environment ready!"
echo "🔧 Environment: LOCAL"  
echo "🗄️  Database: localhost:5434"
echo "🗃️  Redis: localhost:6379"
echo ""

# Start development server
npm run dev