#!/bin/bash
# Build production Docker images for offline deployment
# Supports cross-platform builds (AMD64)

set -e

echo "🏗️  TME Portal - Production Image Builder"
echo "========================================"
echo ""

# Check Docker buildx support
if ! docker buildx version > /dev/null 2>&1; then
    echo "❌ Docker buildx not found. Installing..."
    docker buildx create --use --name tme-builder
fi

# Set target platform
PLATFORM="linux/amd64"
TAG="v5.2-prod"

echo "📦 Building images for platform: $PLATFORM"
echo ""

# 1. Build application image
echo "1️⃣ Building TME Portal application image..."
docker buildx build \
    --platform $PLATFORM \
    --tag tme-portal:$TAG \
    --load \
    .

# 2. Pull required base images for the platform
echo ""
echo "2️⃣ Pulling base images for production..."
docker pull --platform $PLATFORM postgres:15-alpine
docker pull --platform $PLATFORM redis:7-alpine
docker pull --platform $PLATFORM nginx:alpine

# 3. Tag images for export
echo ""
echo "3️⃣ Tagging images for production..."
docker tag postgres:15-alpine tme-postgres:$TAG
docker tag redis:7-alpine tme-redis:$TAG
docker tag nginx:alpine tme-nginx:$TAG

# 4. Save all images to tar files
echo ""
echo "4️⃣ Saving images to tar files..."
mkdir -p ./docker-images

# Save each image
docker save -o ./docker-images/tme-portal-$TAG.tar tme-portal:$TAG
docker save -o ./docker-images/postgres-$TAG.tar tme-postgres:$TAG
docker save -o ./docker-images/redis-$TAG.tar tme-redis:$TAG
docker save -o ./docker-images/nginx-$TAG.tar tme-nginx:$TAG

# 5. Create combined archive
echo ""
echo "5️⃣ Creating combined archive..."
tar -czf tme-portal-docker-images-$TAG.tar.gz ./docker-images/

# 6. Create deployment package
echo ""
echo "6️⃣ Creating full deployment package..."
tar -czf tme-portal-deployment-$TAG.tar.gz \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.env.local' \
    --exclude='.git' \
    --exclude='docker-images' \
    --exclude='*.tar.gz' \
    docker-compose.production.yml \
    .env.production \
    scripts/ \
    database/ \
    nginx/ \
    backups/ \
    PRODUCTION_DEPLOYMENT.md

echo ""
echo "✅ Build complete!"
echo ""
echo "📦 Generated files:"
echo "  - tme-portal-docker-images-$TAG.tar.gz (Docker images)"
echo "  - tme-portal-deployment-$TAG.tar.gz (Application files)"
echo ""
echo "Total size: $(du -sh tme-portal-*.tar.gz | cut -f1 | xargs)"
echo ""
echo "📋 Next steps:"
echo "1. Copy both .tar.gz files to production server"
echo "2. On production server, run: ./scripts/deploy-offline.sh"