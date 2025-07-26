# TME Portal v5.2 - Simple Production Deployment

## Server Info
**Server**: `tme-user@192.168.97.149`  
**URL**: http://192.168.97.149:3000

## Quick Deployment Process

### 1. Prepare Local Changes
```bash
# Commit your changes locally
git add .
git commit -m "your changes description"
git push origin main
```

### 2. Deploy on Production Server
```bash
# SSH to production server
ssh tme-user@192.168.97.149

# Navigate to application directory
cd ~/tme-portal

# Sync with latest changes
git pull origin main

# Deploy with production configuration
docker-compose -f docker-compose.secrets.yml down
docker-compose -f docker-compose.secrets.yml up -d --build

# Check deployment status
docker-compose -f docker-compose.secrets.yml ps
```

### 3. Verify Deployment
```bash
# Check health
curl http://192.168.97.149:3000/api/health

# Check logs if needed
docker-compose -f docker-compose.secrets.yml logs -f app
```

## First Time Setup (One-time only)

### Server Prerequisites
```bash
# SSH to server
ssh tme-user@192.168.97.149

# Install Docker & Docker Compose (if not installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker tme-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again
exit
ssh tme-user@192.168.97.149
```

### Clone Repository
```bash
# Clone your repository (first time only)
git clone <YOUR_REPOSITORY_URL> ~/tme-portal
cd ~/tme-portal

# Set correct permissions
chmod +x scripts/*.sh
chmod 600 secrets/*
```

### Update Production URL
```bash
# Edit docker-compose.secrets.yml (one-time setup)
nano docker-compose.secrets.yml

# Change line 16 from:
# - NEXTAUTH_URL=http://tme-portal.tme.local:3000
# To:
# - NEXTAUTH_URL=http://192.168.97.149:3000
```

### Create Admin User (First deployment only)
```bash
# After first successful deployment, create admin user
docker-compose -f docker-compose.secrets.yml exec postgres psql -U tme_user -d tme_portal

# Run this SQL (replace with your details):
INSERT INTO users (
  employee_code, email, hashed_password, full_name, 
  department, designation, role, status, must_change_password
) VALUES (
  'ADMIN001',
  'admin@tme-services.com',
  '$2b$12$YOUR_HASHED_PASSWORD_HERE',
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

### Generate Password Hash (on your local machine)
```bash
node -e "
const bcrypt = require('bcryptjs');
const password = 'YourSecurePassword123!';
console.log(bcrypt.hashSync(password, 12));
"
```

## Regular Deployment Workflow

**Every time you want to deploy:**

1. **Local**: Commit & push changes
   ```bash
   git add .
   git commit -m "your changes"
   git push origin main
   ```

2. **Production**: SSH and deploy
   ```bash
   ssh tme-user@192.168.97.149
   cd ~/tme-portal
   git pull origin main
   docker-compose -f docker-compose.secrets.yml up -d --build
   ```

3. **Verify**: Check application
   ```bash
   curl http://192.168.97.149:3000/api/health
   ```

## Troubleshooting

**If containers won't start:**
```bash
docker-compose -f docker-compose.secrets.yml down
docker system prune -f
docker-compose -f docker-compose.secrets.yml up -d --build
```

**Check logs:**
```bash
docker-compose -f docker-compose.secrets.yml logs -f
```

**Restart specific service:**
```bash
docker-compose -f docker-compose.secrets.yml restart app
```

## Backup & Monitoring

**View backups:**
```bash
ls -la ~/tme-portal/backups/
```

**Manual backup:**
```bash
docker-compose -f docker-compose.secrets.yml run --rm backup
```

---

**That's it!** Your application will be running at **http://192.168.97.149:3000**