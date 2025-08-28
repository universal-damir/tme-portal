#!/bin/bash

# TME Portal Health Check Script
# Comprehensive system health validation for production deployment
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

# Target configuration
TARGET="${TARGET:-production}"
PROD_SERVER="${PROD_SERVER:-192.168.97.149}"
PROD_USER="${PROD_USER:-tme-user}"

# Service configuration
APP_PORT="${APP_PORT:-80}"
DB_PORT="${DB_PORT:-5434}"
REDIS_PORT="${REDIS_PORT:-6379}"

# Docker configuration
DOCKER_COMPOSE_PROJECT="${DOCKER_COMPOSE_PROJECT:-tme-portal}"
APP_CONTAINER_NAME="${DOCKER_COMPOSE_PROJECT}-app-1"
DB_CONTAINER_NAME="${DOCKER_COMPOSE_PROJECT}-postgres-1"
REDIS_CONTAINER_NAME="${DOCKER_COMPOSE_PROJECT}-redis-1"

# Health check configuration
TIMEOUT_SECONDS=${TIMEOUT_SECONDS:-30}
RETRY_COUNT=${RETRY_COUNT:-3}
RETRY_DELAY=${RETRY_DELAY:-5}

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

# Function to execute command with timeout
execute_with_timeout() {
    local timeout="$1"
    local command="$2"
    local description="$3"
    
    log_info "$description"
    
    if timeout "$timeout" bash -c "$command" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to execute remote command
remote_exec() {
    local command="$1"
    local description="$2"
    local timeout="${3:-10}"
    
    if [[ "$TARGET" == "local" ]]; then
        # Execute locally
        if timeout "$timeout" bash -c "$command" > /dev/null 2>&1; then
            return 0
        else
            return 1
        fi
    else
        # Execute on remote server
        if timeout "$timeout" ssh -o ConnectTimeout=5 -o BatchMode=yes "$PROD_USER@$PROD_SERVER" "$command" > /dev/null 2>&1; then
            return 0
        else
            return 1
        fi
    fi
}

# Function to check HTTP endpoint
check_http_endpoint() {
    local url="$1"
    local description="$2"
    local expected_status="${3:-200}"
    local timeout="${4:-10}"
    
    log_info "Checking $description: $url"
    
    for attempt in $(seq 1 $RETRY_COUNT); do
        local status_code
        
        if [[ "$TARGET" == "local" ]]; then
            status_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout "$timeout" "$url" 2>/dev/null || echo "000")
        else
            status_code=$(remote_exec "curl -s -o /dev/null -w '%{http_code}' --connect-timeout $timeout $url" "HTTP check" "$timeout" | tail -1 || echo "000")
        fi
        
        if [[ "$status_code" == "$expected_status" ]]; then
            log_success "$description is healthy (HTTP $status_code)"
            return 0
        elif [[ "$status_code" == "000" ]]; then
            log_info "Connection failed, attempt $attempt/$RETRY_COUNT"
        else
            log_info "Unexpected status code: $status_code, attempt $attempt/$RETRY_COUNT"
        fi
        
        if [[ $attempt -lt $RETRY_COUNT ]]; then
            sleep $RETRY_DELAY
        fi
    done
    
    log_error "$description health check failed"
    return 1
}

# Function to check Docker container status
check_container_status() {
    local container_name="$1"
    local description="$2"
    
    log_info "Checking $description container: $container_name"
    
    if remote_exec "docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -E '^$container_name\s+Up'" "Container status check"; then
        log_success "$description container is running"
        
        # Get additional container info
        local container_info
        if [[ "$TARGET" == "local" ]]; then
            container_info=$(docker inspect "$container_name" --format='{{.State.Status}} since {{.State.StartedAt}}' 2>/dev/null || echo "unknown")
        else
            container_info=$(ssh -o ConnectTimeout=5 "$PROD_USER@$PROD_SERVER" "docker inspect $container_name --format='{{.State.Status}} since {{.State.StartedAt}}'" 2>/dev/null || echo "unknown")
        fi
        
        log_info "$description container status: $container_info"
        return 0
    else
        log_error "$description container is not running or not found"
        return 1
    fi
}

# Function to check database connectivity
check_database() {
    local host="$1"
    local port="$2"
    local description="$3"
    
    log_info "Checking $description database connectivity ($host:$port)"
    
    if remote_exec "nc -z $host $port" "Database connection check"; then
        log_success "$description database port is accessible"
        
        # Test actual database connection if possible
        if remote_exec "docker exec $DB_CONTAINER_NAME pg_isready -U tme_user -d tme_portal" "Database readiness check"; then
            log_success "$description database is ready"
            
            # Test simple query
            if remote_exec "docker exec $DB_CONTAINER_NAME psql -U tme_user -d tme_portal -c 'SELECT 1;' > /dev/null" "Database query test"; then
                log_success "$description database query test passed"
            else
                log_warning "$description database query test failed"
            fi
            
            return 0
        else
            log_error "$description database is not ready"
            return 1
        fi
    else
        log_error "$description database port is not accessible"
        return 1
    fi
}

# Function to check Redis connectivity
check_redis() {
    local host="$1"
    local port="$2"
    local description="$3"
    
    log_info "Checking $description Redis connectivity ($host:$port)"
    
    if remote_exec "nc -z $host $port" "Redis connection check"; then
        log_success "$description Redis port is accessible"
        
        # Test Redis ping
        if remote_exec "docker exec $REDIS_CONTAINER_NAME redis-cli ping" "Redis ping test"; then
            log_success "$description Redis is responding"
            return 0
        else
            log_error "$description Redis is not responding"
            return 1
        fi
    else
        log_error "$description Redis port is not accessible"
        return 1
    fi
}

# Function to check system resources
check_system_resources() {
    log_info "Checking system resources..."
    
    # Check disk space
    local disk_usage
    if [[ "$TARGET" == "local" ]]; then
        disk_usage=$(df "$PROJECT_ROOT" | awk 'NR==2 {print $5}' | sed 's/%//')
    else
        disk_usage=$(ssh -o ConnectTimeout=5 "$PROD_USER@$PROD_SERVER" "df ~ | awk 'NR==2 {print \$5}' | sed 's/%//'" 2>/dev/null || echo "unknown")
    fi
    
    if [[ "$disk_usage" != "unknown" ]] && [[ $disk_usage -lt 90 ]]; then
        log_success "Disk usage is acceptable ($disk_usage%)"
    elif [[ "$disk_usage" != "unknown" ]] && [[ $disk_usage -lt 95 ]]; then
        log_warning "Disk usage is high ($disk_usage%)"
    elif [[ "$disk_usage" != "unknown" ]]; then
        log_error "Disk usage is critical ($disk_usage%)"
    else
        log_warning "Could not check disk usage"
    fi
    
    # Check memory usage
    local memory_info
    if [[ "$TARGET" == "local" ]]; then
        memory_info=$(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2}' 2>/dev/null || echo "unknown")
    else
        memory_info=$(ssh -o ConnectTimeout=5 "$PROD_USER@$PROD_SERVER" "free -m | awk 'NR==2{printf \"%.1f%%\", \$3*100/\$2}'" 2>/dev/null || echo "unknown")
    fi
    
    if [[ "$memory_info" != "unknown" ]]; then
        log_info "Memory usage: $memory_info"
        local memory_percent=$(echo "$memory_info" | sed 's/%//')
        if (( $(echo "$memory_percent < 80" | bc -l) )); then
            log_success "Memory usage is acceptable"
        elif (( $(echo "$memory_percent < 90" | bc -l) )); then
            log_warning "Memory usage is high"
        else
            log_error "Memory usage is critical"
        fi
    else
        log_warning "Could not check memory usage"
    fi
    
    # Check load average
    local load_average
    if [[ "$TARGET" == "local" ]]; then
        load_average=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//' 2>/dev/null || echo "unknown")
    else
        load_average=$(ssh -o ConnectTimeout=5 "$PROD_USER@$PROD_SERVER" "uptime | awk -F'load average:' '{print \$2}' | awk '{print \$1}' | sed 's/,//'" 2>/dev/null || echo "unknown")
    fi
    
    if [[ "$load_average" != "unknown" ]]; then
        log_info "Load average: $load_average"
        if (( $(echo "$load_average < 2.0" | bc -l) )); then
            log_success "System load is acceptable"
        elif (( $(echo "$load_average < 5.0" | bc -l) )); then
            log_warning "System load is high"
        else
            log_error "System load is critical"
        fi
    else
        log_warning "Could not check system load"
    fi
}

# Function to check application logs for errors
check_application_logs() {
    log_info "Checking application logs for errors..."
    
    # Check for recent error logs in application
    local error_count
    if remote_exec "docker logs --since '5m' $APP_CONTAINER_NAME 2>&1 | grep -i error | wc -l" "Application error check"; then
        if [[ "$TARGET" == "local" ]]; then
            error_count=$(docker logs --since '5m' "$APP_CONTAINER_NAME" 2>&1 | grep -i error | wc -l)
        else
            error_count=$(ssh -o ConnectTimeout=5 "$PROD_USER@$PROD_SERVER" "docker logs --since '5m' $APP_CONTAINER_NAME 2>&1 | grep -i error | wc -l" 2>/dev/null || echo "unknown")
        fi
        
        if [[ "$error_count" == "0" ]]; then
            log_success "No recent errors in application logs"
        elif [[ "$error_count" != "unknown" ]] && [[ $error_count -lt 5 ]]; then
            log_warning "Found $error_count error(s) in recent application logs"
        elif [[ "$error_count" != "unknown" ]]; then
            log_error "Found $error_count error(s) in recent application logs"
        else
            log_warning "Could not check application logs"
        fi
    else
        log_warning "Could not access application logs"
    fi
    
    # Check database logs for errors
    local db_error_count
    if remote_exec "docker logs --since '5m' $DB_CONTAINER_NAME 2>&1 | grep -i error | wc -l" "Database error check"; then
        if [[ "$TARGET" == "local" ]]; then
            db_error_count=$(docker logs --since '5m' "$DB_CONTAINER_NAME" 2>&1 | grep -i error | wc -l)
        else
            db_error_count=$(ssh -o ConnectTimeout=5 "$PROD_USER@$PROD_SERVER" "docker logs --since '5m' $DB_CONTAINER_NAME 2>&1 | grep -i error | wc -l" 2>/dev/null || echo "unknown")
        fi
        
        if [[ "$db_error_count" == "0" ]]; then
            log_success "No recent errors in database logs"
        elif [[ "$db_error_count" != "unknown" ]] && [[ $db_error_count -lt 3 ]]; then
            log_warning "Found $db_error_count error(s) in recent database logs"
        elif [[ "$db_error_count" != "unknown" ]]; then
            log_error "Found $db_error_count error(s) in recent database logs"
        else
            log_warning "Could not check database logs"
        fi
    else
        log_warning "Could not access database logs"
    fi
}

# Function to check SSL/TLS configuration
check_ssl_configuration() {
    if [[ "$TARGET" == "local" ]]; then
        log_info "Skipping SSL check for local environment"
        return 0
    fi
    
    log_info "Checking SSL/TLS configuration..."
    
    # Note: Since production is on local network without SSL cert, this is informational
    local app_url="http://$PROD_SERVER"
    
    # Check if HTTPS is configured
    if check_http_endpoint "https://$PROD_SERVER/api/health" "HTTPS endpoint"; then
        log_success "HTTPS endpoint is accessible"
        
        # Check SSL certificate if available
        local ssl_info
        ssl_info=$(ssh -o ConnectTimeout=5 "$PROD_USER@$PROD_SERVER" "echo | openssl s_client -servername $PROD_SERVER -connect $PROD_SERVER:443 2>/dev/null | openssl x509 -noout -dates" 2>/dev/null || echo "No SSL certificate")
        log_info "SSL certificate info: $ssl_info"
        
    else
        log_info "HTTPS not configured (using HTTP for local network deployment)"
        
        # For local network deployment, HTTP is acceptable
        if check_http_endpoint "$app_url/api/health" "HTTP endpoint"; then
            log_success "HTTP endpoint is accessible"
        else
            log_error "HTTP endpoint is not accessible"
        fi
    fi
}

# Function to perform comprehensive health check
perform_comprehensive_check() {
    local app_url base_url
    
    if [[ "$TARGET" == "local" ]]; then
        # For local testing, might still use port 3000
        base_url="http://localhost:3000"
        app_url="$base_url"
    else
        # Production uses port 80 (mapped from container port 3000)
        base_url="http://$PROD_SERVER"
        app_url="$base_url"
    fi
    
    echo -e "\n${BLUE}1. DOCKER CONTAINERS${NC}"
    echo "===================="
    
    check_container_status "$APP_CONTAINER_NAME" "Application"
    check_container_status "$DB_CONTAINER_NAME" "Database"
    check_container_status "$REDIS_CONTAINER_NAME" "Redis"
    
    echo -e "\n${BLUE}2. NETWORK CONNECTIVITY${NC}"
    echo "========================"
    
    if [[ "$TARGET" == "local" ]]; then
        check_database "localhost" "$DB_PORT" "Local"
        check_redis "localhost" "$REDIS_PORT" "Local"
    else
        check_database "$PROD_SERVER" "$DB_PORT" "Production"
        check_redis "$PROD_SERVER" "$REDIS_PORT" "Production"
    fi
    
    echo -e "\n${BLUE}3. APPLICATION ENDPOINTS${NC}"
    echo "========================="
    
    # Check health endpoint
    check_http_endpoint "$app_url/api/health" "Health endpoint"
    
    # Check API endpoints
    check_http_endpoint "$app_url/api/auth/session" "Session endpoint" "401"  # Should return 401 without auth
    
    # Check main application page
    check_http_endpoint "$app_url" "Main application"
    
    echo -e "\n${BLUE}4. SYSTEM RESOURCES${NC}"
    echo "===================="
    
    check_system_resources
    
    echo -e "\n${BLUE}5. APPLICATION LOGS${NC}"
    echo "==================="
    
    check_application_logs
    
    echo -e "\n${BLUE}6. SSL/TLS CONFIGURATION${NC}"
    echo "========================"
    
    check_ssl_configuration
    
    echo -e "\n${BLUE}7. ADDITIONAL CHECKS${NC}"
    echo "===================="
    
    # Check if backup system is working
    if remote_exec "test -d ~/backups && find ~/backups -name '*.tar.gz' | head -1" "Backup system check"; then
        log_success "Backup system appears to be configured"
    else
        log_warning "Backup system may not be properly configured"
    fi
    
    # Check if necessary scripts are present and executable
    local scripts=("backup.sh" "pre-deployment-check.sh" "health-check.sh")
    for script in "${scripts[@]}"; do
        if remote_exec "test -x ~/scripts/$script" "Script check: $script"; then
            log_success "Script is present and executable: $script"
        else
            log_warning "Script missing or not executable: $script"
        fi
    done
    
    # Check environment configuration
    if remote_exec "test -f ~/.env.production" "Environment file check"; then
        log_success "Production environment file is present"
    else
        log_warning "Production environment file may be missing"
    fi
}

# Main function
main() {
    echo -e "${BLUE}==========================================
TME Portal Health Check
Target: $TARGET
==========================================${NC}"
    
    # Determine target based on arguments
    case "${1:-}" in
        local)
            TARGET="local"
            log_info "Checking local environment"
            ;;
        production|prod)
            TARGET="production"
            log_info "Checking production environment: $PROD_USER@$PROD_SERVER"
            ;;
        --help)
            echo "Usage: $0 [TARGET] [OPTIONS]"
            echo ""
            echo "Targets:"
            echo "  local        Check local development environment"
            echo "  production   Check production environment (default)"
            echo ""
            echo "Environment variables:"
            echo "  PROD_SERVER     Production server IP (default: 192.168.97.149)"
            echo "  PROD_USER       Production server user (default: tme-user)"
            echo "  APP_PORT        Application port (default: 3000)"
            echo "  DB_PORT         Database port (default: 5434)"
            echo "  TIMEOUT_SECONDS Health check timeout (default: 30)"
            echo ""
            exit 0
            ;;
        *)
            if [[ -n "$1" ]]; then
                log_warning "Unknown target '$1', using production"
            fi
            TARGET="production"
            ;;
    esac
    
    # Test connectivity to target
    if [[ "$TARGET" == "production" ]]; then
        log_info "Testing SSH connectivity to production server..."
        if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "$PROD_USER@$PROD_SERVER" "echo 'SSH test successful'" > /dev/null 2>&1; then
            log_error "Cannot connect to production server: $PROD_USER@$PROD_SERVER"
            log_error "Please check:"
            echo "  - SSH key is configured"
            echo "  - Production server is accessible"
            echo "  - Network connectivity"
            exit 1
        fi
        log_success "SSH connectivity to production server established"
    fi
    
    # Perform comprehensive health check
    perform_comprehensive_check
    
    # Final summary
    echo -e "\n${BLUE}HEALTH CHECK SUMMARY${NC}"
    echo "===================="
    echo "Checks passed: $CHECKS_PASSED"
    echo "Checks failed: $CHECKS_FAILED"
    echo "Warnings: $WARNINGS"
    
    if [[ $CHECKS_FAILED -eq 0 ]]; then
        echo -e "\n${GREEN}✅ HEALTH CHECK PASSED${NC}"
        echo -e "All critical systems are healthy and operational."
        
        if [[ $WARNINGS -gt 0 ]]; then
            echo -e "${YELLOW}⚠️  However, please review the $WARNINGS warning(s) above.${NC}"
        fi
        
        echo -e "\n${BLUE}System is ready for production use.${NC}"
        exit 0
    else
        echo -e "\n${RED}❌ HEALTH CHECK FAILED${NC}"
        echo -e "Critical issues detected. Please resolve the $CHECKS_FAILED error(s) before proceeding."
        
        if [[ $CHECKS_FAILED -gt 5 ]]; then
            echo -e "\n${RED}Multiple critical failures detected. Consider:${NC}"
            echo "  1. Rolling back to previous version"
            echo "  2. Running full system diagnostics"
            echo "  3. Checking system logs for detailed error information"
        fi
        
        exit 1
    fi
}

# Check dependencies
if ! command -v curl &> /dev/null; then
    log_error "curl is required but not installed"
    exit 1
fi

if ! command -v nc &> /dev/null; then
    log_error "netcat (nc) is required but not installed"
    exit 1
fi

if [[ "$TARGET" != "local" ]] && ! command -v ssh &> /dev/null; then
    log_error "ssh is required for production health checks but not installed"
    exit 1
fi

# Run main function
main "$@"