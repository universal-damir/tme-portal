#!/bin/bash

# TME Portal Pre-Deployment Validation Script
# Comprehensive checks before production deployment
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
ENV_FILE="$PROJECT_ROOT/.env.production"
DOCKER_COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
WARNINGS=0

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((CHECKS_PASSED++))
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
    ((CHECKS_FAILED++))
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
    ((WARNINGS++))
}

check_command() {
    if command -v "$1" &> /dev/null; then
        log_success "$1 is installed"
        return 0
    else
        log_error "$1 is not installed"
        return 1
    fi
}

check_file_exists() {
    if [[ -f "$1" ]]; then
        log_success "File exists: $1"
        return 0
    else
        log_error "Missing file: $1"
        return 1
    fi
}

check_env_var() {
    local var_name="$1"
    local var_value="${!var_name}"
    
    if [[ -n "$var_value" ]]; then
        if [[ "$var_value" == *"dummy"* ]] || [[ "$var_value" == *"placeholder"* ]] || [[ "$var_value" == *"example"* ]]; then
            log_error "Environment variable $var_name contains placeholder value"
            return 1
        else
            log_success "Environment variable $var_name is set"
            return 0
        fi
    else
        log_error "Environment variable $var_name is not set"
        return 1
    fi
}

# Main validation function
main() {
    echo -e "${BLUE}==========================================
TME Portal Pre-Deployment Validation
==========================================${NC}"
    
    echo -e "\n${BLUE}1. SYSTEM REQUIREMENTS CHECK${NC}"
    echo "=================================="
    
    # Check required system commands
    check_command "node"
    check_command "npm"
    check_command "docker"
    check_command "docker-compose"
    check_command "git"
    check_command "curl"
    check_command "tar"
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
    if [[ $MAJOR_VERSION -ge 20 ]]; then
        log_success "Node.js version $NODE_VERSION (>= 20.0.0)"
    else
        log_error "Node.js version $NODE_VERSION is too old (require >= 20.0.0)"
    fi
    
    echo -e "\n${BLUE}2. PROJECT FILES CHECK${NC}"
    echo "==============================="
    
    # Check essential files
    check_file_exists "$PROJECT_ROOT/package.json"
    check_file_exists "$PROJECT_ROOT/package-lock.json"
    check_file_exists "$PROJECT_ROOT/Dockerfile"
    check_file_exists "$PROJECT_ROOT/docker-compose.yml"
    check_file_exists "$PROJECT_ROOT/next.config.ts"
    check_file_exists "$PROJECT_ROOT/tsconfig.json"
    
    # Check database files
    check_file_exists "$PROJECT_ROOT/database/init.sql"
    check_file_exists "$PROJECT_ROOT/database/seed.sql"
    
    echo -e "\n${BLUE}3. ENVIRONMENT CONFIGURATION CHECK${NC}"
    echo "===================================="
    
    # Load environment variables
    if [[ -f "$ENV_FILE" ]]; then
        log_success "Production environment file found"
        source "$ENV_FILE"
        
        # Check critical environment variables
        check_env_var "NODE_ENV"
        check_env_var "POSTGRES_PASSWORD"
        check_env_var "REDIS_PASSWORD" 
        check_env_var "NEXTAUTH_SECRET"
        check_env_var "DATABASE_URL"
        check_env_var "REDIS_URL"
        check_env_var "NEXTAUTH_URL"
        
        # Check password strength
        if [[ ${#POSTGRES_PASSWORD} -lt 16 ]]; then
            log_warning "PostgreSQL password is shorter than 16 characters"
        else
            log_success "PostgreSQL password meets length requirements"
        fi
        
        if [[ ${#REDIS_PASSWORD} -lt 16 ]]; then
            log_warning "Redis password is shorter than 16 characters"
        else
            log_success "Redis password meets length requirements"
        fi
        
        if [[ ${#NEXTAUTH_SECRET} -lt 32 ]]; then
            log_error "NextAuth secret is too short (minimum 32 characters)"
        else
            log_success "NextAuth secret meets length requirements"
        fi
        
        # Validate NODE_ENV
        if [[ "$NODE_ENV" == "production" ]]; then
            log_success "NODE_ENV is set to production"
        else
            log_error "NODE_ENV is not set to production (current: $NODE_ENV)"
        fi
        
    else
        log_error "Production environment file not found: $ENV_FILE"
    fi
    
    echo -e "\n${BLUE}4. DEPENDENCIES CHECK${NC}"
    echo "=========================="
    
    # Check if node_modules exists and is up to date
    if [[ -d "$PROJECT_ROOT/node_modules" ]]; then
        log_success "node_modules directory exists"
        
        # Check if package-lock.json is newer than node_modules
        if [[ "$PROJECT_ROOT/package-lock.json" -nt "$PROJECT_ROOT/node_modules" ]]; then
            log_warning "package-lock.json is newer than node_modules - consider running npm ci"
        else
            log_success "Dependencies appear to be up to date"
        fi
    else
        log_error "node_modules directory not found - run npm ci"
    fi
    
    echo -e "\n${BLUE}5. BUILD VALIDATION${NC}"
    echo "====================="
    
    # Check TypeScript compilation
    log_info "Checking TypeScript compilation..."
    if npm run build > /dev/null 2>&1; then
        log_success "TypeScript compilation successful"
        
        # Check if .next/standalone exists (required for Docker)
        if [[ -d "$PROJECT_ROOT/.next/standalone" ]]; then
            log_success "Standalone build output exists"
        else
            log_error "Standalone build output not found - check next.config.ts"
        fi
    else
        log_error "TypeScript compilation failed"
    fi
    
    # Run linting
    log_info "Running ESLint..."
    if npm run lint > /dev/null 2>&1; then
        log_success "ESLint passed"
    else
        log_warning "ESLint issues found - check with 'npm run lint'"
    fi
    
    echo -e "\n${BLUE}6. DATABASE MIGRATION CHECK${NC}"
    echo "==============================="
    
    # Check for pending migrations
    MIGRATION_FILES=$(find "$PROJECT_ROOT/database/migrations" -name "*.sql" 2>/dev/null | wc -l)
    if [[ $MIGRATION_FILES -gt 0 ]]; then
        log_success "Found $MIGRATION_FILES migration files"
        
        # List recent migrations
        log_info "Recent migrations:"
        find "$PROJECT_ROOT/database/migrations" -name "*.sql" -printf "%f\n" | sort | tail -5 | while read -r migration; do
            echo "  - $migration"
        done
    else
        log_warning "No migration files found"
    fi
    
    echo -e "\n${BLUE}7. DOCKER CONFIGURATION CHECK${NC}"
    echo "=================================="
    
    # Validate Docker Compose file
    if docker-compose -f "$DOCKER_COMPOSE_FILE" config > /dev/null 2>&1; then
        log_success "Docker Compose file is valid"
    else
        log_error "Docker Compose file has syntax errors"
    fi
    
    # Check Docker daemon
    if docker info > /dev/null 2>&1; then
        log_success "Docker daemon is running"
    else
        log_error "Docker daemon is not running or accessible"
    fi
    
    echo -e "\n${BLUE}8. SECURITY CHECK${NC}"
    echo "==================="
    
    # Check for sensitive files that shouldn't be in production
    SENSITIVE_FILES=(".env" ".env.local" ".env.development" "secrets/" "debug.log" "dev.log")
    for file in "${SENSITIVE_FILES[@]}"; do
        if [[ -e "$PROJECT_ROOT/$file" ]]; then
            if [[ "$file" == "secrets/" ]] && [[ -d "$PROJECT_ROOT/$file" ]]; then
                log_warning "Secrets directory exists - ensure it's properly secured"
            elif [[ "$file" != ".env.production" ]]; then
                log_warning "Sensitive file found: $file"
            fi
        fi
    done
    
    # Check file permissions for scripts
    SCRIPT_FILES=("$PROJECT_ROOT/scripts"/*.sh)
    for script in "${SCRIPT_FILES[@]}"; do
        if [[ -f "$script" ]] && [[ -x "$script" ]]; then
            log_success "Script is executable: $(basename "$script")"
        elif [[ -f "$script" ]]; then
            log_warning "Script not executable: $(basename "$script")"
        fi
    done
    
    echo -e "\n${BLUE}9. BACKUP VERIFICATION${NC}"
    echo "========================="
    
    # Check if backup directory exists
    if [[ -d "$PROJECT_ROOT/backups" ]]; then
        BACKUP_COUNT=$(find "$PROJECT_ROOT/backups" -name "*.tar.gz" | wc -l)
        if [[ $BACKUP_COUNT -gt 0 ]]; then
            log_success "Found $BACKUP_COUNT existing backups"
            
            # Show most recent backup
            LATEST_BACKUP=$(find "$PROJECT_ROOT/backups" -name "*.tar.gz" -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
            if [[ -n "$LATEST_BACKUP" ]]; then
                BACKUP_DATE=$(stat -c %y "$LATEST_BACKUP" | cut -d' ' -f1)
                log_info "Latest backup: $(basename "$LATEST_BACKUP") (created: $BACKUP_DATE)"
            fi
        else
            log_warning "No existing backups found"
        fi
    else
        log_warning "Backup directory does not exist"
    fi
    
    # Check backup script
    if [[ -x "$PROJECT_ROOT/scripts/backup.sh" ]]; then
        log_success "Backup script is available and executable"
    else
        log_warning "Backup script not found or not executable"
    fi
    
    echo -e "\n${BLUE}10. FINAL SUMMARY${NC}"
    echo "=================="
    
    echo "Checks passed: $CHECKS_PASSED"
    echo "Checks failed: $CHECKS_FAILED"
    echo "Warnings: $WARNINGS"
    
    if [[ $CHECKS_FAILED -eq 0 ]]; then
        echo -e "\n${GREEN}✓ PRE-DEPLOYMENT VALIDATION PASSED${NC}"
        echo -e "The system is ready for production deployment."
        
        if [[ $WARNINGS -gt 0 ]]; then
            echo -e "${YELLOW}⚠ However, please review the $WARNINGS warning(s) above.${NC}"
        fi
        
        exit 0
    else
        echo -e "\n${RED}✗ PRE-DEPLOYMENT VALIDATION FAILED${NC}"
        echo -e "Please fix the $CHECKS_FAILED error(s) before deployment."
        exit 1
    fi
}

# Run main function
main "$@"