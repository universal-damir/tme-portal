#!/bin/bash

# TME Portal Production Docker Build Script
# Safe and comprehensive Docker image creation for production deployment
# Version: 1.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
VERSION="${1:-$(date +%Y%m%d-%H%M%S)}"
IMAGE_NAME="tme-portal"
IMAGE_TAG="production-$VERSION"
REGISTRY_URL="" # Set this if using a registry
BUILD_CONTEXT="$PROJECT_ROOT"

# Build options
PLATFORM="linux/amd64"
NO_CACHE=${NO_CACHE:-false}
PUSH_TO_REGISTRY=${PUSH_TO_REGISTRY:-false}
SAVE_TO_TAR=${SAVE_TO_TAR:-true}

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

cleanup() {
    if [[ -n "$BUILD_PID" ]] && kill -0 "$BUILD_PID" 2>/dev/null; then
        log_warning "Terminating build process..."
        kill "$BUILD_PID" 2>/dev/null || true
        wait "$BUILD_PID" 2>/dev/null || true
    fi
}

# Set up cleanup trap
trap cleanup EXIT INT TERM

# Parse command line options
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-cache)
            NO_CACHE=true
            shift
            ;;
        --push)
            PUSH_TO_REGISTRY=true
            shift
            ;;
        --no-tar)
            SAVE_TO_TAR=false
            shift
            ;;
        --registry=*)
            REGISTRY_URL="${1#*=}"
            shift
            ;;
        --help)
            echo "Usage: $0 [VERSION] [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --no-cache         Build without using cache"
            echo "  --push             Push to registry after build"
            echo "  --no-tar           Skip saving image to tar file"
            echo "  --registry=URL     Registry URL for pushing"
            echo "  --help             Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                                    # Build with timestamp version"
            echo "  $0 v1.2.3                           # Build with specific version"
            echo "  $0 --no-cache --push                # Clean build and push to registry"
            exit 0
            ;;
        *)
            VERSION="$1"
            shift
            ;;
    esac
done

# Update image tag with version
IMAGE_TAG="production-$VERSION"
FULL_IMAGE_NAME="$IMAGE_NAME:$IMAGE_TAG"

# Add registry prefix if specified
if [[ -n "$REGISTRY_URL" ]]; then
    FULL_IMAGE_NAME="$REGISTRY_URL/$FULL_IMAGE_NAME"
fi

main() {
    echo -e "${BLUE}==========================================
TME Portal Production Docker Build
==========================================${NC}"
    
    echo "Image: $FULL_IMAGE_NAME"
    echo "Platform: $PLATFORM"
    echo "No Cache: $NO_CACHE"
    echo "Save to TAR: $SAVE_TO_TAR"
    echo "Push to Registry: $PUSH_TO_REGISTRY"
    echo ""
    
    # Step 1: Pre-build validation
    echo -e "${BLUE}1. PRE-BUILD VALIDATION${NC}"
    echo "========================"
    
    log_info "Running pre-deployment checks..."
    if [[ -x "$SCRIPT_DIR/pre-deployment-check.sh" ]]; then
        if "$SCRIPT_DIR/pre-deployment-check.sh"; then
            log_success "Pre-deployment checks passed"
        else
            log_error "Pre-deployment checks failed"
            exit 1
        fi
    else
        log_warning "Pre-deployment check script not found, skipping validation"
    fi
    
    # Step 2: Environment setup
    echo -e "\n${BLUE}2. ENVIRONMENT SETUP${NC}"
    echo "====================="
    
    # Change to project root
    cd "$PROJECT_ROOT"
    
    # Check Docker daemon
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    log_success "Docker daemon is running"
    
    # Check available disk space
    AVAILABLE_SPACE=$(df "$PROJECT_ROOT" | awk 'NR==2 {print $4}')
    REQUIRED_SPACE=5000000  # 5GB in KB
    if [[ $AVAILABLE_SPACE -lt $REQUIRED_SPACE ]]; then
        log_warning "Low disk space: $(($AVAILABLE_SPACE / 1000000))GB available, 5GB recommended"
    else
        log_success "Sufficient disk space available: $(($AVAILABLE_SPACE / 1000000))GB"
    fi
    
    # Step 3: Clean build environment
    echo -e "\n${BLUE}3. BUILD ENVIRONMENT CLEANUP${NC}"
    echo "==============================="
    
    # Clean previous builds
    log_info "Cleaning previous builds..."
    rm -rf .next/
    rm -rf dist/
    rm -rf out/
    
    # Clean node_modules and reinstall if needed
    if [[ "$NO_CACHE" == "true" ]] || [[ ! -d "node_modules" ]]; then
        log_info "Installing fresh dependencies..."
        rm -rf node_modules/
        npm ci --production=false
        log_success "Dependencies installed"
    else
        log_info "Using existing node_modules"
    fi
    
    # Step 4: Code quality checks
    echo -e "\n${BLUE}4. CODE QUALITY CHECKS${NC}"
    echo "========================"
    
    # TypeScript compilation
    log_info "Running TypeScript compilation..."
    if npm run build; then
        log_success "Build completed successfully"
    else
        log_error "Build failed"
        exit 1
    fi
    
    # Linting
    log_info "Running ESLint..."
    if npm run lint; then
        log_success "Linting passed"
    else
        log_warning "Linting issues found, continuing with build"
    fi
    
    # Step 5: Docker image build
    echo -e "\n${BLUE}5. DOCKER IMAGE BUILD${NC}"
    echo "======================"
    
    # Prepare build arguments
    BUILD_ARGS=""
    if [[ -f ".env.production" ]]; then
        # Extract build-time variables if needed
        BUILD_ARGS="$BUILD_ARGS --build-arg NODE_ENV=production"
    fi
    
    # Build command options
    BUILD_OPTS=(
        "--platform=$PLATFORM"
        "--tag=$FULL_IMAGE_NAME"
        "--file=Dockerfile"
        "$BUILD_ARGS"
    )
    
    if [[ "$NO_CACHE" == "true" ]]; then
        BUILD_OPTS+=("--no-cache")
    fi
    
    # Add latest tag
    BUILD_OPTS+=("--tag=$IMAGE_NAME:latest")
    if [[ -n "$REGISTRY_URL" ]]; then
        BUILD_OPTS+=("--tag=$REGISTRY_URL/$IMAGE_NAME:latest")
    fi
    
    log_info "Building Docker image..."
    log_info "Command: docker build ${BUILD_OPTS[*]} $BUILD_CONTEXT"
    
    # Start build process
    if docker build "${BUILD_OPTS[@]}" "$BUILD_CONTEXT"; then
        log_success "Docker image built successfully: $FULL_IMAGE_NAME"
    else
        log_error "Docker build failed"
        exit 1
    fi
    
    # Step 6: Image verification
    echo -e "\n${BLUE}6. IMAGE VERIFICATION${NC}"
    echo "======================"
    
    # Check if image exists
    if docker image inspect "$FULL_IMAGE_NAME" > /dev/null 2>&1; then
        log_success "Image verified: $FULL_IMAGE_NAME"
        
        # Get image size
        IMAGE_SIZE=$(docker image inspect "$FULL_IMAGE_NAME" --format='{{.Size}}' | awk '{printf "%.1fMB", $1/1024/1024}')
        log_info "Image size: $IMAGE_SIZE"
        
        # Get image layers
        LAYER_COUNT=$(docker image inspect "$FULL_IMAGE_NAME" --format='{{len .RootFS.Layers}}')
        log_info "Image layers: $LAYER_COUNT"
        
        # Show image history
        log_info "Image layers breakdown:"
        docker history "$FULL_IMAGE_NAME" --format "table {{.CreatedBy}}\t{{.Size}}" | head -10
        
    else
        log_error "Image verification failed"
        exit 1
    fi
    
    # Step 7: Security scan (optional)
    echo -e "\n${BLUE}7. SECURITY SCAN${NC}"
    echo "================="
    
    # Try to run security scan if tools are available
    if command -v docker &> /dev/null && docker --help | grep -q "scout\|scan"; then
        log_info "Running security scan..."
        # Add security scan commands here if available
        log_warning "Security scanning tools not fully configured, skipping"
    else
        log_warning "Security scanning tools not available, skipping"
    fi
    
    # Step 8: Save image to tar
    if [[ "$SAVE_TO_TAR" == "true" ]]; then
        echo -e "\n${BLUE}8. EXPORT IMAGE${NC}"
        echo "================"
        
        TAR_FILE="$PROJECT_ROOT/${IMAGE_NAME}-${VERSION}.tar"
        log_info "Exporting image to: $TAR_FILE"
        
        if docker save "$FULL_IMAGE_NAME" -o "$TAR_FILE"; then
            log_success "Image exported successfully"
            
            # Compress the tar file
            log_info "Compressing image..."
            if gzip "$TAR_FILE"; then
                TAR_FILE="${TAR_FILE}.gz"
                TAR_SIZE=$(ls -lh "$TAR_FILE" | awk '{print $5}')
                log_success "Image compressed: $TAR_FILE ($TAR_SIZE)"
            else
                log_warning "Compression failed, keeping uncompressed tar"
            fi
            
        else
            log_error "Failed to export image"
            exit 1
        fi
    fi
    
    # Step 9: Push to registry
    if [[ "$PUSH_TO_REGISTRY" == "true" ]] && [[ -n "$REGISTRY_URL" ]]; then
        echo -e "\n${BLUE}9. PUSH TO REGISTRY${NC}"
        echo "==================="
        
        log_info "Pushing to registry: $REGISTRY_URL"
        
        if docker push "$FULL_IMAGE_NAME"; then
            log_success "Image pushed to registry: $FULL_IMAGE_NAME"
            
            # Push latest tag as well
            if docker push "$REGISTRY_URL/$IMAGE_NAME:latest"; then
                log_success "Latest tag pushed to registry"
            else
                log_warning "Failed to push latest tag"
            fi
        else
            log_error "Failed to push image to registry"
            exit 1
        fi
    fi
    
    # Step 10: Cleanup
    echo -e "\n${BLUE}10. CLEANUP${NC}"
    echo "============"
    
    # Clean up build artifacts
    if [[ "$NO_CACHE" == "true" ]]; then
        log_info "Cleaning up build artifacts..."
        docker builder prune -f > /dev/null 2>&1 || true
        log_success "Build cache cleaned"
    fi
    
    # Summary
    echo -e "\n${BLUE}BUILD SUMMARY${NC}"
    echo "============="
    echo "✓ Image Name: $FULL_IMAGE_NAME"
    echo "✓ Version: $VERSION"
    echo "✓ Platform: $PLATFORM"
    
    if [[ "$SAVE_TO_TAR" == "true" ]] && [[ -n "$TAR_FILE" ]]; then
        echo "✓ Exported: $TAR_FILE"
    fi
    
    if [[ "$PUSH_TO_REGISTRY" == "true" ]] && [[ -n "$REGISTRY_URL" ]]; then
        echo "✓ Pushed to: $REGISTRY_URL"
    fi
    
    echo -e "\n${GREEN}🚀 PRODUCTION BUILD COMPLETED SUCCESSFULLY${NC}"
    
    # Provide next steps
    echo -e "\n${BLUE}NEXT STEPS:${NC}"
    echo "==========="
    
    if [[ "$SAVE_TO_TAR" == "true" ]] && [[ -n "$TAR_FILE" ]]; then
        echo "1. Transfer image to production server:"
        echo "   scp '$TAR_FILE' user@production-server:~/"
        echo ""
        echo "2. Load image on production server:"
        echo "   gunzip '$TAR_FILE' && docker load -i '${TAR_FILE%.gz}'"
        echo ""
    fi
    
    echo "3. Run deployment script:"
    echo "   ./scripts/deploy-to-production.sh $VERSION"
    echo ""
    echo "4. Verify deployment:"
    echo "   ./scripts/health-check.sh"
}

# Run main function
main "$@"