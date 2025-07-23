#!/bin/bash

# TME Portal Security Audit Script
# This script performs comprehensive security checks on the application

set -e

echo "🔒 TME Portal Security Audit Starting..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    case $2 in
        "PASS") echo -e "${GREEN}✓${NC} $1" ;;
        "FAIL") echo -e "${RED}✗${NC} $1" ;;
        "WARN") echo -e "${YELLOW}⚠${NC} $1" ;;
        "INFO") echo -e "${BLUE}ℹ${NC} $1" ;;
    esac
}

# Check if required commands exist
check_dependencies() {
    echo -e "\n${BLUE}Checking Dependencies...${NC}"
    
    commands=("docker" "npm" "git")
    for cmd in "${commands[@]}"; do
        if command -v $cmd &> /dev/null; then
            print_status "$cmd is installed" "PASS"
        else
            print_status "$cmd is not installed" "FAIL"
            exit 1
        fi
    done
}

# Check Docker security
check_docker_security() {
    echo -e "\n${BLUE}Checking Docker Security...${NC}"
    
    # Check if Dockerfile uses non-root user
    if grep -q "USER nextjs" Dockerfile; then
        print_status "Dockerfile uses non-root user" "PASS"
    else
        print_status "Dockerfile should use non-root user" "FAIL"
    fi
    
    # Check for security updates in Dockerfile
    if grep -q "apk update && apk upgrade" Dockerfile; then
        print_status "Dockerfile includes security updates" "PASS"
    else
        print_status "Dockerfile should include security updates" "WARN"
    fi
    
    # Check for health checks
    if grep -q "HEALTHCHECK" Dockerfile; then
        print_status "Dockerfile includes health check" "PASS"
    else
        print_status "Dockerfile should include health check" "WARN"
    fi
    
    # Check docker-compose security
    if grep -q "restart: unless-stopped" docker-compose.yml; then
        print_status "Docker Compose has proper restart policy" "PASS"
    else
        print_status "Docker Compose should have restart policy" "WARN"
    fi
}

# Check environment security
check_environment_security() {
    echo -e "\n${BLUE}Checking Environment Security...${NC}"
    
    # Check for .env files in git
    if git ls-files | grep -E "\.env$" > /dev/null; then
        print_status ".env files should not be committed to git" "FAIL"
    else
        print_status "No .env files found in git" "PASS"
    fi
    
    # Check for hardcoded secrets in code
    if grep -r -i "password.*=" --include="*.ts" --include="*.js" src/ | grep -v "hashed_password" | grep -v "password:" | head -1 > /dev/null; then
        print_status "Potential hardcoded passwords found" "WARN"
    else
        print_status "No obvious hardcoded passwords found" "PASS"
    fi
    
    # Check for API keys in code
    if grep -r -E "(api_key|apikey|secret_key)" --include="*.ts" --include="*.js" src/ | grep -v "process.env" | head -1 > /dev/null; then
        print_status "Potential hardcoded API keys found" "WARN"
    else
        print_status "No obvious hardcoded API keys found" "PASS"
    fi
}

# Check dependency security
check_dependency_security() {
    echo -e "\n${BLUE}Checking Dependency Security...${NC}"
    
    # Run npm audit
    if npm audit --audit-level=moderate > /dev/null 2>&1; then
        print_status "No high/critical npm vulnerabilities found" "PASS"
    else
        print_status "npm audit found vulnerabilities (run 'npm audit' for details)" "WARN"
    fi
    
    # Check for known vulnerable packages
    vulnerable_packages=("lodash@<4.17.21" "moment@<2.29.2" "axios@<0.21.2")
    for package in "${vulnerable_packages[@]}"; do
        if npm ls "$package" &> /dev/null; then
            print_status "Vulnerable package found: $package" "FAIL"
        fi
    done
}

# Check code security patterns
check_code_security() {
    echo -e "\n${BLUE}Checking Code Security Patterns...${NC}"
    
    # Check for SQL injection patterns
    if grep -r -E "(query|execute).*\+.*\$" --include="*.ts" src/ > /dev/null; then
        print_status "Potential SQL injection vulnerability found" "FAIL"
    else
        print_status "No obvious SQL injection patterns found" "PASS"
    fi
    
    # Check for XSS vulnerabilities
    if grep -r "dangerouslySetInnerHTML" --include="*.tsx" --include="*.jsx" src/ > /dev/null; then
        print_status "dangerouslySetInnerHTML usage found - review for XSS" "WARN"
    else
        print_status "No dangerouslySetInnerHTML usage found" "PASS"
    fi
    
    # Check for eval usage
    if grep -r -E "\beval\(" --include="*.ts" --include="*.js" src/ > /dev/null; then
        print_status "eval() usage found - potential security risk" "FAIL"
    else
        print_status "No eval() usage found" "PASS"
    fi
    
    # Check for console.log in production code
    if grep -r "console\.log" --include="*.ts" --include="*.js" src/ | grep -v "test" | grep -v "spec" > /dev/null; then
        print_status "console.log statements found - may leak sensitive data" "WARN"
    else
        print_status "No console.log statements in production code" "PASS"
    fi
}

# Check authentication security
check_auth_security() {
    echo -e "\n${BLUE}Checking Authentication Security...${NC}"
    
    # Check for password hashing
    if grep -r "bcrypt" --include="*.ts" src/ > /dev/null; then
        print_status "Password hashing implemented" "PASS"
    else
        print_status "Password hashing not found" "FAIL"
    fi
    
    # Check for session management
    if grep -r "session" --include="*.ts" src/ > /dev/null; then
        print_status "Session management implemented" "PASS"
    else
        print_status "Session management not found" "FAIL"
    fi
    
    # Check for rate limiting
    if grep -r "rateLimit" --include="*.ts" src/ > /dev/null; then
        print_status "Rate limiting implemented" "PASS"
    else
        print_status "Rate limiting not found" "WARN"
    fi
    
    # Check for CSRF protection
    if grep -r -i "csrf" --include="*.ts" src/ > /dev/null; then
        print_status "CSRF protection implemented" "PASS"
    else
        print_status "CSRF protection not found" "WARN"
    fi
}

# Check security headers
check_security_headers() {
    echo -e "\n${BLUE}Checking Security Headers...${NC}"
    
    # Check for security headers in middleware
    security_headers=("X-Content-Type-Options" "X-Frame-Options" "X-XSS-Protection" "Strict-Transport-Security")
    for header in "${security_headers[@]}"; do
        if grep -r "$header" --include="*.ts" src/ > /dev/null; then
            print_status "$header header configured" "PASS"
        else
            print_status "$header header not found" "WARN"
        fi
    done
    
    # Check for CSP
    if grep -r "Content-Security-Policy" --include="*.ts" src/ > /dev/null; then
        print_status "Content Security Policy configured" "PASS"
    else
        print_status "Content Security Policy not found" "WARN"
    fi
}

# Check file permissions
check_file_permissions() {
    echo -e "\n${BLUE}Checking File Permissions...${NC}"
    
    # Check for world-writable files
    if find . -type f -perm -002 -not -path "./node_modules/*" -not -path "./.git/*" | head -1 > /dev/null; then
        print_status "World-writable files found" "WARN"
    else
        print_status "No world-writable files found" "PASS"
    fi
    
    # Check for executable files that shouldn't be
    if find src/ -name "*.ts" -perm -111 | head -1 > /dev/null; then
        print_status "Executable TypeScript files found" "WARN"
    else
        print_status "No executable source files found" "PASS"
    fi
}

# Check database security
check_database_security() {
    echo -e "\n${BLUE}Checking Database Security...${NC}"
    
    # Check for parameterized queries
    if grep -r "\$[0-9]" --include="*.ts" src/ > /dev/null; then
        print_status "Parameterized queries used" "PASS"
    else
        print_status "Parameterized queries not found" "WARN"
    fi
    
    # Check for database connection security
    if grep -r "ssl.*true\|sslmode.*require" --include="*.ts" src/ > /dev/null; then
        print_status "Database SSL configuration found" "PASS"
    else
        print_status "Database SSL configuration not found - consider for production" "INFO"
    fi
}

# Check logging and monitoring
check_logging_security() {
    echo -e "\n${BLUE}Checking Logging and Monitoring...${NC}"
    
    # Check for audit logging
    if grep -r "audit" --include="*.ts" src/ > /dev/null; then
        print_status "Audit logging implemented" "PASS"
    else
        print_status "Audit logging not found" "WARN"
    fi
    
    # Check for security monitoring
    if grep -r "SecurityMonitor\|suspicious" --include="*.ts" --include="*.tsx" src/ > /dev/null; then
        print_status "Security monitoring implemented" "PASS"
    else
        print_status "Security monitoring not found" "WARN"
    fi
}

# Run security tests
run_security_tests() {
    echo -e "\n${BLUE}Running Security Tests...${NC}"
    
    if [ -d "__tests__/security" ]; then
        if npm test -- __tests__/security > /dev/null 2>&1; then
            print_status "Security tests passed" "PASS"
        else
            print_status "Security tests failed" "FAIL"
        fi
    else
        print_status "No security tests found" "WARN"
    fi
}

# Generate security report
generate_report() {
    echo -e "\n${BLUE}Security Audit Summary${NC}"
    echo "=================================================="
    echo "Audit completed at: $(date)"
    echo ""
    echo "Review the items marked as FAIL or WARN above."
    echo "For production deployment, ensure all FAIL items are addressed."
    echo ""
    echo "Additional recommendations:"
    echo "- Regularly update dependencies (npm audit)"
    echo "- Monitor security advisories"
    echo "- Implement automated security scanning"
    echo "- Regular penetration testing"
    echo "- Security awareness training for developers"
}

# Main execution
main() {
    check_dependencies
    check_docker_security
    check_environment_security
    check_dependency_security
    check_code_security
    check_auth_security
    check_security_headers
    check_file_permissions
    check_database_security
    check_logging_security
    run_security_tests
    generate_report
}

# Run the audit
main

echo -e "\n${GREEN}Security audit completed!${NC}"