# TME Portal User Accounts - Docker Local Network Implementation

## Overview

This implementation plan focuses on deploying user account management for TME Portal on a **local Docker network**, optimized for internal organizational use within TME Services' office environment.

---

## Deployment Strategy: Docker Local Network

### Pros ✅
- **Enhanced Security**: Completely isolated from public internet
- **Simplified SSL Management**: Self-signed certificates sufficient
- **Cost Effective**: No cloud hosting costs or domain requirements
- **Full Control**: Complete control over infrastructure and updates
- **Performance**: Direct local network access, minimal latency
- **Privacy**: All employee data remains on-premises
- **Easy Backup**: Simple local backup strategies
- **Development Environment**: Easy to replicate for testing
- **Network Integration**: Can integrate with existing office AD/LDAP
- **Compliance**: Meets strict data residency requirements

### Cons ❌
- **Limited Accessibility**: Only accessible from office network
- **Single Point of Failure**: Server hardware dependency
- **Maintenance Overhead**: Manual updates and monitoring required
- **Scaling Limitations**: Hardware-bound scaling
- **Remote Work Challenges**: VPN required for remote access
- **IT Resource Dependency**: Requires local IT administration
- **Disaster Recovery Complexity**: Manual backup/restore procedures

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Office Local Network                     │
│  ┌─────────────────────┐    ┌──────────────────────────────┐│
│  │   Docker Host       │    │      Employee Workstations   ││
│  │  ┌─────────────────┐│    │   ┌─────────┐ ┌─────────────┐││
│  │  │  TME Portal     ││    │   │ Browser │ │   Browser   │││
│  │  │  Next.js App    ││◄───┼───┤         │ │             │││
│  │  │  Port: 3000     ││    │   └─────────┘ └─────────────┘││
│  │  └─────────────────┘│    └──────────────────────────────┘│
│  │  ┌─────────────────┐│                                    │
│  │  │  PostgreSQL     ││                                    │
│  │  │  Database       ││                                    │
│  │  │  Port: 5432     ││                                    │
│  │  └─────────────────┘│                                    │
│  │  ┌─────────────────┐│                                    │
│  │  │  Redis Cache    ││                                    │
│  │  │  Port: 6379     ││                                    │
│  │  └─────────────────┘│                                    │
│  └─────────────────────┘                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation Setup
**Timeline: 2-3 days**

#### Database Design & Setup
- [ ] **Design user account database schema**
  - [ ] Users table (id, employee_code, email, hashed_password, department, designation, role, status, created_at, last_login)
  - [ ] Sessions table (session_id, user_id, expires_at, ip_address, user_agent)
  - [ ] Permissions table (id, name, description)
  - [ ] User_permissions table (user_id, permission_id)
  - [ ] Audit_logs table (id, user_id, action, resource, timestamp, ip_address)

- [ ] **Set up PostgreSQL Docker container**
  - [ ] Create docker-compose.yml with PostgreSQL 15
  - [ ] Configure persistent volume for data
  - [ ] Set up database initialization scripts
  - [ ] Configure backup automation with pg_dump

- [ ] **Set up Redis for session management**
  - [ ] Add Redis container to docker-compose
  - [ ] Configure Redis persistence (RDB + AOF)
  - [ ] Set up Redis password authentication

#### Docker Infrastructure
- [ ] **Create production-ready Docker setup**
  - [ ] Multi-stage Dockerfile for Next.js optimization
  - [ ] Docker-compose with network isolation
  - [ ] Health checks for all services
  - [ ] Resource limits and restart policies

- [ ] **Network Security Configuration**
  - [ ] Create isolated Docker network
  - [ ] Configure firewall rules (only port 3000 exposed)
  - [ ] Set up reverse proxy with Nginx (optional)
  - [ ] Generate self-signed SSL certificates

### Phase 2: Authentication System Implementation
**Timeline: 5-7 days**

#### Core Authentication
- [ ] **Install authentication dependencies**
  - [ ] `next-auth` for session management
  - [ ] `bcryptjs` for password hashing
  - [ ] `jose` for JWT token handling
  - [ ] `zod` for validation schemas
  - [ ] `pg` and `@types/pg` for PostgreSQL

- [ ] **Implement user authentication API routes**
  - [ ] `/api/auth/login` - Email/password authentication
  - [ ] `/api/auth/logout` - Session termination
  - [ ] `/api/auth/session` - Session validation
  - [ ] `/api/auth/change-password` - Password updates
  - [ ] `/api/auth/profile` - User profile management

- [ ] **Create authentication middleware**
  - [ ] Session validation middleware
  - [ ] Role-based access control (RBAC) middleware
  - [ ] API route protection
  - [ ] Audit logging middleware

- [ ] **Build login interface**
  - [ ] Login page with TME branding
  - [ ] Employee code + password authentication
  - [ ] "Remember me" functionality
  - [ ] Password strength requirements
  - [ ] Account lockout after failed attempts

#### Employee Data Integration
- [ ] **Employee data seeder**
  - [ ] Parse existing employee_details.json
  - [ ] Create database seeder script
  - [ ] Map employee photos to user accounts
  - [ ] Set default passwords
  - [ ] Assign departments and roles

- [ ] **Photo management system**
  - [ ] Serve staff photos securely
  - [ ] Optimize images for different sizes
  - [ ] Fallback for missing photos
  - [ ] Photo upload system for admin

### Phase 3: User Interface & User Experience ✅ **COMPLETED**
**Timeline: 3-4 days**

#### User Interface Components
- [x] **Create authentication-aware layout**
  - [x] Update TMEPortalLayout with user context
  - [x] Add user avatar and dropdown in header
  - [x] Display current user info (name, department, role)
  - [x] Logout functionality in user menu

- [x] **User profile management**
  - [x] Profile page with employee information
  - [x] View personal activity log

- [x] **Navigation & permissions**
  - [x] Hide/show navigation items based on roles
  - [x] Department-specific features
  - [x] Manager vs. Employee access levels

#### Session Management
- [x] **Implement secure session handling**
  - [x] Redis-based session storage
  - [x] Session expiration and renewal
  - [x] Concurrent session management
  - [x] Session invalidation on password change

### Phase 4: Administration Panel
**Timeline: 4-5 days**

#### Admin Dashboard (Assign to 00 UH Uwe, IT Department + Employee 70DN Damir)
- [ ] **Create admin-only interface**
  - [ ] User management dashboard
  - [ ] Employee account creation/editing
  - [ ] Department management
  - [ ] Role and permission assignment
  - [ ] Bulk operations (password reset, account status)

- [ ] **Admin functionality**
  - [ ] Search and filter employees
  - [ ] Export user data
  - [ ] View user activity logs
  - [ ] System health monitoring
  - [ ] Database backup management

#### Audit & Monitoring
- [ ] **Implement comprehensive logging**
  - [ ] Login/logout events
  - [ ] Permission changes
  - [ ] Data access patterns
  - [ ] Failed authentication attempts
  - [ ] Administrative actions

- [ ] **Security monitoring**
  - [ ] Suspicious activity detection
  - [ ] Multiple failed login alerts
  - [ ] Session anomaly detection
  - [ ] Regular security reports

### Phase 5: Security Hardening & Testing ✅ **COMPLETED**
**Timeline: 3-4 days**

#### Security Implementation
- [x] **Implement security best practices**
  - [x] Password complexity requirements with strength checking
  - [x] Account lockout policies (5 failed attempts = 30min lockout)
  - [x] Session timeout configuration (8 hours with sliding renewal)
  - [x] CSRF protection with secure token generation
  - [x] XSS prevention measures and input sanitization
  - [x] Rate limiting for API endpoints (login: 5/15min, admin: 50/5min, api: 100/15min)
  - [x] Security headers (CSP, HSTS, X-Frame-Options, etc.)
  - [x] Real-time suspicious activity detection
  - [x] Enhanced audit logging with security event correlation

- [x] **Docker security hardening**
  - [x] Non-root user containers (nextjs user with UID 1001)
  - [x] Security updates in Dockerfile (apk update && apk upgrade)
  - [x] Proper file permissions and ownership
  - [x] Health checks for container monitoring
  - [x] Network segmentation with isolated Docker networks
  - [x] Regular security updates automation

#### Testing & Quality Assurance
- [x] **Comprehensive testing suite**
  - [x] Unit tests for authentication logic (password hashing, validation)
  - [x] Rate limiting tests with IP isolation
  - [x] Suspicious activity detection tests
  - [x] Integration tests for security middleware
  - [x] SQL injection protection tests
  - [x] XSS prevention validation
  - [x] Session security tests
  - [x] CSRF protection tests

#### Security Monitoring & Alerting
- [x] **Real-time security monitoring**
  - [x] Failed login attempt tracking
  - [x] Account lockout monitoring
  - [x] Unusual access hours detection (outside 7AM-8PM)
  - [x] Multiple simultaneous session detection
  - [x] Admin action monitoring after hours
  - [x] Rapid API call detection (potential automation)
  - [x] Brute force attack detection
  - [x] Security event severity classification (low/medium/high/critical)

#### Security Audit Tools
- [x] **Automated security audit script**
  - [x] Docker security configuration checks
  - [x] Environment security validation
  - [x] Dependency vulnerability scanning
  - [x] Code security pattern analysis
  - [x] Authentication security validation
  - [x] Security headers verification
  - [x] File permissions audit
  - [x] Database security checks
  - [x] Logging and monitoring validation

### Phase 6: Deployment & Maintenance
**Timeline: 2-3 days**

#### Production Deployment
- [ ] **Set up production environment**
  - [ x] Production Docker host configuration
  - [x ] Environment variable management
  - [ x] Database migration scripts
  - [x ] Backup verification

- [ ] **Documentation & Training**
  - [ ] Admin user manual
  - [ ] Employee onboarding guide
  - [ ] Troubleshooting documentation
  - [ ] Backup/restore procedures
  - [ ] Update and maintenance schedules

#### Maintenance Automation
- [ ] **Set up automated maintenance**
  - [ ] Daily database backups
  - [ ] Log rotation policies
  - [ ] Health check monitoring
  - [ ] Automated security updates
  - [ ] Performance monitoring

---

## Database Schema

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    employee_code VARCHAR(10) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'employee',
    status VARCHAR(20) DEFAULT 'active',
    must_change_password BOOLEAN DEFAULT true,
    last_password_change TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Sessions table
CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(255),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Docker Compose Configuration

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://tme_user:secure_password@postgres:5432/tme_portal
      - REDIS_URL=redis://redis:6379
      - NEXTAUTH_SECRET=your-super-secure-secret-key
      - NEXTAUTH_URL=https://tme-portal.local:3000
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    networks:
      - tme_network

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=tme_portal
      - POSTGRES_USER=tme_user
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped
    networks:
      - tme_network

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass redis_password
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - tme_network

volumes:
  postgres_data:
  redis_data:

networks:
  tme_network:
    driver: bridge
```

---

## Security Considerations

### Authentication Security
- **Password Requirements**: Minimum 12 characters, mixed case, numbers, symbols
- **Account Lockout**: 5 failed attempts = 30-minute lockout
- **Session Management**: 8-hour expiration, sliding window renewal
- **Audit Trail**: All authentication events logged with IP tracking

### Infrastructure Security
- **Network Isolation**: Docker containers on private network
- **Firewall Rules**: Only port 3000 exposed to office network
- **SSL/TLS**: Self-signed certificates for HTTPS
- **Database Security**: Strong passwords, no external access
- **Regular Updates**: Automated security patching schedule

### Access Control
- **Role-Based Access**: Admin, Manager, Employee roles
- **Department Restrictions**: Department-specific data access
- **Feature Permissions**: Granular feature-level access control
- **Audit Requirements**: All actions logged and monitored

---

## Backup Strategy

### Daily Automated Backups
```bash
# Database backup script
#!/bin/bash
BACKUP_DIR="/opt/tme-portal/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# PostgreSQL backup
docker exec tme-postgres pg_dump -U tme_user tme_portal > "$BACKUP_DIR/db_$DATE.sql"

# Redis backup  
docker exec tme-redis redis-cli --rdb "$BACKUP_DIR/redis_$DATE.rdb"

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.rdb" -mtime +30 -delete
```

---

## Estimated Timeline: **19-26 days total**

### Resource Requirements
- **Development**: 1 Full-stack developer
- **DevOps**: 0.5 System administrator  
- **Testing**: 0.5 QA engineer
- **Hardware**: Dedicated server with 8GB RAM, 200GB storage

### Success Criteria
- [ ] All 37+ employees can authenticate successfully
- [ ] Admin can manage all user accounts
- [ ] Session management works reliably
- [ ] All features protected by authentication
- [ ] Comprehensive audit logging
- [ ] Automated backup/restore verified
- [ ] Security testing passed
- [ ] Documentation complete