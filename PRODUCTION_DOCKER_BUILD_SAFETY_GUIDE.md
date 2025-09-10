# Production Docker Build Safety Guide
## Ensuring Stable Deployments Without Data Loss

### Current Situation Summary

**Production Status:**
- ✅ Application works (with workarounds)
- ✅ 45 users, functional database
- ⚠️ Missing migrations 010-014
- ⚠️ user_todos constraint mismatch
- ⚠️ Running with API-level patches for urgency

**Development Status:**
- Has all migrations applied
- revision_number column exists
- Different user_todos categories

### CRITICAL: Pre-Docker Build Checklist

## Phase 1: Synchronize Development to Match Production

### 1.1 Check Production's Actual Schema
Run these on production to get exact state:

```bash
# Get complete production schema dump (structure only, no data)
docker exec tme-user-postgres-1 pg_dump -U tme_user -d tme_portal --schema-only > production_schema_$(date +%Y%m%d).sql

# Download it locally
scp tme-user@192.168.97.149:~/production_schema_*.sql ./

# Get list of applied migrations (check which columns exist)
docker exec tme-user-postgres-1 psql -U tme_user -d tme_portal -c "
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'applications' 
ORDER BY ordinal_position;" > production_columns.txt

# Check constraints
docker exec tme-user-postgres-1 psql -U tme_user -d tme_portal -c "
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid IN ('applications'::regclass, 'user_todos'::regclass)
AND contype = 'c';" > production_constraints.txt
```

### 1.2 Align Local Development Database

**Option A: Start Fresh (Recommended)**
```bash
# Backup current local data
docker exec tme-portal-1-postgres-1 pg_dump -U tme_user -d tme_portal > local_backup_$(date +%Y%m%d).sql

# Drop and recreate with production schema
docker exec tme-portal-1-postgres-1 psql -U tme_user -d postgres -c "DROP DATABASE IF EXISTS tme_portal;"
docker exec tme-portal-1-postgres-1 psql -U tme_user -d postgres -c "CREATE DATABASE tme_portal;"

# Apply production schema
docker exec -i tme-portal-1-postgres-1 psql -U tme_user -d tme_portal < production_schema_*.sql

# Import production data for testing
docker exec -i tme-portal-1-postgres-1 psql -U tme_user -d tme_portal < backup_production_working_*.sql
```

**Option B: Selective Rollback**
```bash
# Remove columns that production doesn't have
docker exec tme-portal-1-postgres-1 psql -U tme_user -d tme_portal -c "
ALTER TABLE applications DROP COLUMN IF EXISTS revision_number CASCADE;"

# Revert user_todos categories to match production
docker exec tme-portal-1-postgres-1 psql -U tme_user -d tme_portal -c "
ALTER TABLE user_todos DROP CONSTRAINT IF EXISTS user_todos_category_check;
ALTER TABLE user_todos ADD CONSTRAINT user_todos_category_check 
CHECK (category IN ('task', 'follow_up', 'reminder', 'deadline', 'review', 'system', 'to_send', 'send_approved_document'));"
```

## Phase 2: Create Migration Strategy

### 2.1 Prepare Migration Bundle
Create a single migration file that will bring production up to date:

```sql
-- File: database/migrations/100_production_sync_20250909.sql
-- This migration brings production to current development state

BEGIN;

-- 1. Add revision tracking (from migration 010)
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS revision_number INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_applications_revision_number 
ON applications(revision_number);

-- 2. Fix user_todos categories (from migration 013)
ALTER TABLE user_todos DROP CONSTRAINT IF EXISTS user_todos_category_check;
ALTER TABLE user_todos ADD CONSTRAINT user_todos_category_check 
CHECK (category IN ('review', 'follow_up', 'reminder', 'action', 'review_document'));

-- 3. Add any missing columns
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS submitter_message TEXT;

-- 4. Update any data needed
UPDATE applications SET revision_number = 1 WHERE revision_number IS NULL;

COMMIT;
```

### 2.2 Test Migration on Staging

```bash
# Create test database from production backup
docker exec tme-user-postgres-1 psql -U tme_user -d postgres -c "CREATE DATABASE tme_portal_test;"
docker exec tme-user-postgres-1 psql -U tme_user -d tme_portal_test < backup_production_working_*.sql

# Apply migration to test database
docker exec tme-user-postgres-1 psql -U tme_user -d tme_portal_test < database/migrations/100_production_sync_20250909.sql

# Verify it worked
docker exec tme-user-postgres-1 psql -U tme_user -d tme_portal_test -c "\d applications" | grep revision_number
```

## Phase 3: Docker Build Safety Process

### 3.1 Pre-Build Verification

```bash
# 1. Ensure NODE_ENV is set correctly
export NODE_ENV=production

# 2. Check package.json versions match
diff package.json <(ssh tme-user@192.168.97.149 'docker exec tme-user-app-1 cat /app/package.json')

# 3. Build locally first
npm run build

# 4. Check for turbopack files (should be none)
find .next -name "*turbopack*" -type f

# 5. Verify build output
ls -la .next/standalone/
```

### 3.2 Safe Docker Build Process

```bash
# 1. Create tagged build with timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
docker build --platform linux/amd64 \
  --build-arg NODE_ENV=production \
  -t tme-portal-server:${TIMESTAMP} \
  -t tme-portal-server:latest \
  .

# 2. Test locally first
docker run --rm -p 3002:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://tme_user:secure_password@host.docker.internal:5434/tme_portal \
  tme-portal-server:${TIMESTAMP}

# 3. Create backup tag of current production
ssh tme-user@192.168.97.149 'docker tag tme-portal-server:latest tme-portal-server:backup-$(date +%Y%m%d)'

# 4. Save and transfer
docker save -o tme-portal-${TIMESTAMP}.tar tme-portal-server:${TIMESTAMP}
scp tme-portal-${TIMESTAMP}.tar tme-user@192.168.97.149:~/
```

## Phase 4: Deployment Process

### 4.1 Test Environment First (Port 3001)

```bash
# On production server
# 1. Load new image
docker load -i tme-portal-${TIMESTAMP}.tar

# 2. Run test instance (with test label for easy cleanup)
docker run -d --name tme-test-${TIMESTAMP} \
  --label test=true \
  --network tme-user_tme_network \
  -p 3001:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://tme_user:TTJNkCMDFwXvfhYbogdVllzaS1mmCpnH@postgres:5432/tme_portal_test \
  --env-file .env \
  tme-portal-server:${TIMESTAMP}

# 3. Test functionality on :3001
curl http://localhost:3001/api/health

# 4. Wait for container to be healthy
echo "Waiting for test container to be healthy..."
for i in {1..30}; do
  if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Test container is healthy!"
    break
  fi
  echo "Waiting... attempt $i/30"
  sleep 2
done

# 5. Check logs
docker logs tme-test-${TIMESTAMP} --tail 50
```

### 4.2 Production Deployment

```bash
# Only after test environment verified

# 1. Create backup point
docker exec tme-user-postgres-1 pg_dump -U tme_user -d tme_portal > pre_deployment_backup_${TIMESTAMP}.sql

# 2. Apply database migrations
docker exec tme-user-postgres-1 psql -U tme_user -d tme_portal < database/migrations/100_production_sync_20250909.sql

# 3. Switch containers with zero downtime
docker rename tme-user-app-1 tme-user-app-old
docker run -d --name tme-user-app-1 \
  --network tme-user_tme_network \
  -p 80:3000 \
  --env-file .env \
  tme-portal-server:${TIMESTAMP}

# 4. Verify new container
docker logs tme-user-app-1 --tail 20

# 5. If good, remove old container and clean up test container
docker stop tme-user-app-old
docker rm tme-user-app-old
docker stop tme-test-${TIMESTAMP}
docker rm tme-test-${TIMESTAMP}

# 6. Clean up old test images (keep production images for 48h)
echo "Cleaning up test images older than 48 hours..."
docker image prune -a --filter "label=test=true" --filter "until=48h" -f
# Also clean up any test containers older than 24h
docker container prune --filter "label=test=true" --filter "until=24h" -f

# 7. If bad, rollback
docker stop tme-user-app-1
docker rm tme-user-app-1
docker rename tme-user-app-old tme-user-app-1
docker start tme-user-app-1
```

## Phase 5: Validation Checklist

### Post-Deployment Tests

- [ ] Application loads on port 80
- [ ] Users can login
- [ ] Review submission works
- [ ] No constraint errors in logs
- [ ] Todos are created successfully
- [ ] PDF generation works
- [ ] No revision_number errors
- [ ] No urgency errors

### Monitoring Commands

```bash
# Check for errors
docker logs tme-user-app-1 2>&1 | grep -i error | tail -20

# Check database connections
docker exec tme-user-postgres-1 psql -U tme_user -d tme_portal -c "
SELECT count(*) as connections, state 
FROM pg_stat_activity 
WHERE datname = 'tme_portal' 
GROUP BY state;"

# Check application health
curl -s http://localhost/api/health | jq .
```

## Critical Success Factors

### DO:
1. ✅ Always backup before deployment
2. ✅ Test on port 3001 first
3. ✅ Keep previous Docker image tagged
4. ✅ Apply migrations in transaction blocks
5. ✅ Use `NODE_ENV=production` for builds
6. ✅ Verify no turbopack files in production build

### DON'T:
1. ❌ Skip test environment validation
2. ❌ Apply untested migrations to production
3. ❌ Delete backup images immediately
4. ❌ Mix development and production schemas
5. ❌ Deploy without checking current container logs

## Rollback Procedures

### Quick Rollback (< 1 minute)
```bash
# Stop new container, start old one
docker stop tme-user-app-1
docker start tme-user-app-old
docker rename tme-user-app-old tme-user-app-1
```

### Database Rollback
```bash
# Restore from backup
docker exec tme-user-postgres-1 psql -U tme_user -d postgres -c "DROP DATABASE tme_portal;"
docker exec tme-user-postgres-1 psql -U tme_user -d postgres -c "CREATE DATABASE tme_portal;"
docker exec tme-user-postgres-1 psql -U tme_user -d tme_portal < pre_deployment_backup_${TIMESTAMP}.sql
```

## Maintenance Scripts

### Weekly Backup
```bash
#!/bin/bash
# Save as: backup_weekly.sh
BACKUP_DIR=/home/tme-user/backups
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p $BACKUP_DIR

# Database backup
docker exec tme-user-postgres-1 pg_dump -U tme_user -d tme_portal | gzip > $BACKUP_DIR/db_backup_${TIMESTAMP}.sql.gz

# Keep only last 4 weeks
ls -t $BACKUP_DIR/db_backup_*.sql.gz | tail -n +5 | xargs rm -f
```

## Summary

This guide ensures:
1. **Development matches production** before building
2. **Test environment validates** changes
3. **Rollback is always possible**
4. **No data loss** during deployment
5. **Clear migration path** for database changes

Follow this process for every Docker rebuild to avoid the issues you've faced before.