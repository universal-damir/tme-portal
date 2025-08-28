#!/bin/bash

# TME Portal Environment Sync Validator
# Validates that local and production environments match
# Ensures database schemas, users, and configurations are synchronized
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
LOCAL_ENV_FILE="$PROJECT_ROOT/.env"
PROD_ENV_FILE="$PROJECT_ROOT/.env.production"
TEMP_DIR="/tmp/tme-env-validation-$$"

# Production server configuration
PROD_SERVER="${PROD_SERVER:-192.168.97.149}"
PROD_USER="${PROD_USER:-tme-user}"
PROD_DOCKER_COMPOSE_PROJECT="${PROD_DOCKER_COMPOSE_PROJECT:-tme-portal}"

# Validation counters
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

cleanup() {
    if [[ -d "$TEMP_DIR" ]]; then
        rm -rf "$TEMP_DIR"
    fi
}

trap cleanup EXIT

# Create temp directory
mkdir -p "$TEMP_DIR"

# Function to extract env var from file
get_env_var() {
    local file="$1"
    local var="$2"
    
    if [[ -f "$file" ]]; then
        grep "^$var=" "$file" 2>/dev/null | cut -d'=' -f2- | tr -d '"' || echo ""
    else
        echo ""
    fi
}

# Function to validate database connection
validate_db_connection() {
    local db_url="$1"
    local label="$2"
    
    if [[ -n "$db_url" ]]; then
        # Extract connection details
        local host=$(echo "$db_url" | sed -n 's/.*@\([^:]*\):.*/\1/p')
        local port=$(echo "$db_url" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        local user=$(echo "$db_url" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
        local password=$(echo "$db_url" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
        local database=$(echo "$db_url" | sed -n 's/.*\/\([^?]*\).*/\1/p')
        
        log_info "Testing $label database connection ($host:$port/$database)"
        
        # Test connection using psql if available
        if command -v psql &> /dev/null; then
            if PGPASSWORD="$password" psql -h "$host" -p "$port" -U "$user" -d "$database" -c "SELECT 1;" &> /dev/null; then
                log_success "$label database connection successful"
                return 0
            else
                log_error "$label database connection failed"
                return 1
            fi
        else
            log_warning "psql not available, skipping direct database test for $label"
            return 0
        fi
    else
        log_error "$label database URL not found"
        return 1
    fi
}

# Function to validate Redis connection
validate_redis_connection() {
    local redis_url="$1"
    local label="$2"
    
    if [[ -n "$redis_url" ]]; then
        # Extract Redis details
        local host=$(echo "$redis_url" | sed -n 's/.*@\([^:]*\):.*/\1/p')
        local port=$(echo "$redis_url" | sed -n 's/.*:\([0-9]*\)$/\1/p')
        local password=$(echo "$redis_url" | sed -n 's/.*:\/\/:\([^@]*\)@.*/\1/p')
        
        log_info "Testing $label Redis connection ($host:$port)"
        
        # Test connection using redis-cli if available
        if command -v redis-cli &> /dev/null; then
            if redis-cli -h "$host" -p "$port" -a "$password" ping &> /dev/null; then
                log_success "$label Redis connection successful"
                return 0
            else
                log_error "$label Redis connection failed"
                return 1
            fi
        else
            log_warning "redis-cli not available, skipping direct Redis test for $label"
            return 0
        fi
    else
        log_error "$label Redis URL not found"
        return 1
    fi
}

# Function to get production environment via SSH
get_production_env() {
    local env_file="$TEMP_DIR/prod.env"
    
    log_info "Retrieving production environment configuration..."
    
    # Try to get environment from production server
    if ssh -o ConnectTimeout=10 -o BatchMode=yes "$PROD_USER@$PROD_SERVER" "test -f ~/.env.production" 2>/dev/null; then
        if scp "$PROD_USER@$PROD_SERVER:~/.env.production" "$env_file" &>/dev/null; then
            log_success "Production environment retrieved from server"
            echo "$env_file"
            return 0
        fi
    fi
    
    # Fallback: try to get from Docker container
    if ssh -o ConnectTimeout=10 -o BatchMode=yes "$PROD_USER@$PROD_SERVER" "docker-compose -f ~/docker-compose.yml exec -T app env" &> "$env_file" 2>/dev/null; then
        # Filter and format the output
        grep -E '^[A-Z_]+=.*' "$env_file" > "${env_file}.tmp" && mv "${env_file}.tmp" "$env_file"
        log_success "Production environment retrieved from Docker container"
        echo "$env_file"
        return 0
    fi
    
    log_warning "Could not retrieve production environment, using local .env.production"
    if [[ -f "$PROD_ENV_FILE" ]]; then
        cp "$PROD_ENV_FILE" "$env_file"
        echo "$env_file"
        return 0
    fi
    
    return 1
}

# Function to compare database schemas
compare_database_schemas() {
    local local_db_url="$1"
    local prod_db_url="$2"
    
    log_info "Comparing database schemas..."
    
    # Extract connection details for both databases
    local local_host=$(echo "$local_db_url" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    local local_port=$(echo "$local_db_url" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    local local_user=$(echo "$local_db_url" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    local local_password=$(echo "$local_db_url" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    local local_database=$(echo "$local_db_url" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    
    local prod_host=$(echo "$prod_db_url" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    local prod_port=$(echo "$prod_db_url" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    local prod_user=$(echo "$prod_db_url" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    local prod_password=$(echo "$prod_db_url" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    local prod_database=$(echo "$prod_db_url" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    
    if command -v psql &> /dev/null; then
        # Get table structures
        local local_schema="$TEMP_DIR/local_schema.sql"
        local prod_schema="$TEMP_DIR/prod_schema.sql"
        
        # Get local schema
        PGPASSWORD="$local_password" pg_dump -h "$local_host" -p "$local_port" -U "$local_user" -d "$local_database" --schema-only --no-owner --no-privileges > "$local_schema" 2>/dev/null || {
            log_warning "Could not retrieve local database schema"
            return 1
        }
        
        # Get production schema via SSH tunnel or direct connection
        if [[ "$prod_host" == "postgres" ]] || [[ "$prod_host" == "localhost" ]] || [[ "$prod_host" == "127.0.0.1" ]]; then
            # Production database is in Docker, need SSH tunnel
            log_info "Using SSH tunnel to access production database..."
            ssh -L 15432:localhost:5432 "$PROD_USER@$PROD_SERVER" -N &
            SSH_PID=$!
            sleep 2
            
            PGPASSWORD="$prod_password" pg_dump -h localhost -p 15432 -U "$prod_user" -d "$prod_database" --schema-only --no-owner --no-privileges > "$prod_schema" 2>/dev/null || {
                kill $SSH_PID 2>/dev/null
                log_warning "Could not retrieve production database schema via SSH tunnel"
                return 1
            }
            
            kill $SSH_PID 2>/dev/null
        else
            # Direct connection to production database
            PGPASSWORD="$prod_password" pg_dump -h "$prod_host" -p "$prod_port" -U "$prod_user" -d "$prod_database" --schema-only --no-owner --no-privileges > "$prod_schema" 2>/dev/null || {
                log_warning "Could not retrieve production database schema"
                return 1
            }
        fi
        
        # Compare schemas
        if diff -q "$local_schema" "$prod_schema" >/dev/null 2>&1; then
            log_success "Database schemas match"
        else
            log_warning "Database schemas differ"
            log_info "Schema differences:"
            diff "$local_schema" "$prod_schema" | head -20 || true
        fi
    else
        log_warning "psql not available, skipping database schema comparison"
    fi
}

# Function to check migration status
check_migration_status() {
    log_info "Checking database migration status..."
    
    # Count migration files
    local migration_count=0
    if [[ -d "$PROJECT_ROOT/database/migrations" ]]; then
        migration_count=$(find "$PROJECT_ROOT/database/migrations" -name "*.sql" | wc -l)
        log_info "Found $migration_count migration files in local repository"
        
        # List recent migrations
        if [[ $migration_count -gt 0 ]]; then
            log_info "Recent migration files:"
            find "$PROJECT_ROOT/database/migrations" -name "*.sql" -printf "%f\n" | sort | tail -5 | while read -r migration; do
                echo "  - $migration"
            done
        fi
    else
        log_warning "No migrations directory found"
    fi
}

# Function to validate user data integrity
validate_user_data() {
    local db_url="$1"
    local label="$2"
    
    if [[ -n "$db_url" ]] && command -v psql &> /dev/null; then
        log_info "Validating user data integrity for $label database..."
        
        # Extract connection details
        local host=$(echo "$db_url" | sed -n 's/.*@\([^:]*\):.*/\1/p')
        local port=$(echo "$db_url" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        local user=$(echo "$db_url" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
        local password=$(echo "$db_url" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
        local database=$(echo "$db_url" | sed -n 's/.*\/\([^?]*\).*/\1/p')
        
        # Handle SSH tunnel for Docker database
        local actual_host="$host"
        local actual_port="$port"
        local ssh_pid=""
        
        if [[ "$host" == "postgres" ]] || [[ "$host" == "localhost" ]] || [[ "$host" == "127.0.0.1" ]]; then
            if [[ "$label" == "production" ]]; then
                log_info "Creating SSH tunnel for production database access..."
                ssh -L 15433:localhost:5432 "$PROD_USER@$PROD_SERVER" -N &
                ssh_pid=$!
                sleep 2
                actual_host="localhost"
                actual_port="15433"
            fi
        fi
        
        # Check basic user data
        local user_count=$(PGPASSWORD="$password" psql -h "$actual_host" -p "$actual_port" -U "$user" -d "$database" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")
        local active_user_count=$(PGPASSWORD="$password" psql -h "$actual_host" -p "$actual_port" -U "$user" -d "$database" -t -c "SELECT COUNT(*) FROM users WHERE status = 'active';" 2>/dev/null | tr -d ' ' || echo "0")
        
        if [[ "$ssh_pid" != "" ]]; then
            kill "$ssh_pid" 2>/dev/null || true
        fi
        
        if [[ "$user_count" -gt 0 ]]; then
            log_success "$label database has $user_count users ($active_user_count active)"
        else
            log_warning "$label database appears to have no users"
        fi
    else
        log_warning "Cannot validate user data for $label database"
    fi
}

# Main validation function
main() {
    echo -e "${BLUE}==========================================
TME Portal Environment Validation
==========================================${NC}"
    
    echo -e "\n${BLUE}1. ENVIRONMENT FILES CHECK${NC}"
    echo "=============================="
    
    # Check local environment files
    if [[ -f "$LOCAL_ENV_FILE" ]]; then
        log_success "Local environment file found: $LOCAL_ENV_FILE"
    else
        log_warning "Local environment file not found: $LOCAL_ENV_FILE"
    fi
    
    if [[ -f "$PROD_ENV_FILE" ]]; then
        log_success "Production environment file found: $PROD_ENV_FILE"
    else
        log_error "Production environment file not found: $PROD_ENV_FILE"
    fi
    
    echo -e "\n${BLUE}2. PRODUCTION SERVER ACCESS${NC}"
    echo "============================="
    
    # Test SSH connection to production server
    log_info "Testing SSH connection to production server..."
    if ssh -o ConnectTimeout=10 -o BatchMode=yes "$PROD_USER@$PROD_SERVER" "echo 'SSH connection successful'" &>/dev/null; then
        log_success "SSH connection to production server successful"
    else
        log_warning "SSH connection to production server failed (will use local .env.production)"
    fi
    
    # Get production environment
    PROD_ENV_ACTUAL="$PROD_ENV_FILE"
    if PROD_ENV_RETRIEVED=$(get_production_env); then
        PROD_ENV_ACTUAL="$PROD_ENV_RETRIEVED"
    fi
    
    echo -e "\n${BLUE}3. ENVIRONMENT VARIABLES COMPARISON${NC}"
    echo "====================================="
    
    # Define critical environment variables to check
    CRITICAL_VARS=("NODE_ENV" "DATABASE_URL" "REDIS_URL" "NEXTAUTH_SECRET" "POSTGRES_PASSWORD" "REDIS_PASSWORD")
    
    for var in "${CRITICAL_VARS[@]}"; do
        local_val=$(get_env_var "$LOCAL_ENV_FILE" "$var")
        prod_val=$(get_env_var "$PROD_ENV_ACTUAL" "$var")
        
        if [[ -n "$local_val" ]] && [[ -n "$prod_val" ]]; then
            if [[ "$var" == *"PASSWORD"* ]] || [[ "$var" == *"SECRET"* ]] || [[ "$var" == *"KEY"* ]]; then
                # Don't show sensitive values, just check they exist and differ
                if [[ "$local_val" != "$prod_val" ]]; then
                    log_success "$var: Different values (expected for security)"
                else
                    log_warning "$var: Same value in local and production (security risk)"
                fi
            else
                if [[ "$local_val" == "$prod_val" ]]; then
                    log_success "$var: Values match"
                else
                    log_warning "$var: Values differ (Local: $local_val, Prod: $prod_val)"
                fi
            fi
        elif [[ -n "$prod_val" ]]; then
            log_warning "$var: Missing in local environment"
        elif [[ -n "$local_val" ]]; then
            log_warning "$var: Missing in production environment"
        else
            log_error "$var: Missing in both environments"
        fi
    done
    
    echo -e "\n${BLUE}4. DATABASE CONNECTION VALIDATION${NC}"
    echo "=================================="
    
    # Get database URLs
    LOCAL_DB_URL=$(get_env_var "$LOCAL_ENV_FILE" "DATABASE_URL")
    PROD_DB_URL=$(get_env_var "$PROD_ENV_ACTUAL" "DATABASE_URL")
    
    # Validate connections
    if [[ -n "$LOCAL_DB_URL" ]]; then
        validate_db_connection "$LOCAL_DB_URL" "Local"
        validate_user_data "$LOCAL_DB_URL" "local"
    fi
    
    if [[ -n "$PROD_DB_URL" ]]; then
        validate_db_connection "$PROD_DB_URL" "Production"
        validate_user_data "$PROD_DB_URL" "production"
    fi
    
    # Compare schemas if both databases are accessible
    if [[ -n "$LOCAL_DB_URL" ]] && [[ -n "$PROD_DB_URL" ]]; then
        compare_database_schemas "$LOCAL_DB_URL" "$PROD_DB_URL"
    fi
    
    echo -e "\n${BLUE}5. REDIS CONNECTION VALIDATION${NC}"
    echo "==============================="
    
    # Get Redis URLs
    LOCAL_REDIS_URL=$(get_env_var "$LOCAL_ENV_FILE" "REDIS_URL")
    PROD_REDIS_URL=$(get_env_var "$PROD_ENV_ACTUAL" "REDIS_URL")
    
    # Validate connections
    if [[ -n "$LOCAL_REDIS_URL" ]]; then
        validate_redis_connection "$LOCAL_REDIS_URL" "Local"
    fi
    
    if [[ -n "$PROD_REDIS_URL" ]]; then
        validate_redis_connection "$PROD_REDIS_URL" "Production"
    fi
    
    echo -e "\n${BLUE}6. DATABASE MIGRATION STATUS${NC}"
    echo "============================="
    
    check_migration_status
    
    echo -e "\n${BLUE}7. CONFIGURATION CONSISTENCY${NC}"
    echo "=============================="
    
    # Check Docker Compose configuration
    if [[ -f "$PROJECT_ROOT/docker-compose.yml" ]]; then
        log_success "Docker Compose file found"
        
        # Validate Docker Compose syntax
        if docker-compose -f "$PROJECT_ROOT/docker-compose.yml" config >/dev/null 2>&1; then
            log_success "Docker Compose file syntax is valid"
        else
            log_error "Docker Compose file has syntax errors"
        fi
    else
        log_error "Docker Compose file not found"
    fi
    
    # Check if all required secrets exist
    REQUIRED_SECRETS=("POSTGRES_PASSWORD" "REDIS_PASSWORD" "NEXTAUTH_SECRET")
    for secret in "${REQUIRED_SECRETS[@]}"; do
        prod_val=$(get_env_var "$PROD_ENV_ACTUAL" "$secret")
        if [[ -n "$prod_val" ]] && [[ ${#prod_val} -ge 16 ]]; then
            log_success "$secret: Adequate length (${#prod_val} characters)"
        elif [[ -n "$prod_val" ]]; then
            log_warning "$secret: May be too short (${#prod_val} characters)"
        else
            log_error "$secret: Missing from production environment"
        fi
    done
    
    echo -e "\n${BLUE}8. FINAL SUMMARY${NC}"
    echo "=================="
    
    echo "Checks passed: $CHECKS_PASSED"
    echo "Checks failed: $CHECKS_FAILED"
    echo "Warnings: $WARNINGS"
    
    if [[ $CHECKS_FAILED -eq 0 ]]; then
        echo -e "\n${GREEN}✓ ENVIRONMENT VALIDATION PASSED${NC}"
        echo -e "Local and production environments are sufficiently synchronized."
        
        if [[ $WARNINGS -gt 0 ]]; then
            echo -e "${YELLOW}⚠ Please review the $WARNINGS warning(s) above.${NC}"
        fi
        
        exit 0
    else
        echo -e "\n${RED}✗ ENVIRONMENT VALIDATION FAILED${NC}"
        echo -e "Please resolve the $CHECKS_FAILED error(s) before deployment."
        exit 1
    fi
}

# Command line options
case "${1:-}" in
    --help)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Validates environment synchronization between local and production."
        echo ""
        echo "Options:"
        echo "  --help    Show this help message"
        echo ""
        echo "Environment variables:"
        echo "  PROD_SERVER    Production server IP (default: 192.168.97.149)"
        echo "  PROD_USER      Production server user (default: tme-user)"
        echo ""
        exit 0
        ;;
esac

# Run main function
main "$@"