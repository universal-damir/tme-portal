#!/bin/bash

# Build production Docker images for amd64 architecture
# This script builds all required images for production deployment

set -e

echo "==========================================
TME Portal Production Build for AMD64
==========================================
"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Set platform
export DOCKER_DEFAULT_PLATFORM=linux/amd64

# Image names
APP_IMAGE="tme-portal-app:production"
POSTGRES_IMAGE="postgres:15-alpine"
REDIS_IMAGE="redis:7-alpine"
NGINX_IMAGE="nginx:alpine"

echo -e "${YELLOW}Building TME Portal application image for amd64...${NC}"
docker build --platform linux/amd64 -t ${APP_IMAGE} -f Dockerfile .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ App image built successfully${NC}"
else
    echo -e "${RED}✗ Failed to build app image${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Pulling required base images for amd64...${NC}"

# Pull PostgreSQL
echo "Pulling PostgreSQL..."
docker pull --platform linux/amd64 ${POSTGRES_IMAGE}
docker tag ${POSTGRES_IMAGE} tme-portal-postgres:production

# Pull Redis
echo "Pulling Redis..."
docker pull --platform linux/amd64 ${REDIS_IMAGE}
docker tag ${REDIS_IMAGE} tme-portal-redis:production

# Pull Nginx
echo "Pulling Nginx..."
docker pull --platform linux/amd64 ${NGINX_IMAGE}
docker tag ${NGINX_IMAGE} tme-portal-nginx:production

echo -e "\n${GREEN}==========================================
All images built/pulled successfully!
==========================================${NC}"

echo -e "\nImages ready for export:"
echo "- tme-portal-app:production"
echo "- tme-portal-postgres:production"
echo "- tme-portal-redis:production"
echo "- tme-portal-nginx:production"

echo -e "\n${YELLOW}Next step: Run ./scripts/save-images.sh to save images as tar files${NC}"