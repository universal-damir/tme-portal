#!/bin/bash

# Deployment Tracking System for TME Portal
# Optimized for air-gapped environments with minimal transfer sizes

set -e

# Configuration
DEPLOY_DIR=".deploy-tracking"
STATE_FILE="$DEPLOY_DIR/deployment-state.json"
REMOTE_USER="tme-user"
REMOTE_HOST="192.168.97.149"
REMOTE_PATH="/home/tme-user/tme-portal"
CONTAINER_NAME="tme-portal-app-1"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Initialize deployment tracking
init_tracking() {
    mkdir -p "$DEPLOY_DIR"
    if [ ! -f "$STATE_FILE" ]; then
        echo "{
  \"version\": \"initial\",
  \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
  \"commit\": \"$(git rev-parse HEAD 2>/dev/null || echo 'unknown')\",
  \"files\": {}
}" > "$STATE_FILE"
        echo -e "${GREEN}✓ Initialized deployment tracking${NC}"
    fi
}

# Calculate checksums for local files
calculate_local_checksums() {
    echo -e "${BLUE}Calculating local file checksums...${NC}"
    
    local checksum_file="$DEPLOY_DIR/local-checksums.txt"
    > "$checksum_file"
    
    # Files to track (Next.js standalone build output)
    # Use shasum on macOS, sha256sum on Linux
    if command -v shasum >/dev/null 2>&1; then
        CHECKSUM_CMD="shasum -a 256"
    else
        CHECKSUM_CMD="sha256sum"
    fi
    
    if [ -d ".next/standalone" ]; then
        find .next/standalone -type f -exec $CHECKSUM_CMD {} \; >> "$checksum_file"
    fi
    if [ -d ".next/static" ]; then
        find .next/static -type f -exec $CHECKSUM_CMD {} \; >> "$checksum_file"
    fi
    if [ -d "public" ]; then
        find public -type f -exec $CHECKSUM_CMD {} \; >> "$checksum_file"
    fi
    
    # Clean up paths in checksum file
    sed -i.bak 's|^\([a-f0-9]*\)  |\1  |' "$checksum_file"
    rm -f "$checksum_file.bak"
    
    echo -e "${GREEN}✓ Calculated checksums for $(wc -l < "$checksum_file") files${NC}"
}

# Fetch server state
fetch_server_state() {
    echo -e "${BLUE}Fetching server deployment state...${NC}"
    
    local remote_state_file="$DEPLOY_DIR/server-state.json"
    
    # Check if state file exists on server
    ssh "$REMOTE_USER@$REMOTE_HOST" "docker exec $CONTAINER_NAME test -f /app/.deployment-state.json" 2>/dev/null || {
        echo -e "${YELLOW}No deployment state on server (first deployment)${NC}"
        echo "{\"version\": \"none\", \"files\": {}}" > "$remote_state_file"
        return
    }
    
    # Fetch the state file
    ssh "$REMOTE_USER@$REMOTE_HOST" "docker exec $CONTAINER_NAME cat /app/.deployment-state.json" > "$remote_state_file"
    
    local server_version=$(jq -r '.version' "$remote_state_file")
    echo -e "${GREEN}✓ Server running version: $server_version${NC}"
}

# Calculate server checksums
fetch_server_checksums() {
    echo -e "${BLUE}Fetching server file checksums...${NC}"
    
    local server_checksum_file="$DEPLOY_DIR/server-checksums.txt"
    
    # Get checksums from container
    ssh "$REMOTE_USER@$REMOTE_HOST" "docker exec $CONTAINER_NAME sh -c 'cd /app && find . -type f \\( -path \"./node_modules\" -prune -o -path \"./database\" -prune -o -path \"./logs\" -prune \\) -o -type f -print0 | xargs -0 sha256sum 2>/dev/null'" | \
        grep -v node_modules | \
        grep -v database | \
        grep -v logs | \
        sed 's|^\./||' > "$server_checksum_file" || true
    
    if [ -s "$server_checksum_file" ]; then
        echo -e "${GREEN}✓ Fetched checksums for $(wc -l < "$server_checksum_file") server files${NC}"
    else
        echo -e "${YELLOW}No checksums from server (fresh deployment)${NC}"
    fi
}

# Compare and identify changes
identify_changes() {
    echo -e "${BLUE}Identifying changed files...${NC}"
    
    local local_checksums="$DEPLOY_DIR/local-checksums.txt"
    local server_checksums="$DEPLOY_DIR/server-checksums.txt"
    local changes_file="$DEPLOY_DIR/changes.txt"
    
    > "$changes_file"
    
    # Find modified and new files
    while IFS=' ' read -r checksum filepath; do
        filepath=$(echo "$filepath" | xargs)  # Trim whitespace
        
        # Map local path to container path
        container_path="$filepath"
        if [[ "$filepath" == .next/standalone/* ]]; then
            container_path="${filepath#.next/standalone/}"
        elif [[ "$filepath" == .next/static/* ]]; then
            container_path="$filepath"
        elif [[ "$filepath" == public/* ]]; then
            container_path="$filepath"
        fi
        
        # Check if file exists on server with same checksum
        server_checksum=$(grep " $container_path$" "$server_checksums" 2>/dev/null | cut -d' ' -f1)
        
        if [ "$server_checksum" != "$checksum" ]; then
            echo "$filepath" >> "$changes_file"
        fi
    done < "$local_checksums"
    
    local change_count=$(wc -l < "$changes_file" | xargs)
    
    if [ "$change_count" -eq 0 ]; then
        echo -e "${GREEN}✓ No changes detected - deployment up to date!${NC}"
        return 1
    else
        echo -e "${YELLOW}Found $change_count changed files:${NC}"
        head -20 "$changes_file" | while read f; do
            echo "  - $f"
        done
        if [ "$change_count" -gt 20 ]; then
            echo "  ... and $((change_count - 20)) more"
        fi
        
        # Calculate update size
        local update_size=0
        while read filepath; do
            if [ -f "$filepath" ]; then
                size=$(stat -f%z "$filepath" 2>/dev/null || stat -c%s "$filepath" 2>/dev/null || echo 0)
                update_size=$((update_size + size))
            fi
        done < "$changes_file"
        
        echo -e "${BLUE}Estimated update size: $(numfmt --to=iec-i --suffix=B $update_size 2>/dev/null || echo "$update_size bytes")${NC}"
    fi
}

# Create update package
create_update_package() {
    local version="deploy-$(date +%Y%m%d-%H%M%S)"
    local update_file="$DEPLOY_DIR/$version.tar.gz"
    local manifest_file="$DEPLOY_DIR/$version.manifest.json"
    local changes_file="$DEPLOY_DIR/changes.txt"
    
    echo -e "${BLUE}Creating update package: $version${NC}"
    
    # Create manifest
    echo "{
  \"version\": \"$version\",
  \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
  \"commit\": \"$(git rev-parse HEAD 2>/dev/null || echo 'unknown')\",
  \"files_changed\": $(wc -l < "$changes_file" | xargs),
  \"changes\": $(jq -R -s -c 'split("\n")[:-1]' < "$changes_file")
}" > "$manifest_file"
    
    # Create tar with only changed files
    tar -czf "$update_file" -T "$changes_file" 2>/dev/null || {
        echo -e "${RED}Failed to create update package${NC}"
        return 1
    }
    
    local package_size=$(ls -lh "$update_file" | awk '{print $5}')
    echo -e "${GREEN}✓ Created update package: $update_file ($package_size)${NC}"
    
    # Also create the apply script
    create_apply_script "$version"
    
    echo -e "\n${GREEN}Ready to deploy!${NC}"
    echo -e "1. Transfer these files to server:"
    echo -e "   ${BLUE}scp $update_file $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/${NC}"
    echo -e "   ${BLUE}scp $manifest_file $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/${NC}"
    echo -e "   ${BLUE}scp $DEPLOY_DIR/apply-update.sh $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/${NC}"
    echo -e "\n2. On server, run:"
    echo -e "   ${BLUE}./apply-update.sh $version${NC}"
}

# Create apply script for server
create_apply_script() {
    local version="$1"
    cat > "$DEPLOY_DIR/apply-update.sh" << 'EOF'
#!/bin/bash

# Apply deployment update on server
set -e

VERSION="$1"
CONTAINER_NAME="tme-portal-app-1"

if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version>"
    exit 1
fi

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Applying update: $VERSION${NC}"

# Check files exist
if [ ! -f ".deploy-tracking/$VERSION.tar.gz" ] || [ ! -f ".deploy-tracking/$VERSION.manifest.json" ]; then
    echo "Update files not found. Please ensure both files are in .deploy-tracking/"
    exit 1
fi

# Create temp directory in container
docker exec $CONTAINER_NAME mkdir -p /tmp/update

# Copy update files to container
docker cp ".deploy-tracking/$VERSION.tar.gz" $CONTAINER_NAME:/tmp/update/
docker cp ".deploy-tracking/$VERSION.manifest.json" $CONTAINER_NAME:/tmp/update/

# Apply update inside container
docker exec $CONTAINER_NAME sh -c "
    cd /tmp/update
    echo 'Extracting update...'
    tar -xzf $VERSION.tar.gz
    
    # Copy files to app directory
    if [ -d '.next/standalone' ]; then
        cp -r .next/standalone/* /app/
    fi
    if [ -d '.next/static' ]; then
        cp -r .next/static /app/.next/
    fi
    if [ -d 'public' ]; then
        cp -r public/* /app/public/
    fi
    
    # Update deployment state
    cp $VERSION.manifest.json /app/.deployment-state.json
    
    # Cleanup
    rm -rf /tmp/update
    
    echo 'Update applied successfully'
"

echo -e "${GREEN}✓ Update applied${NC}"
echo -e "${YELLOW}Restarting container...${NC}"

docker restart $CONTAINER_NAME

echo -e "${GREEN}✓ Deployment complete!${NC}"
echo "Application should be available at http://192.168.97.149/ in a few seconds"
EOF
    chmod +x "$DEPLOY_DIR/apply-update.sh"
    echo -e "${GREEN}✓ Created apply script${NC}"
}

# Main command handler
case "${1:-check}" in
    init)
        init_tracking
        ;;
    check)
        init_tracking
        calculate_local_checksums
        fetch_server_state
        fetch_server_checksums
        identify_changes || exit 0
        ;;
    deploy)
        init_tracking
        
        # Build first
        echo -e "${BLUE}Building application...${NC}"
        npm run build || {
            echo -e "${RED}Build failed${NC}"
            exit 1
        }
        
        calculate_local_checksums
        fetch_server_state
        fetch_server_checksums
        if identify_changes; then
            create_update_package
        fi
        ;;
    *)
        echo "Usage: $0 {init|check|deploy}"
        echo ""
        echo "  init   - Initialize deployment tracking"
        echo "  check  - Check what files have changed"
        echo "  deploy - Build app, identify changes, and create update package"
        exit 1
        ;;
esac