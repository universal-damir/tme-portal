#!/bin/bash

# TME Portal Production Deployment Script
# Safe, automated deployment with rollback capability
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

# Production server configuration
PROD_SERVER="${PROD_SERVER:-192.168.97.149}"
PROD_USER="${PROD_USER:-tme-user}"
PROD_PATH="${PROD_PATH:-/home/tme-user}"
DOCKER_COMPOSE_PROJECT="${DOCKER_COMPOSE_PROJECT:-tme-portal}"

# Deployment configuration
IMAGE_NAME="tme-portal"
CONTAINER_NAME="${DOCKER_COMPOSE_PROJECT}-app-1"
DB_CONTAINER_NAME="${DOCKER_COMPOSE_PROJECT}-postgres-1"
REDIS_CONTAINER_NAME="${DOCKER_COMPOSE_PROJECT}-redis-1"

# Options
DRY_RUN=${DRY_RUN:-false}
SKIP_BACKUP=${SKIP_BACKUP:-false}
SKIP_VALIDATION=${SKIP_VALIDATION:-false}
FORCE_DEPLOY=${FORCE_DEPLOY:-false}
ROLLBACK_ON_FAILURE=${ROLLBACK_ON_FAILURE:-true}

# Backup information
BACKUP_DIR="/tmp/tme-deployment-backup-$$"
DEPLOYMENT_LOG="/tmp/tme-deployment-$VERSION.log"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

# Function to execute remote command
remote_exec() {
    local command="$1"
    local description="${2:-Executing remote command}"
    
    log_info "$description"
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would execute: $command"
        return 0
    fi
    
    if ssh -o ConnectTimeout=10 "$PROD_USER@$PROD_SERVER" "$command"; then
        return 0
    else
        log_error "Failed to execute remote command: $command"
        return 1
    fi
}

# Function to transfer file to production server
transfer_file() {
    local local_file="$1"
    local remote_file="$2"
    local description="${3:-Transferring file}"
    
    log_info "$description"
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would transfer: $local_file -> $remote_file"
        return 0
    fi
    
    if scp "$local_file" "$PROD_USER@$PROD_SERVER:$remote_file"; then
        log_success "File transferred successfully"
        return 0
    else
        log_error "Failed to transfer file: $local_file"
        return 1
    fi
}

# Function to check if service is healthy
check_service_health() {
    local service_url="$1"
    local service_name="$2"
    local max_attempts="${3:-30}"
    local wait_time="${4:-5}"
    
    log_info "Checking $service_name health..."
    
    for i in $(seq 1 $max_attempts); do
        if remote_exec "curl -f $service_url > /dev/null 2>&1" "Health check attempt $i"; then
            log_success "$service_name is healthy"
            return 0
        fi
        
        if [[ $i -lt $max_attempts ]]; then
            log_info "Health check failed, waiting ${wait_time}s... (attempt $i/$max_attempts)"
            sleep $wait_time
        fi
    done
    
    log_error "$service_name health check failed after $max_attempts attempts"
    return 1
}

# Function to create pre-deployment backup
create_backup() {
    log_info "Creating pre-deployment backup..."
    
    if [[ "$SKIP_BACKUP" == "true" ]]; then
        log_warning "Skipping backup as requested"
        return 0
    fi
    
    # Create backup directory
    remote_exec "mkdir -p $PROD_PATH/backups" "Creating backup directory"
    
    # Run backup script on production server
    if remote_exec "cd $PROD_PATH && ./scripts/backup.sh" "Running database backup"; then
        log_success "Pre-deployment backup created successfully"
        
        # Get backup filename for rollback reference
        BACKUP_FILE=$(remote_exec "ls -t $PROD_PATH/backups/tme_portal_complete_*.tar.gz | head -1" "Getting latest backup filename" | tail -1)
        log_info "Backup file: $BACKUP_FILE"
        return 0
    else
        log_error "Failed to create pre-deployment backup"
        return 1
    fi
}

# Function to stop services gracefully
stop_services() {
    log_info "Stopping production services..."
    
    # Stop application container
    remote_exec "docker stop $CONTAINER_NAME" "Stopping application container"
    
    # Wait a moment for graceful shutdown
    sleep 5
    
    log_success "Services stopped successfully"
}

# Function to start services
start_services() {
    log_info "Starting production services..."
    
    # Start all services
    remote_exec "cd $PROD_PATH && docker-compose up -d" "Starting Docker Compose services"
    
    # Wait for services to initialize
    log_info "Waiting for services to initialize..."
    sleep 15
    
    log_success "Services started successfully"
}

# Function to deploy new image
deploy_image() {
    local image_file="$1"
    
    log_info "Deploying new Docker image..."
    
    # Transfer image to production server
    if [[ -f "$image_file" ]]; then
        transfer_file "$image_file" "$PROD_PATH/$(basename "$image_file")" "Transferring Docker image"
        
        # Load image on production server
        remote_exec "cd $PROD_PATH && gunzip -c $(basename "$image_file") | docker load" "Loading Docker image"
        
        # Tag image appropriately
        remote_exec "docker tag $IMAGE_NAME:production-$VERSION $IMAGE_NAME:latest" "Tagging Docker image"
        
    else
        log_error "Docker image file not found: $image_file"
        return 1
    fi
    
    log_success "New image deployed successfully"
}

# Function to run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # Check if there are pending migrations
    MIGRATION_COUNT=$(find "$PROJECT_ROOT/database/migrations" -name "*.sql" 2>/dev/null | wc -l)
    
    if [[ $MIGRATION_COUNT -gt 0 ]]; then
        log_info "Found $MIGRATION_COUNT migration files"
        
        # Transfer migration files
        remote_exec "mkdir -p $PROD_PATH/database/migrations" "Creating migrations directory"
        
        # Transfer all migration files
        for migration in "$PROJECT_ROOT/database/migrations"/*.sql; do
            if [[ -f "$migration" ]]; then
                transfer_file "$migration" "$PROD_PATH/database/migrations/$(basename "$migration")" "Transferring migration: $(basename "$migration")"
            fi
        done
        
        # Run migrations in order
        remote_exec "cd $PROD_PATH && find database/migrations -name '*.sql' | sort | while read migration; do echo \"Running migration: \$migration\"; psql \$DATABASE_URL -f \"\$migration\"; done" "Executing database migrations"
        
        log_success "Database migrations completed"
    else
        log_info "No pending migrations found"
    fi
}

# Function to validate deployment
validate_deployment() {
    log_info "Validating deployment..."
    
    # Check if containers are running
    remote_exec "docker ps | grep -q $CONTAINER_NAME" "Checking application container status"
    remote_exec "docker ps | grep -q $DB_CONTAINER_NAME" "Checking database container status"
    remote_exec "docker ps | grep -q $REDIS_CONTAINER_NAME" "Checking Redis container status"
    
    # Check application health endpoint (production uses port 80)
    check_service_health "http://localhost/api/health" "Application API" 30 5
    
    # Check database connectivity
    remote_exec "docker exec $DB_CONTAINER_NAME pg_isready -U tme_user -d tme_portal" "Checking database connectivity"
    
    # Check Redis connectivity
    remote_exec "docker exec $REDIS_CONTAINER_NAME redis-cli ping" "Checking Redis connectivity"
    
    log_success "Deployment validation passed"
}

# Function to rollback deployment
rollback_deployment() {
    log_error "Deployment failed, initiating rollback..."
    
    if [[ "$ROLLBACK_ON_FAILURE" != "true" ]]; then
        log_warning "Automatic rollback disabled, manual intervention required"
        return 1
    fi
    
    if [[ -n "$BACKUP_FILE" ]]; then
        log_info "Rolling back to previous backup: $BACKUP_FILE"
        
        # Stop current services
        remote_exec "cd $PROD_PATH && docker-compose down" "Stopping services for rollback"
        
        # Restore from backup
        remote_exec "cd $PROD_PATH && ./scripts/backup-and-rollback.sh restore $BACKUP_FILE" "Restoring from backup"
        
        # Start services
        start_services
        
        # Validate rollback
        if validate_deployment; then
            log_success "Rollback completed successfully"
            return 0
        else
            log_error "Rollback validation failed - manual intervention required"
            return 1
        fi
    else
        log_error "No backup file available for rollback"
        return 1
    fi
}

# Function to update configuration
update_configuration() {
    log_info "Updating production configuration..."
    
    # Transfer environment file
    if [[ -f "$PROJECT_ROOT/.env.production" ]]; then
        transfer_file "$PROJECT_ROOT/.env.production" "$PROD_PATH/.env.production" "Transferring production environment file"
    fi
    
    # Transfer docker-compose file if it has changed
    if [[ -f "$PROJECT_ROOT/docker-compose.yml" ]]; then
        transfer_file "$PROJECT_ROOT/docker-compose.yml" "$PROD_PATH/docker-compose.yml" "Transferring Docker Compose file"
    fi
    
    # Transfer any updated scripts
    for script in "$PROJECT_ROOT/scripts"/*.sh; do
        if [[ -f "$script" ]]; then
            transfer_file "$script" "$PROD_PATH/scripts/$(basename "$script")" "Transferring script: $(basename "$script")"
            remote_exec "chmod +x $PROD_PATH/scripts/$(basename "$script")" "Making script executable"
        fi
    done
    
    log_success "Configuration updated successfully"
}

# Main deployment function
main() {
    echo -e "${BLUE}==========================================
TME Portal Production Deployment
Version: $VERSION
==========================================${NC}"
    
    # Initialize deployment log
    echo "TME Portal Deployment Log - $(date)" > "$DEPLOYMENT_LOG"
    echo "Version: $VERSION" >> "$DEPLOYMENT_LOG"
    echo "Target: $PROD_USER@$PROD_SERVER" >> "$DEPLOYMENT_LOG"
    echo "==========================================" >> "$DEPLOYMENT_LOG"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "DRY RUN MODE - No actual changes will be made"
    fi
    
    # Step 1: Pre-deployment validation
    echo -e "\n${BLUE}1. PRE-DEPLOYMENT VALIDATION${NC}"
    echo "==============================="
    
    if [[ "$SKIP_VALIDATION" != "true" ]]; then
        # Run pre-deployment checks locally
        if [[ -x "$SCRIPT_DIR/pre-deployment-check.sh" ]]; then
            if "$SCRIPT_DIR/pre-deployment-check.sh"; then
                log_success "Local pre-deployment validation passed"
            else
                log_error "Local pre-deployment validation failed"
                exit 1
            fi
        fi
        
        # Run environment validation
        if [[ -x "$SCRIPT_DIR/validate-environments.sh" ]]; then
            if "$SCRIPT_DIR/validate-environments.sh"; then
                log_success "Environment validation passed"
            else
                if [[ "$FORCE_DEPLOY" != "true" ]]; then
                    log_error "Environment validation failed"
                    exit 1
                else
                    log_warning "Environment validation failed, but force deploy enabled"
                fi
            fi
        fi
    else
        log_warning "Skipping pre-deployment validation as requested"
    fi
    
    # Check SSH connectivity
    if ! remote_exec "echo 'SSH connection test successful'" "Testing SSH connectivity"; then
        log_error "Cannot establish SSH connection to production server"
        exit 1
    fi
    
    # Step 2: Backup current state
    echo -e "\n${BLUE}2. CREATING BACKUP${NC}"
    echo "===================="
    
    if ! create_backup; then
        if [[ "$FORCE_DEPLOY" != "true" ]]; then
            log_error "Backup creation failed, aborting deployment"
            exit 1
        else
            log_warning "Backup creation failed, but force deploy enabled"
        fi
    fi
    
    # Step 3: Build and prepare image
    echo -e "\n${BLUE}3. BUILD PREPARATION${NC}"
    echo "===================="
    
    IMAGE_FILE="$PROJECT_ROOT/${IMAGE_NAME}-${VERSION}.tar.gz"
    
    # Check if image already exists
    if [[ ! -f "$IMAGE_FILE" ]]; then
        log_info "Docker image not found, building..."
        if [[ -x "$SCRIPT_DIR/build-production-docker.sh" ]]; then
            if "$SCRIPT_DIR/build-production-docker.sh" "$VERSION"; then
                log_success "Docker image built successfully"
            else
                log_error "Docker image build failed"
                exit 1
            fi
        else
            log_error "Build script not found: $SCRIPT_DIR/build-production-docker.sh"
            exit 1
        fi
    else
        log_success "Using existing Docker image: $IMAGE_FILE"
    fi
    
    # Step 4: Deploy configuration
    echo -e "\n${BLUE}4. CONFIGURATION UPDATE${NC}"
    echo "========================="
    
    if ! update_configuration; then
        log_error "Configuration update failed"
        exit 1
    fi
    
    # Step 5: Stop services
    echo -e "\n${BLUE}5. STOPPING SERVICES${NC}"
    echo "===================="
    
    if ! stop_services; then
        log_error "Failed to stop services"
        exit 1
    fi
    
    # Step 6: Deploy new image
    echo -e "\n${BLUE}6. DEPLOYING IMAGE${NC}"
    echo "=================="
    
    if ! deploy_image "$IMAGE_FILE"; then
        log_error "Image deployment failed"
        rollback_deployment
        exit 1
    fi
    
    # Step 7: Run database migrations
    echo -e "\n${BLUE}7. DATABASE MIGRATIONS${NC}"
    echo "======================"
    
    if ! run_migrations; then
        log_error "Database migrations failed"
        rollback_deployment
        exit 1
    fi
    
    # Step 8: Start services
    echo -e "\n${BLUE}8. STARTING SERVICES${NC}"
    echo "===================="
    
    if ! start_services; then
        log_error "Failed to start services"
        rollback_deployment
        exit 1
    fi
    
    # Step 9: Validate deployment
    echo -e "\n${BLUE}9. DEPLOYMENT VALIDATION${NC}"
    echo "========================="
    
    if ! validate_deployment; then
        log_error "Deployment validation failed"
        rollback_deployment
        exit 1
    fi
    
    # Step 10: Cleanup
    echo -e "\n${BLUE}10. CLEANUP${NC}"
    echo "============"
    
    # Clean up old Docker images on production server
    remote_exec "docker image prune -f" "Cleaning up old Docker images"
    
    # Remove transferred image file
    remote_exec "rm -f $PROD_PATH/$(basename "$IMAGE_FILE")" "Cleaning up transferred image file"
    
    log_success "Deployment cleanup completed"
    
    # Final summary
    echo -e "\n${BLUE}DEPLOYMENT SUMMARY${NC}"
    echo "=================="
    echo "✓ Version: $VERSION"
    echo "✓ Target: $PROD_USER@$PROD_SERVER"
    echo "✓ Backup: $BACKUP_FILE"
    echo "✓ Deployment time: $(date)"
    
    # Copy deployment log to production server
    transfer_file "$DEPLOYMENT_LOG" "$PROD_PATH/deployments/deployment-$VERSION.log" "Transferring deployment log"
    
    echo -e "\n${GREEN}🚀 DEPLOYMENT COMPLETED SUCCESSFULLY${NC}"
    
    # Provide next steps
    echo -e "\n${BLUE}POST-DEPLOYMENT STEPS:${NC}"
    echo "======================"
    echo "1. Monitor application logs:"
    echo "   ssh $PROD_USER@$PROD_SERVER 'docker logs -f $CONTAINER_NAME'"
    echo ""
    echo "2. Run health check:"
    echo "   ./scripts/health-check.sh"
    echo ""
    echo "3. Monitor system performance:"
    echo "   ssh $PROD_USER@$PROD_SERVER 'docker stats'"
    echo ""
    echo "Deployment log: $DEPLOYMENT_LOG"
}

# Parse command line options
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --skip-validation)
            SKIP_VALIDATION=true
            shift
            ;;
        --force)
            FORCE_DEPLOY=true
            shift
            ;;
        --no-rollback)
            ROLLBACK_ON_FAILURE=false
            shift
            ;;
        --help)
            echo "Usage: $0 [VERSION] [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --dry-run           Show what would be done without making changes"
            echo "  --skip-backup       Skip creating pre-deployment backup"
            echo "  --skip-validation   Skip pre-deployment validation checks"
            echo "  --force             Force deployment even if validation fails"
            echo "  --no-rollback       Disable automatic rollback on failure"
            echo "  --help              Show this help message"
            echo ""
            echo "Environment variables:"
            echo "  PROD_SERVER         Production server IP (default: 192.168.97.149)"
            echo "  PROD_USER           Production server user (default: tme-user)"
            echo "  PROD_PATH           Production server path (default: /home/tme-user)"
            echo ""
            exit 0
            ;;
        *)
            VERSION="$1"
            shift
            ;;
    esac
done

# Run main function
main "$@"