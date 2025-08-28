#!/bin/bash

# TME Portal Backup and Rollback Script
# Comprehensive backup creation and restoration system
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
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=${RETENTION_DAYS:-30}

# Docker configuration
DOCKER_COMPOSE_PROJECT="${DOCKER_COMPOSE_PROJECT:-tme-portal}"
DB_CONTAINER_NAME="${DOCKER_COMPOSE_PROJECT}-postgres-1"
REDIS_CONTAINER_NAME="${DOCKER_COMPOSE_PROJECT}-redis-1"
APP_CONTAINER_NAME="${DOCKER_COMPOSE_PROJECT}-app-1"

# Database configuration
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-tme_portal}"
DB_USER="${DB_USER:-tme_user}"

# Load environment variables
if [[ -f "$PROJECT_ROOT/.env.production" ]]; then
    source "$PROJECT_ROOT/.env.production"
elif [[ -f "$PROJECT_ROOT/.env" ]]; then
    source "$PROJECT_ROOT/.env"
fi

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

# Function to check if Docker containers are running
check_container_status() {
    local container_name="$1"
    
    if docker ps --format "table {{.Names}}" | grep -q "^$container_name$"; then
        return 0
    else
        return 1
    fi
}

# Function to wait for database to be ready
wait_for_database() {
    local max_attempts=${1:-30}
    local wait_time=${2:-5}
    
    log_info "Waiting for database to be ready..."
    
    for i in $(seq 1 $max_attempts); do
        if docker exec "$DB_CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
            log_success "Database is ready"
            return 0
        fi
        
        if [[ $i -lt $max_attempts ]]; then
            log_info "Database not ready, waiting ${wait_time}s... (attempt $i/$max_attempts)"
            sleep $wait_time
        fi
    done
    
    log_error "Database did not become ready after $max_attempts attempts"
    return 1
}

# Function to create database backup
backup_database() {
    local backup_file="$1"
    
    log_info "Creating PostgreSQL backup..."
    
    if ! check_container_status "$DB_CONTAINER_NAME"; then
        log_error "Database container is not running: $DB_CONTAINER_NAME"
        return 1
    fi
    
    if ! wait_for_database; then
        log_error "Database is not accessible for backup"
        return 1
    fi
    
    # Create custom format backup (recommended for restoration)
    if docker exec "$DB_CONTAINER_NAME" pg_dump \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --no-password \
        --verbose \
        --clean \
        --if-exists \
        --create \
        --format=custom \
        > "$backup_file.dump" 2>/dev/null; then
        
        log_success "Custom format backup created: $backup_file.dump"
    else
        log_error "Failed to create custom format backup"
        return 1
    fi
    
    # Create SQL format backup (for easy inspection)
    if docker exec "$DB_CONTAINER_NAME" pg_dump \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --no-password \
        --verbose \
        --clean \
        --if-exists \
        --create \
        > "$backup_file.sql" 2>/dev/null; then
        
        log_success "SQL format backup created: $backup_file.sql"
    else
        log_warning "Failed to create SQL format backup"
    fi
    
    return 0
}

# Function to create Redis backup
backup_redis() {
    local backup_file="$1"
    
    log_info "Creating Redis backup..."
    
    if ! check_container_status "$REDIS_CONTAINER_NAME"; then
        log_warning "Redis container is not running, skipping Redis backup"
        return 0
    fi
    
    # Create Redis backup using BGSAVE
    if docker exec "$REDIS_CONTAINER_NAME" redis-cli BGSAVE > /dev/null 2>&1; then
        # Wait for background save to complete
        local max_attempts=30
        for i in $(seq 1 $max_attempts); do
            if docker exec "$REDIS_CONTAINER_NAME" redis-cli LASTSAVE > /dev/null 2>&1; then
                sleep 1
                break
            fi
            sleep 1
        done
        
        # Copy the RDB file
        if docker cp "$REDIS_CONTAINER_NAME:/data/dump.rdb" "$backup_file.rdb" 2>/dev/null; then
            log_success "Redis backup created: $backup_file.rdb"
            return 0
        else
            log_warning "Failed to copy Redis backup file"
            return 1
        fi
    else
        log_warning "Failed to create Redis backup"
        return 1
    fi
}

# Function to backup Docker volumes
backup_volumes() {
    local backup_dir="$1"
    
    log_info "Creating Docker volume backups..."
    
    # Backup app uploads volume
    local uploads_volume="${DOCKER_COMPOSE_PROJECT}_app_uploads"
    if docker volume ls --format "table {{.Name}}" | grep -q "$uploads_volume"; then
        log_info "Backing up uploads volume..."
        if docker run --rm -v "$uploads_volume:/data" -v "$backup_dir:/backup" busybox tar czf "/backup/app_uploads_$DATE.tar.gz" -C /data . 2>/dev/null; then
            log_success "Uploads volume backup created"
        else
            log_warning "Failed to backup uploads volume"
        fi
    else
        log_info "Uploads volume not found, skipping"
    fi
    
    # Backup postgres data volume
    local postgres_volume="tmeportalv52_postgres_data"
    if docker volume ls --format "table {{.Name}}" | grep -q "$postgres_volume"; then
        log_info "Backing up postgres data volume..."
        if docker run --rm -v "$postgres_volume:/data" -v "$backup_dir:/backup" busybox tar czf "/backup/postgres_data_$DATE.tar.gz" -C /data . 2>/dev/null; then
            log_success "Postgres data volume backup created"
        else
            log_warning "Failed to backup postgres data volume"
        fi
    else
        log_info "Postgres data volume not found, skipping"
    fi
    
    # Backup redis data volume
    local redis_volume="tmeportalv52_redis_data"
    if docker volume ls --format "table {{.Name}}" | grep -q "$redis_volume"; then
        log_info "Backing up redis data volume..."
        if docker run --rm -v "$redis_volume:/data" -v "$backup_dir:/backup" busybox tar czf "/backup/redis_data_$DATE.tar.gz" -C /data . 2>/dev/null; then
            log_success "Redis data volume backup created"
        else
            log_warning "Failed to backup redis data volume"
        fi
    else
        log_info "Redis data volume not found, skipping"
    fi
}

# Function to backup application state
backup_application() {
    local backup_dir="$1"
    
    log_info "Creating application state backup..."
    
    # Backup configuration files
    local config_backup="$backup_dir/application_config_$DATE.tar.gz"
    
    # List of important files to backup
    local config_files=(
        ".env.production"
        "docker-compose.yml"
        "docker-compose.production.yml"
        "package.json"
        "package-lock.json"
    )
    
    local files_to_backup=""
    for file in "${config_files[@]}"; do
        if [[ -f "$PROJECT_ROOT/$file" ]]; then
            files_to_backup="$files_to_backup $file"
        fi
    done
    
    if [[ -n "$files_to_backup" ]]; then
        if tar -czf "$config_backup" -C "$PROJECT_ROOT" $files_to_backup 2>/dev/null; then
            log_success "Application configuration backup created: $config_backup"
        else
            log_warning "Failed to create application configuration backup"
        fi
    fi
    
    # Backup current Docker images
    log_info "Creating Docker image backup..."
    local image_backup="$backup_dir/docker_images_$DATE.tar"
    
    if docker save $(docker images --format "table {{.Repository}}:{{.Tag}}" | grep -E "(tme-portal|postgres|redis)" | tr '\n' ' ') -o "$image_backup" 2>/dev/null; then
        if gzip "$image_backup"; then
            log_success "Docker images backup created: ${image_backup}.gz"
        else
            log_warning "Failed to compress Docker images backup"
        fi
    else
        log_warning "Failed to create Docker images backup"
    fi
}

# Function to create comprehensive backup
create_full_backup() {
    local backup_name="${1:-tme_portal_complete_$DATE}"
    local backup_base="$BACKUP_DIR/$backup_name"
    
    log_info "Creating comprehensive backup: $backup_name"
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Create temporary directory for this backup
    local temp_backup_dir="$BACKUP_DIR/temp_$DATE"
    mkdir -p "$temp_backup_dir"
    
    # Create database backup
    if ! backup_database "$backup_base"; then
        log_error "Database backup failed"
        return 1
    fi
    
    # Create Redis backup
    backup_redis "$backup_base"
    
    # Create Docker volume backups
    backup_volumes "$temp_backup_dir"
    
    # Create application state backup
    backup_application "$temp_backup_dir"
    
    # Create comprehensive archive
    log_info "Creating comprehensive backup archive..."
    local archive_files=""
    
    # Add database files
    [[ -f "$backup_base.dump" ]] && archive_files="$archive_files $(basename "$backup_base.dump")"
    [[ -f "$backup_base.sql" ]] && archive_files="$archive_files $(basename "$backup_base.sql")"
    [[ -f "$backup_base.rdb" ]] && archive_files="$archive_files $(basename "$backup_base.rdb")"
    
    # Add volume backups
    for file in "$temp_backup_dir"/*.tar.gz; do
        if [[ -f "$file" ]]; then
            cp "$file" "$BACKUP_DIR/"
            archive_files="$archive_files $(basename "$file")"
        fi
    done
    
    # Create the final archive
    if tar -czf "${backup_base}.tar.gz" -C "$BACKUP_DIR" $archive_files 2>/dev/null; then
        log_success "Comprehensive backup created: ${backup_base}.tar.gz"
        
        # Clean up individual files
        for file in $archive_files; do
            rm -f "$BACKUP_DIR/$file"
        done
        rm -rf "$temp_backup_dir"
        
        # Create backup manifest
        create_backup_manifest "${backup_base}.tar.gz"
        
        return 0
    else
        log_error "Failed to create comprehensive backup archive"
        return 1
    fi
}

# Function to create backup manifest
create_backup_manifest() {
    local backup_file="$1"
    local manifest_file="${backup_file%.tar.gz}_manifest.txt"
    
    log_info "Creating backup manifest..."
    
    cat > "$manifest_file" << EOF
TME Portal Backup Manifest
==========================
Backup Date: $(date)
Backup File: $(basename "$backup_file")
Backup Size: $(ls -lh "$backup_file" | awk '{print $5}')

System Information:
Docker Version: $(docker --version 2>/dev/null || echo "Not available")
Docker Compose Version: $(docker-compose --version 2>/dev/null || echo "Not available")

Database Information:
EOF
    
    # Add database information if available
    if check_container_status "$DB_CONTAINER_NAME"; then
        echo "PostgreSQL Version: $(docker exec "$DB_CONTAINER_NAME" postgres --version 2>/dev/null | head -1 || echo "Not available")" >> "$manifest_file"
        echo "Database Size: $(docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" 2>/dev/null | tr -d ' ' || echo "Not available")" >> "$manifest_file"
        
        echo "" >> "$manifest_file"
        echo "Database Tables:" >> "$manifest_file"
        docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT schemaname||'.'||tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" 2>/dev/null | sed 's/^/  - /' >> "$manifest_file" || echo "  - Not available" >> "$manifest_file"
        
        echo "" >> "$manifest_file"
        echo "Recent Activity:" >> "$manifest_file"
        docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) || ' total users' FROM users;" 2>/dev/null | tr -d ' ' | sed 's/^/  - /' >> "$manifest_file" || echo "  - User count not available" >> "$manifest_file"
        docker exec "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) || ' active sessions' FROM sessions WHERE expires_at > NOW();" 2>/dev/null | tr -d ' ' | sed 's/^/  - /' >> "$manifest_file" || echo "  - Session count not available" >> "$manifest_file"
    fi
    
    cat >> "$manifest_file" << EOF

Backup Contents:
  - PostgreSQL database dump (custom format)
  - PostgreSQL database dump (SQL format)
  - Redis data snapshot
  - Docker volumes backup
  - Application configuration files
  - Docker images backup

Backup Status: SUCCESS
EOF
    
    log_success "Backup manifest created: $manifest_file"
}

# Function to restore from backup
restore_from_backup() {
    local backup_file="$1"
    
    if [[ ! -f "$backup_file" ]]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    log_info "Restoring from backup: $(basename "$backup_file")"
    
    # Create temporary directory for restoration
    local temp_restore_dir="/tmp/tme_restore_$$"
    mkdir -p "$temp_restore_dir"
    
    # Extract backup
    log_info "Extracting backup archive..."
    if tar -xzf "$backup_file" -C "$temp_restore_dir"; then
        log_success "Backup archive extracted"
    else
        log_error "Failed to extract backup archive"
        rm -rf "$temp_restore_dir"
        return 1
    fi
    
    # Stop services for restoration
    log_info "Stopping services for restoration..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.yml" down || log_warning "Failed to stop some services"
    
    # Restore database
    local db_dump_file=""
    for file in "$temp_restore_dir"/*.dump; do
        if [[ -f "$file" ]]; then
            db_dump_file="$file"
            break
        fi
    done
    
    if [[ -n "$db_dump_file" ]]; then
        log_info "Restoring database from: $(basename "$db_dump_file")"
        
        # Start only the database service for restoration
        docker-compose -f "$PROJECT_ROOT/docker-compose.yml" up -d postgres
        
        # Wait for database to be ready
        if wait_for_database; then
            # Drop existing database and restore
            if cat "$db_dump_file" | docker exec -i "$DB_CONTAINER_NAME" pg_restore -U "$DB_USER" -d postgres --clean --create; then
                log_success "Database restored successfully"
            else
                log_error "Database restoration failed"
                rm -rf "$temp_restore_dir"
                return 1
            fi
        else
            log_error "Database is not ready for restoration"
            rm -rf "$temp_restore_dir"
            return 1
        fi
    else
        log_warning "No database dump file found in backup"
    fi
    
    # Restore Redis data
    local redis_file=""
    for file in "$temp_restore_dir"/*.rdb; do
        if [[ -f "$file" ]]; then
            redis_file="$file"
            break
        fi
    done
    
    if [[ -n "$redis_file" ]]; then
        log_info "Restoring Redis data from: $(basename "$redis_file")"
        
        # Start Redis service
        docker-compose -f "$PROJECT_ROOT/docker-compose.yml" up -d redis
        sleep 5
        
        # Stop Redis, copy file, and restart
        docker stop "$REDIS_CONTAINER_NAME" 2>/dev/null || true
        docker cp "$redis_file" "$REDIS_CONTAINER_NAME:/data/dump.rdb"
        docker start "$REDIS_CONTAINER_NAME"
        
        log_success "Redis data restored"
    else
        log_info "No Redis backup file found"
    fi
    
    # Start all services
    log_info "Starting all services..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.yml" up -d
    
    # Wait for services to be ready
    sleep 15
    
    # Verify restoration
    if wait_for_database; then
        log_success "Database is accessible after restoration"
    else
        log_warning "Database accessibility check failed after restoration"
    fi
    
    # Clean up
    rm -rf "$temp_restore_dir"
    
    log_success "Restoration completed successfully"
    return 0
}

# Function to list available backups
list_backups() {
    log_info "Available backups in $BACKUP_DIR:"
    echo ""
    
    if [[ -d "$BACKUP_DIR" ]]; then
        local backup_count=0
        while IFS= read -r -d '' backup_file; do
            local file_name=$(basename "$backup_file")
            local file_size=$(ls -lh "$backup_file" | awk '{print $5}')
            local file_date=$(stat -c %y "$backup_file" 2>/dev/null | cut -d' ' -f1,2 | cut -d'.' -f1 || echo "Unknown")
            
            echo "  📦 $file_name"
            echo "     Size: $file_size"
            echo "     Date: $file_date"
            echo ""
            
            ((backup_count++))
        done < <(find "$BACKUP_DIR" -name "*.tar.gz" -print0 | sort -z)
        
        if [[ $backup_count -eq 0 ]]; then
            log_warning "No backup files found"
        else
            log_info "Total backups found: $backup_count"
        fi
    else
        log_warning "Backup directory does not exist: $BACKUP_DIR"
    fi
}

# Function to clean old backups
clean_old_backups() {
    log_info "Cleaning backups older than $RETENTION_DAYS days..."
    
    if [[ -d "$BACKUP_DIR" ]]; then
        local deleted_count=0
        while IFS= read -r -d '' old_backup; do
            log_info "Deleting old backup: $(basename "$old_backup")"
            rm -f "$old_backup"
            # Also delete corresponding manifest
            local manifest="${old_backup%.tar.gz}_manifest.txt"
            [[ -f "$manifest" ]] && rm -f "$manifest"
            ((deleted_count++))
        done < <(find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -print0)
        
        if [[ $deleted_count -gt 0 ]]; then
            log_success "Cleaned up $deleted_count old backup(s)"
        else
            log_info "No old backups to clean up"
        fi
    else
        log_warning "Backup directory does not exist: $BACKUP_DIR"
    fi
}

# Function to verify backup integrity
verify_backup() {
    local backup_file="$1"
    
    if [[ ! -f "$backup_file" ]]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    log_info "Verifying backup integrity: $(basename "$backup_file")"
    
    # Test if archive can be extracted
    if tar -tzf "$backup_file" > /dev/null 2>&1; then
        log_success "Backup archive integrity verified"
        
        # List contents
        log_info "Backup contents:"
        tar -tzf "$backup_file" | head -10 | sed 's/^/  - /'
        
        local file_count=$(tar -tzf "$backup_file" | wc -l)
        if [[ $file_count -gt 10 ]]; then
            echo "  ... and $(($file_count - 10)) more files"
        fi
        
        return 0
    else
        log_error "Backup archive integrity check failed"
        return 1
    fi
}

# Main function
main() {
    local command="${1:-backup}"
    
    case "$command" in
        backup|create)
            echo -e "${BLUE}==========================================
TME Portal Backup Creation
==========================================${NC}"
            
            local backup_name="$2"
            if create_full_backup "$backup_name"; then
                log_success "Backup creation completed successfully"
                clean_old_backups
            else
                log_error "Backup creation failed"
                exit 1
            fi
            ;;
            
        restore)
            echo -e "${BLUE}==========================================
TME Portal Backup Restoration
==========================================${NC}"
            
            local backup_file="$2"
            if [[ -z "$backup_file" ]]; then
                log_error "Please specify backup file to restore from"
                echo "Usage: $0 restore <backup_file>"
                exit 1
            fi
            
            # Confirm restoration
            read -p "Are you sure you want to restore from $backup_file? This will overwrite current data. (yes/no): " -r
            if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
                log_info "Restoration cancelled by user"
                exit 0
            fi
            
            if restore_from_backup "$backup_file"; then
                log_success "Restoration completed successfully"
            else
                log_error "Restoration failed"
                exit 1
            fi
            ;;
            
        list)
            echo -e "${BLUE}==========================================
TME Portal Backup Listing
==========================================${NC}"
            
            list_backups
            ;;
            
        clean)
            echo -e "${BLUE}==========================================
TME Portal Backup Cleanup
==========================================${NC}"
            
            clean_old_backups
            ;;
            
        verify)
            echo -e "${BLUE}==========================================
TME Portal Backup Verification
==========================================${NC}"
            
            local backup_file="$2"
            if [[ -z "$backup_file" ]]; then
                log_error "Please specify backup file to verify"
                echo "Usage: $0 verify <backup_file>"
                exit 1
            fi
            
            if verify_backup "$backup_file"; then
                log_success "Backup verification completed successfully"
            else
                log_error "Backup verification failed"
                exit 1
            fi
            ;;
            
        help|--help)
            echo "TME Portal Backup and Rollback Script"
            echo ""
            echo "Usage: $0 <command> [options]"
            echo ""
            echo "Commands:"
            echo "  backup [name]     Create a comprehensive backup"
            echo "  restore <file>    Restore from a backup file"
            echo "  list              List available backups"
            echo "  clean             Clean old backups"
            echo "  verify <file>     Verify backup file integrity"
            echo "  help              Show this help message"
            echo ""
            echo "Environment variables:"
            echo "  BACKUP_DIR        Backup directory (default: ./backups)"
            echo "  RETENTION_DAYS    Backup retention in days (default: 30)"
            echo ""
            echo "Examples:"
            echo "  $0 backup                    # Create backup with timestamp"
            echo "  $0 backup pre-deployment     # Create named backup"
            echo "  $0 restore backup.tar.gz     # Restore from backup"
            echo "  $0 list                      # Show available backups"
            echo "  $0 verify backup.tar.gz      # Verify backup integrity"
            ;;
            
        *)
            log_error "Unknown command: $command"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"