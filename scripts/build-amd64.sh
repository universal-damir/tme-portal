#!/bin/bash
# Build AMD64 compatible images for production
# Use this if you need to build on ARM Mac for AMD64 server

echo "🏗️  Building AMD64 images for TME Portal"
echo "========================================"

# Ensure Docker buildx is available
if ! docker buildx version > /dev/null 2>&1; then
    echo "Setting up Docker buildx..."
    docker buildx create --use --name tme-builder
fi

# Set platform
export DOCKER_DEFAULT_PLATFORM=linux/amd64

# Build using docker-compose
echo "Building production images for AMD64..."
docker-compose -f docker-compose.secrets.yml build --no-cache

echo ""
echo "✅ AMD64 build complete!"
echo ""
echo "To deploy:"
echo "1. Commit and push changes"
echo "2. SSH to production: ssh tme-user@192.168.97.149"
echo "3. Pull and deploy with the commands in SIMPLE_DEPLOYMENT_GUIDE.md"