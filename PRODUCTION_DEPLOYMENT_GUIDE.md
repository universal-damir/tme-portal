# TME Portal Production Deployment Guide

## Production Server Configuration

**Server IP:** `192.168.97.149`  
**DNS Name:** `tme-portal.tme.local`  
**Application URL:** `http://tme-portal.tme.local:3000`

---

## Phase 6: Production Deployment Steps

### 1. IT Team Pre-Deployment Tasks

#### Network Configuration
- [ ] **DNS Setup**: Configure DNS record `tme-portal.tme.local` → `192.168.97.149`
- [ ] **Firewall**: Open port 3000 on server 192.168.97.149 for office network access
- [ ] **Test DNS**: Verify `nslookup tme-portal.tme.local` resolves from employee workstations

#### Production Server Setup
- [ ] **Install Docker**: `sudo apt install docker.io docker-compose`
- [ ] **Create TME user**: `sudo useradd -m -s /bin/bash tme`
- [ ] **Add to Docker group**: `sudo usermod -aG docker tme`
- [ ] **Create deployment directory**: `sudo mkdir -p /opt/tme-portal && sudo chown tme:tme /opt/tme-portal`

### 2. Application Deployment

#### Transfer Files to Production Server
```bash
# Copy entire project to production server
scp -r "/Users/damir/tme portal v5.2/" tme@192.168.97.149:/opt/tme-portal/
```

#### Verify Configuration Files
- [x] ✅ `.env.production` - Updated with `tme-portal.tme.local`
- [x] ✅ `docker-compose.yml` - Updated with production URL
- [x] ✅ `docker-compose.secrets.yml` - Updated with production URL
- [x] ✅ Docker secrets in `/secrets/` directory

#### Deploy the Application
```bash
# On production server (192.168.97.149)
cd /opt/tme-portal
sudo docker-compose -f docker-compose.secrets.yml up -d --build
```

### 3. Verification Steps

#### Health Checks
```bash
# Check all containers are running
docker ps

# Check application health
curl http://tme-portal.tme.local:3000/api/health

# Check database connection
docker logs tme-portal-postgres-1

# Check Redis connection
docker logs tme-portal-redis-1
```

#### User Access Testing
- [ ] **Admin Access**: Login with admin account (Employee 00UH or 70DN)
- [ ] **Employee Access**: Test login with regular employee accounts
- [ ] **Network Access**: Verify all office computers can access `http://tme-portal.tme.local:3000`

### 4. Post-Deployment Configuration

#### Backup System
```bash
# Test backup system
cd /opt/tme-portal
./scripts/backup-encrypted.sh

# Schedule daily backups (add to crontab)
0 2 * * * /opt/tme-portal/scripts/backup-encrypted.sh
```

#### Security Verification
```bash
# Run security audit
./scripts/security-audit.sh

# Check firewall status
sudo ufw status
```

---

## Employee Access Instructions

**Portal URL:** `http://tme-portal.tme.local:3000`

**Login Credentials:**
- **Username**: Employee email address
- **Password**: Provided by IT administrator

**First Login:**
- All employees must change their default password
- Password requirements: 12+ characters, mixed case, numbers, symbols

---

## Troubleshooting

### Common Issues

**DNS Resolution Problems:**
```bash
# Test DNS resolution
nslookup tme-portal.tme.local
ping tme-portal.tme.local
```

**Container Issues:**
```bash
# View container logs
docker logs tme-portal-app-1
docker logs tme-portal-postgres-1
docker logs tme-portal-redis-1

# Restart services
docker-compose -f docker-compose.secrets.yml restart
```

**Database Connection:**
```bash
# Connect to database
docker exec -it tme-portal-postgres-1 psql -U tme_user -d tme_portal

# Check user accounts
SELECT employee_code, email, full_name, department FROM users LIMIT 10;
```

### Support Contacts
- **Development**: Damir (Employee 70DN)
- **System Administration**: Uwe (Employee 00UH)
- **IT Department**: TME IT Team

---

## Security Features Enabled

✅ **Authentication Security**
- Password complexity requirements
- Account lockout after 5 failed attempts
- 8-hour session timeout
- Audit logging for all actions

✅ **Infrastructure Security**
- Non-root container execution
- Network isolation
- Encrypted credentials management
- Regular security updates

✅ **Monitoring & Alerts**
- Failed login tracking
- Suspicious activity detection
- Admin action monitoring
- Security event logging

---

## Maintenance Schedule

**Daily:**
- Automated encrypted backups at 2:00 AM
- Log rotation and cleanup

**Weekly:**
- Security update checks
- Backup verification

**Monthly:**
- Security audit review
- Performance monitoring review
- User access audit

---

## Production Environment Summary

**Status:** ✅ Ready for deployment  
**User Accounts:** 37 employees configured  
**Security Level:** Production-hardened  
**Backup System:** Automated with encryption  
**Access Method:** Office network via DNS name  

The TME Portal is now configured for production deployment on server `192.168.97.149` with DNS name `tme-portal.tme.local`.