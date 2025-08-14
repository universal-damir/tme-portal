#!/bin/bash

# Save Docker images as tar files for transfer to production server

set -e

echo "==========================================
Saving Docker Images for Production
==========================================
"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create directory for saved images
EXPORT_DIR="./docker-images-export"
mkdir -p ${EXPORT_DIR}

# Image names
IMAGES=(
    "tme-portal-app:production"
    "tme-portal-postgres:production"
    "tme-portal-redis:production"
    "tme-portal-nginx:production"
)

# Save each image
for IMAGE in "${IMAGES[@]}"; do
    FILENAME=$(echo $IMAGE | sed 's/:/-/g').tar
    echo -e "${YELLOW}Saving ${IMAGE} to ${FILENAME}...${NC}"
    
    docker save -o "${EXPORT_DIR}/${FILENAME}" ${IMAGE}
    
    if [ $? -eq 0 ]; then
        SIZE=$(du -h "${EXPORT_DIR}/${FILENAME}" | cut -f1)
        echo -e "${GREEN}✓ Saved ${FILENAME} (${SIZE})${NC}"
    else
        echo -e "${RED}✗ Failed to save ${IMAGE}${NC}"
        exit 1
    fi
done

echo -e "\n${GREEN}==========================================
All images saved successfully!
==========================================${NC}"

echo -e "\nSaved images in ${EXPORT_DIR}:"
ls -lh ${EXPORT_DIR}/

echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Transfer the ${EXPORT_DIR} folder to your production server"
echo "2. Example transfer command:"
echo "   scp -r ${EXPORT_DIR} user@192.168.97.149:/home/user/"
echo ""
echo "Total size to transfer:"
du -sh ${EXPORT_DIR}/