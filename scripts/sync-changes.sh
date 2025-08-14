#!/bin/bash

# Fast sync for code changes without rebuilding Docker images
# This syncs only changed files directly to the production server

set -e

# Configuration
PROD_SERVER="your-server-ip"
PROD_USER="root"
PROD_PATH="/root/tme-portal"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Syncing changes to production server...${NC}"

# Build the app locally first (Next.js standalone build)
echo "Building application..."
npm run build

# Sync only the built files and source changes
rsync -avz --delete \
  --exclude 'node_modules/' \
  --exclude '.git/' \
  --exclude '.env.local' \
  --exclude 'secrets/' \
  --exclude 'database/' \
  --exclude 'docker-images-export/' \
  --exclude '*.tar' \
  --exclude '*.log' \
  .next/standalone/ ${PROD_USER}@${PROD_SERVER}:${PROD_PATH}/app/
  
rsync -avz \
  .next/static/ ${PROD_USER}@${PROD_SERVER}:${PROD_PATH}/app/.next/static/
  
rsync -avz \
  public/ ${PROD_USER}@${PROD_SERVER}:${PROD_PATH}/app/public/

echo -e "${GREEN}✓ Files synced successfully${NC}"

# Restart the container to apply changes
echo -e "${YELLOW}Restarting application container...${NC}"
ssh ${PROD_USER}@${PROD_SERVER} "cd ${PROD_PATH} && docker-compose restart app"

echo -e "${GREEN}✓ Deployment complete!${NC}"