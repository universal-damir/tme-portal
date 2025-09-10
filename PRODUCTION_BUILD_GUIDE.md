# Production Build & Deployment Guide - TME Portal

## Overview
This guide covers the **SAFE** production deployment process with testing on port 3001 before swapping to production. Always test first, deploy second.

**Key Principle**: Test everything on port 3001 with a test database before touching production.

---

## 🏗️ Phase 1: Build Proper Production Image (Local Machine)

### Prerequisites
- Docker Desktop installed and running
- At least 5GB free disk space
- Access to production server (192.168.97.149)

### Step 1: Prepare Dockerfile
Create `Dockerfile.production` in your project root:

```dockerfile
# Dockerfile.production
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
# Install ALL dependencies (including dev) for build phase
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"

# This creates proper standalone build
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output (Next.js 15 structure)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

### Step 2: Create .dockerignore
Ensure you have a `.dockerignore` file to exclude unnecessary files:

```
node_modules
.next
*.tar.gz
*.tar
*.zip
.env.local
.env
backups/
```

### Step 3: Build the Image

```bash
# Clean previous builds
rm -rf .next

# Build locally first to verify it works
NODE_ENV=production npm run build

# Verify standalone was created
ls -la .next/standalone/server.js

# Build Docker image with progress visibility
docker build --progress=plain \
  -f Dockerfile.production \
  --platform linux/amd64 \
  -t tme-portal-server:production \
  .
```

### Step 4: Verify the Build

```bash
# Check image size (should be ~200-250MB)
docker images tme-portal-server:production

# Verify standalone structure exists
docker run --rm tme-portal-server:production ls -la /app/server.js

# Should output: -rw-r--r-- 1 nextjs nodejs [size] [date] /app/server.js
```

### Step 5: Save and Transfer (Including Migrations)

```bash
# Save image to file
docker save -o tme-portal-production.tar tme-portal-server:production

# Check file size (should be 200-300MB)
ls -lh tme-portal-production.tar

# Create migration bundle if you have new migrations
tar -czf migrations.tar.gz database/migrations/*.sql

# Transfer BOTH to server
scp tme-portal-production.tar tme-user@192.168.97.149:~/
scp migrations.tar.gz tme-user@192.168.97.149:~/  # Only if you have migrations
```

---

## 🔄 Database Migrations (When Needed)

### Migration Strategy

**IMPORTANT**: Always test migrations on test database FIRST!

### Step 1: Prepare Migration Files

On your local machine:
```bash
# Create migrations directory if needed
mkdir -p database/migrations

# Create your migration file with timestamp
cat > database/migrations/$(date +%Y%m%d)_migration.sql << 'EOF'
-- Migration: Add new feature tables/columns
-- Date: YYYY-MM-DD
-- Author: Your name

BEGIN;

-- Your SQL changes here
ALTER TABLE users ADD COLUMN IF NOT EXISTS new_field VARCHAR(255);
CREATE TABLE IF NOT EXISTS new_feature (...);

-- Always include rollback comment
-- ROLLBACK: ALTER TABLE users DROP COLUMN new_field;
-- ROLLBACK: DROP TABLE new_feature;

COMMIT;
EOF
```

### Step 2: Test Migration on Test Database FIRST

```bash
# On server - extract migrations if you transferred them
tar -xzf migrations.tar.gz

# Apply ALL pending migrations to TEST database first
for migration in database/migrations/*.sql; do
  echo "Applying $migration to TEST..."
  docker exec -i tme-user-postgres-1 psql -U tme_user -d tme_portal_test < $migration
done

# Verify migrations worked
docker exec tme-user-postgres-1 psql -U tme_user -d tme_portal_test -c "\d users"
```

### Step 3: Deploy and Test New Code

```bash
# Deploy new code to test container (port 3001)
docker run -d --name tme-test -p 3001:3000 \
  --env-file /home/tme-user/.env \
  -e DATABASE_URL="postgresql://tme_user:TTJNkCMDFwXvfhYbogdVllzaS1mmCpnH@postgres:5432/tme_portal_test" \
  --network tme-user_tme_network \
  tme-portal-server:production

# Test thoroughly on http://192.168.97.149:3001
# Ensure new features work with migrated database
```

### Step 4: Production Migration (After Testing)

```bash
# BACKUP FIRST!
/home/tme-user/scripts/backup-daily.sh

# Apply to production database
docker exec -i tme-user-postgres-1 psql -U tme_user -d tme_portal < ~/migration.sql

# Verify
docker exec tme-user-postgres-1 psql -U tme_user -d tme_portal -c "\d users"

# Deploy new production container
docker stop tme-user-app-new && docker rm tme-user-app-new
docker run -d --name tme-user-app-new -p 80:3000 \
  --env-file /home/tme-user/.env \
  --network tme-user_tme_network \
  --restart unless-stopped \
  tme-portal-server:production
```

### Migration Rollback Plan

Always include rollback SQL in your migration file:
```sql
-- To rollback if needed:
-- docker exec tme-user-postgres-1 psql -U tme_user -d tme_portal -c "ALTER TABLE users DROP COLUMN new_field;"
```

### Migration Checklist

- [ ] Migration tested locally
- [ ] Migration file includes rollback commands
- [ ] Backup taken before migration
- [ ] Migration applied to test database first
- [ ] New code tested with migrated test database
- [ ] Test container stable for 10+ minutes
- [ ] Production backup taken
- [ ] Production migration applied
- [ ] Production code deployed
- [ ] Monitoring for 1 hour

---

## 🧪 Phase 2: Test Deployment on Port 3001 (Server)

### Step 1: Load the Image

```bash
# SSH to server
ssh tme-user@192.168.97.149

# Load the new image
docker load -i tme-portal-production.tar

# Verify it loaded
docker images | grep production
```

### Step 2: Create Test Database (First Time Only)

```bash
# Create test database
docker exec tme-user-postgres-1 psql -U tme_user -d postgres -c "CREATE DATABASE tme_portal_test;"

# Clone production data for testing
docker exec tme-user-postgres-1 pg_dump -U tme_user -d tme_portal | \
  docker exec -i tme-user-postgres-1 psql -U tme_user -d tme_portal_test

# Verify
docker exec tme-user-postgres-1 psql -U tme_user -d tme_portal_test -c "SELECT COUNT(*) FROM users;"
```

### Step 3: Deploy Test Container

```bash
# Find the correct network name
docker network ls | grep tme
# Usually: tme-user_tme_network

# Deploy on port 3001 with TEST database
docker run -d \
  --name tme-test \
  -p 3001:3000 \
  --env-file /home/tme-user/.env \
  -e DATABASE_URL="postgresql://tme_user:TTJNkCMDFwXvfhYbogdVllzaS1mmCpnH@postgres:5432/tme_portal_test" \
  --network tme-user_tme_network \
  tme-portal-server:production

# Check logs
docker logs tme-test --tail 50

# Verify it's running
docker ps | grep tme-test
```

### Step 4: Test the Application

```bash
# Test HTTP response
curl -I http://localhost:3001

# Check memory usage
docker stats tme-test --no-stream

# Simple load test
for i in {1..10}; do 
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/login &
done
wait
```

### Step 5: Browser Testing

1. Open browser to `http://192.168.97.149:3001`
2. Login and verify functionality
3. Test critical features (PDF generation, forms, etc.)
4. Check that notifications work (they'll be from test database)

---

## 🚀 Phase 3: Production Deployment (Only After Testing)

### Step 1: Final Verification

```bash
# Ensure test container has been running stable for at least 10 minutes
docker ps | grep tme-test
docker logs tme-test --tail 20 | grep -i error
```

### Step 2: Backup Current Production (Safety First!)

```bash
# Quick backup of current production container
docker commit tme-user-app-new backup-$(date +%Y%m%d-%H%M%S)

# List backups
docker images | grep backup
```

### Step 3: Zero-Downtime Swap

```bash
# Stop old production
docker stop tme-user-app-new

# Start new production on port 80 with PRODUCTION database
docker run -d \
  --name tme-user-app-prod \
  -p 80:3000 \
  --env-file /home/tme-user/.env \
  --network tme-user_tme_network \
  --restart unless-stopped \
  tme-portal-server:production

# Verify
docker ps | grep tme-user-app-prod
curl -I http://localhost
```

### Step 4: Quick Rollback (If Needed)

```bash
# If something goes wrong, rollback in 5 seconds:
docker stop tme-user-app-prod
docker start tme-user-app-new
```

### Step 5: Cleanup (After Confirming Success)

```bash
# Wait 24 hours, then if all is stable:

# Remove old container
docker rm tme-user-app-new

# Remove test container
docker stop tme-test
docker rm tme-test

# Tag as latest for docker-compose
docker tag tme-portal-server:production tme-portal-server:latest

# Update docker-compose.yml
sed -i 's/image: tme-portal-server:.*/image: tme-portal-server:latest/g' /home/tme-user/docker-compose.yml
```

---

## 📋 Deployment Checklist

### Before Starting
- [ ] Docker Desktop running on Mac
- [ ] 5GB free disk space
- [ ] No active users (schedule maintenance window)

### Build Phase (Local)
- [ ] Created/updated Dockerfile.production
- [ ] Created/updated .dockerignore
- [ ] Ran `NODE_ENV=production npm run build`
- [ ] Verified standalone exists
- [ ] Built Docker image
- [ ] Image size is ~200-250MB (not 1GB+)

### Test Phase (Server)
- [ ] Loaded image on server
- [ ] Test database exists
- [ ] Test container running on port 3001
- [ ] HTTP 200 response
- [ ] Can login successfully
- [ ] Core features work
- [ ] Memory usage < 100MB
- [ ] No errors in logs

### Production Phase
- [ ] Test container stable for 10+ minutes
- [ ] Backup created
- [ ] Production swapped
- [ ] Site accessible on port 80
- [ ] Users can login
- [ ] Monitoring for 1 hour

### Post-Deployment
- [ ] Old containers removed (after 24 hours)
- [ ] docker-compose.yml updated
- [ ] Documentation updated

---

## 🚨 Troubleshooting

### Build Failures

**Problem**: `Cannot find module 'autoprefixer'`
```bash
# Solution: Install ALL dependencies (not --omit=dev)
RUN npm ci  # Not npm ci --omit=dev
```

**Problem**: No standalone directory created
```bash
# Check next.config.ts has:
output: 'standalone'

# Verify with:
cat next.config.ts | grep standalone
```

### Container Won't Start

**Problem**: `Cannot find module '/app/server.js'`
```bash
# Standalone didn't copy correctly
docker run --rm tme-portal-server:production ls -la /app/
# Should show server.js at root
```

**Problem**: Database connection fails
```bash
# Check network
docker network ls
# Use correct network name (usually tme-user_tme_network)
```

### Memory Issues

**Problem**: Build fails with heap error
```bash
# Add to Dockerfile:
ENV NODE_OPTIONS="--max-old-space-size=4096"
```

---

## 📊 Expected Results

### Image Sizes
- Old bloated image: 1.17GB
- New production image: 200-250MB
- Fast deploy package: 20-30MB

### Performance Metrics
- Memory usage: 80-100MB (was 90-100MB)
- Startup time: < 1 second
- Response time: < 100ms
- CPU usage: < 1% idle

### Deployment Times
- Full rebuild: 5-10 minutes
- Fast deploy: 1-2 minutes
- Container swap: 10-30 seconds

---

## 🔐 Security Notes

1. **Never skip test deployment** - Always test on port 3001 first
2. **Keep backups** - Use `docker commit` before major changes
3. **Monitor after deployment** - Watch logs for first hour
4. **Test database isolation** - Ensures production data safety
5. **Quick rollback ready** - Old container available for instant restore

---

## 📦 Container Naming Convention (FIXED NAMES)

### Permanent Container Names - NEVER CHANGE

**Production**: Always use `tme-user-app-new`
**Testing**: Always use `tme-test`

```bash
# Production (port 80) - ALWAYS this name
docker run -d --name tme-user-app-new ...

# Test (port 3001) - ALWAYS this name  
docker run -d --name tme-test ...
```

### Why Fixed Names?

1. **No guide updates needed** - Names never change
2. **Scripts always work** - Fast deployment guide stays valid
3. **Easy to remember** - Same names forever
4. **Clear purpose**:
   - `tme-test` = testing on port 3001
   - `tme-user-app-new` = production on port 80

### During Production Swap:

```bash
# Stop and remove old production
docker stop tme-user-app-new && docker rm tme-user-app-new

# Start new production with SAME name
docker run -d --name tme-user-app-new -p 80:3000 ...
```

### Document deployments without changing names:
```bash
echo "$(date): Deployed new image to tme-user-app-new" >> ~/deployment.log
```

---

## 🗄️ Automatic Backups

### Database Backup Configuration (Already Set Up)

**Location**: `/home/tme-user/scripts/backup-daily.sh`
**Schedule**: Daily at 2 AM via cron
**Retention**: 30 days
**Size**: ~100KB compressed per backup

### What Gets Backed Up:
- All users and passwords (hashed)
- All notifications
- All applications/forms  
- All client data
- All messages
- Complete database structure

### Backup Commands:

**Manual backup**:
```bash
/home/tme-user/scripts/backup-daily.sh
```

**Check backups**:
```bash
ls -lht /home/tme-user/backups/db_backup_*.sql.gz | head -5
```

**Restore from backup**:
```bash
zcat /home/tme-user/backups/db_backup_[DATE].sql.gz | \
  docker exec -i tme-user-postgres-1 psql -U tme_user -d tme_portal
```

### Important Notes:
- ✅ Backup script **persists across Docker rebuilds** (lives on host)
- ✅ No need to recreate after image updates
- ✅ Works independently of app container changes
- ✅ Only needs postgres container (rarely changes)

---

## 📝 Quick Reference

### Every Deployment Commands

**Local Build:**
```bash
rm -rf .next
NODE_ENV=production npm run build
docker build -f Dockerfile.production --platform linux/amd64 -t tme-portal-server:production .
docker save -o tme-portal-production.tar tme-portal-server:production
scp tme-portal-production.tar tme-user@192.168.97.149:~/
```

**Server Test:**
```bash
docker load -i tme-portal-production.tar
docker run -d --name tme-test -p 3001:3000 --env-file /home/tme-user/.env \
  -e DATABASE_URL="postgresql://tme_user:TTJNkCMDFwXvfhYbogdVllzaS1mmCpnH@postgres:5432/tme_portal_test" \
  --network tme-user_tme_network tme-portal-server:production
# Test on http://192.168.97.149:3001
```

**Production Swap:**
```bash
docker stop tme-user-app-new && docker rm tme-user-app-new
docker run -d --name tme-user-app-new -p 80:3000 --env-file /home/tme-user/.env \
  --network tme-user_tme_network --restart unless-stopped tme-portal-server:production
```

---

## ✅ Success Criteria

Your deployment is successful when:
1. Test deployment runs stable on port 3001 for 10+ minutes
2. Memory usage is under 100MB
3. All critical features work in test
4. Production swap completes with < 30 seconds downtime
5. Users can access the site normally
6. No errors in logs for first hour

---

*Last Updated: September 10, 2025*
*Container Architecture: Next.js 15 Standalone*
*Current Production Image: 215MB*