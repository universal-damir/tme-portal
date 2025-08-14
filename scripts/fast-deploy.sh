#!/bin/bash

# Fast deployment script for TME Portal
# Simplified version focused on speed over tracking

set -e

# Configuration
REMOTE_USER="tme-user"
REMOTE_HOST="192.168.97.149"
CONTAINER_NAME="tme-portal-app-1"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}==========================================
Fast Deployment for TME Portal
==========================================${NC}"

# Step 1: Build if not already built
if [ ! -d ".next/standalone" ]; then
    echo -e "${YELLOW}Building application...${NC}"
    npm run build
else
    echo -e "${GREEN}✓ Using existing build${NC}"
fi

# Step 2: Create minimal update package
VERSION="update-$(date +%Y%m%d-%H%M%S)"
UPDATE_FILE="${VERSION}.tar.gz"

echo -e "${BLUE}Creating update package...${NC}"

# Package only the essential files
tar -czf "$UPDATE_FILE" \
    .next/standalone/ \
    .next/static/ \
    public/ \
    2>/dev/null || true

SIZE=$(ls -lh "$UPDATE_FILE" | awk '{print $5}')
echo -e "${GREEN}✓ Created $UPDATE_FILE ($SIZE)${NC}"

# Step 3: Show transfer instructions
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Transfer the update file:"
echo -e "   ${BLUE}scp $UPDATE_FILE $REMOTE_USER@$REMOTE_HOST:~/${NC}"
echo -e ""
echo -e "2. On the server, extract and apply:"
echo -e "   ${BLUE}ssh $REMOTE_USER@$REMOTE_HOST${NC}"
echo -e "   ${BLUE}tar -xzf $UPDATE_FILE${NC}"
echo -e "   ${BLUE}docker cp .next/standalone/. $CONTAINER_NAME:/app/${NC}"
echo -e "   ${BLUE}docker cp .next/static $CONTAINER_NAME:/app/.next/${NC}"
echo -e "   ${BLUE}docker cp public/. $CONTAINER_NAME:/app/public/${NC}"
echo -e "   ${BLUE}docker restart $CONTAINER_NAME${NC}"
echo -e ""
echo -e "${GREEN}The update file is ready for transfer!${NC}"