# TME Portal v5.2 - Production Deployment Guide

## Server Information
- **Server IP**: 192.168.97.149
- **User**: tme-user
- **Environment**: Local Production Server
- **Docker Compose**: Production configuration with Docker secrets

## Prerequisites

### 1. SSH Access
```bash
ssh tme-user@192.168.97.149
```

### 2. Required Software on Server
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker tme-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again to apply Docker group changes
exit
ssh tme-user@192.168.97.149
```

## Deployment Steps

### 1. Transfer Application Files

**From your local machine:**
```bash
# Create deployment archive (exclude development files)
tar -czf tme-portal-production.tar.gz \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  --exclude="*.log" \
  --exclude=backups \
  .

# Transfer to server
scp tme-portal-production.tar.gz tme-user@192.168.97.149:~/
```

**On the server:**
```bash
# Create application directory
mkdir -p ~/tme-portal
cd ~/tme-portal

# Extract application files
tar -xzf ~/tme-portal-production.tar.gz
rm ~/tme-portal-production.tar.gz

# Set proper permissions
chmod +x scripts/*.sh
```

### 2. Configure Environment

**Create production environment file:**
```bash
cd ~/tme-portal

# Copy production environment
cp .env.production .env

# Verify secrets directory exists and has correct permissions
ls -la secrets/
chmod 600 secrets/*
```

**Update production URL in environment:**
```bash
# Edit .env.production to use server IP
sed -i 's|NEXTAUTH_URL=.*|NEXTAUTH_URL=http://192.168.97.149:3000|g' .env.production
```

### 3. Verify Docker Configuration

**Check docker-compose.secrets.yml:**
```bash
# Verify the production compose file
cat docker-compose.secrets.yml | grep -A 5 -B 5 "NEXTAUTH_URL"

# Should show: NEXTAUTH_URL=http://tme-portal.tme.local:3000
# You may need to update this to: NEXTAUTH_URL=http://192.168.97.149:3000
```

**Update Docker Compose for server IP:**
```bash
# Edit docker-compose.secrets.yml
nano docker-compose.secrets.yml

# Change line 16 from:
# - NEXTAUTH_URL=http://tme-portal.tme.local:3000
# To:
# - NEXTAUTH_URL=http://192.168.97.149:3000
```

### 4. Deploy Application

**Start production deployment:**
```bash
cd ~/tme-portal

# Use the production Docker Compose file
docker-compose -f docker-compose.secrets.yml up -d --build

# Monitor deployment
docker-compose -f docker-compose.secrets.yml logs -f
```

**Verify deployment:**
```bash
# Check container status
docker-compose -f docker-compose.secrets.yml ps

# All containers should show "Up" and "healthy"
# App container should show: Up X minutes (healthy)
# PostgreSQL should show: Up X minutes (healthy)  
# Redis should show: Up X minutes (healthy)
```

### 5. Test Application

**Health checks:**
```bash
# Test application health endpoint
curl -i http://192.168.97.149:3000/api/health

# Should return: {"status":"ok","timestamp":"..."}

# Test main page
curl -i http://192.168.97.149:3000/

# Should return HTTP 200 with HTML content
```

**Database verification:**
```bash
# Check if database is initialized
docker-compose -f docker-compose.secrets.yml exec postgres psql -U tme_user -d tme_portal -c "\\dt"

# Should list tables: users, sessions, audit_logs
```

### 6. Create Admin User (First Time Only)

**Access the database:**
```bash
# Connect to PostgreSQL
docker-compose -f docker-compose.secrets.yml exec postgres psql -U tme_user -d tme_portal

# Create admin user (replace with your details)
INSERT INTO users (
  employee_code, email, hashed_password, full_name, 
  department, designation, role, status, must_change_password
) VALUES (
  'ADMIN001',
  'admin@tme-services.com',
  '$2b$12$HASH_GENERATED_PASSWORD_HERE',
  'Administrator',
  'IT',
  'System Administrator', 
  'admin',
  'active',
  true
);

# Exit database
\q
```

**Generate password hash:**
```bash
# On your local machine, create a password hash
node -e "
const bcrypt = require('bcryptjs');
const password = 'YourSecurePassword123!';
console.log(bcrypt.hashSync(password, 12));
"
```

## 7. Configure Firewall (Optional)

**Open required ports:**
```bash
sudo ufw allow 3000/tcp
sudo ufw allow ssh
sudo ufw enable
```

## 8. Setup SSL/TLS (Recommended)

**Install and configure Nginx reverse proxy:**
```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/tme-portal

# Add configuration:
server {
    listen 80;
    server_name 192.168.97.149;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/tme-portal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 9. Backup Configuration

**Setup automated backups:**
```bash
# The backup container runs automatically
# Check backup logs
docker-compose -f docker-compose.secrets.yml logs backup

# Manual backup
docker-compose -f docker-compose.secrets.yml run --rm backup
```

**Backup files location:**
```bash
ls -la ~/tme-portal/backups/
```

## 10. Monitoring and Maintenance

**View application logs:**
```bash
# All services
docker-compose -f docker-compose.secrets.yml logs -f

# Specific service
docker-compose -f docker-compose.secrets.yml logs -f app
```

**Restart services:**
```bash
# Restart all services
docker-compose -f docker-compose.secrets.yml restart

# Restart specific service
docker-compose -f docker-compose.secrets.yml restart app
```

**Update application:**
```bash
# Pull latest changes (if using git)
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.secrets.yml up -d --build
```

## 11. Troubleshooting

**Common issues:**

1. **Port already in use:**
```bash
sudo netstat -tlnp | grep :3000
sudo kill -9 PID_NUMBER
```

2. **Database connection issues:**
```bash
docker-compose -f docker-compose.secrets.yml logs postgres
```

3. **Redis connection issues:**
```bash
docker-compose -f docker-compose.secrets.yml logs redis
```

4. **Container won't start:**
```bash
docker-compose -f docker-compose.secrets.yml down
docker system prune -f
docker-compose -f docker-compose.secrets.yml up -d --build
```

## 12. Security Checklist

- [ ] Firewall configured
- [ ] Default passwords changed
- [ ] SSL/TLS enabled (if public-facing)
- [ ] Database backups working
- [ ] Log rotation configured
- [ ] Monitoring alerts setup

## Access URLs

- **Application**: http://192.168.97.149:3000
- **Health Check**: http://192.168.97.149:3000/api/health

## Production Environment Variables

The application uses these key environment variables in production:

- `NODE_ENV=production`
- `DATABASE_URL=postgresql://tme_user:PASSWORD@postgres:5432/tme_portal`
- `REDIS_URL=redis://:PASSWORD@redis:6379`
- `NEXTAUTH_URL=http://192.168.97.149:3000`
- `NEXTAUTH_SECRET=SECURE_SECRET_KEY`

## Support

For issues during deployment, check:
1. Container logs: `docker-compose -f docker-compose.secrets.yml logs`
2. System resources: `htop` or `docker stats`
3. Network connectivity: `curl http://localhost:3000/api/health`

---

**Deployment completed!** Your TME Portal v5.2 should now be running at http://192.168.97.149:3000