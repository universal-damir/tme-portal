# Production Synchronization Action Plan

## Current Situation Analysis

### Production Status:
- ✅ Database is functional with 45 users
- ✅ 746KB backup created successfully
- ❌ Missing `revision_number` column in applications table
- ❌ Wrong categories in user_todos constraint
- ❌ Running 9-day old Docker image with bugs

### Local vs Production Differences:

| Component | Local (Working) | Production (Broken) | Impact |
|-----------|----------------|---------------------|---------|
| Docker Image | Current code | 9 days old (latest-fix) | Urgency bug persists |
| revision_number column | EXISTS | MISSING | Review submissions fail |
| user_todos categories | review, follow_up, reminder, action | task, follow_up, reminder, deadline, review, system, to_send, send_approved_document | Todo creation fails |
| Applications count | 150 | Unknown (need to check) | Data sync needed |

## Immediate Fixes Needed (READ-ONLY verification first):

### 1. Check which migrations are missing on production:

```bash
# Check if migration files exist on production server
ls -la ~/database/migrations/ | grep -E "revision|todos"

# Check what's in the app container
docker exec tme-user-app-1 ls -la /app/database/migrations/ | grep -E "revision|todos"
```

### 2. Verify current application count on production:

```bash
docker exec tme-user-postgres-1 psql -U tme_user -d tme_portal -c "SELECT COUNT(*) as total, status, COUNT(*) as count FROM applications GROUP BY status ORDER BY status;"
```

### 3. Check if there are pending migrations to apply:

```bash
# List all migration files that should be applied
docker exec tme-user-app-1 cat /app/database/migrations/010_add_application_revision_tracking.sql 2>/dev/null | head -20
docker exec tme-user-app-1 cat /app/database/migrations/013_fix_user_todos_categories.sql 2>/dev/null | head -20
```

## Safe Deployment Strategy:

### Phase 1: Create Test Environment (Port 3001)
1. Clone current production setup to port 3001
2. Test all fixes on clone first
3. Verify everything works

### Phase 2: Fix Database Issues (After Testing)
1. Apply missing migrations:
   - Add revision_number column
   - Fix user_todos categories constraint
2. Test application functionality

### Phase 3: Deploy New Docker Image
1. Build fresh Docker image with latest code
2. Deploy using fast deployment method
3. Verify urgency fix is working

## Commands for Setting Up Test Environment:

```bash
# 1. Create test docker-compose file
cat > docker-compose.test.yml << 'EOF'
version: '3.8'

services:
  app-test:
    image: tme-portal-server:test-latest
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://tme_user:TTJNkCMDFwXvfhYbogdVllzaS1mmCpnH@postgres-test:5432/tme_portal_test
      - REDIS_URL=redis://:2UvSulxR79obMWJ3dfCcb6zs@redis-test:6379
      - NEXTAUTH_URL=http://192.168.97.149:3001
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on:
      - postgres-test
      - redis-test
    networks:
      - tme_test_network

  postgres-test:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=tme_portal_test
      - POSTGRES_USER=tme_user
      - POSTGRES_PASSWORD=TTJNkCMDFwXvfhYbogdVllzaS1mmCpnH
    volumes:
      - postgres_test_data:/var/lib/postgresql/data
    networks:
      - tme_test_network

  redis-test:
    image: redis:7-alpine
    command: redis-server --requirepass 2UvSulxR79obMWJ3dfCcb6zs
    volumes:
      - redis_test_data:/data
    networks:
      - tme_test_network

volumes:
  postgres_test_data:
  redis_test_data:

networks:
  tme_test_network:
EOF

# 2. Restore production backup to test database
docker exec postgres-test psql -U tme_user -d tme_portal_test < backup_production_working_20250909-103042.sql

# 3. Apply fixes to test database first
# ... test all migrations and fixes ...

# 4. If everything works on :3001, then apply to production
```

## Migration SQL to Fix Issues:

### Fix 1: Add revision_number column
```sql
-- Add revision_number column if it doesn't exist
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS revision_number INTEGER DEFAULT 0;

-- Update existing records
UPDATE applications 
SET revision_number = 0 
WHERE revision_number IS NULL;
```

### Fix 2: Fix user_todos categories
```sql
-- Drop the old constraint
ALTER TABLE user_todos 
DROP CONSTRAINT IF EXISTS user_todos_category_check;

-- Add the correct constraint matching the app code
ALTER TABLE user_todos 
ADD CONSTRAINT user_todos_category_check 
CHECK (category IN ('review', 'follow_up', 'reminder', 'action', 'review_document'));
```

## Docker Image Build Commands:

```bash
# On local machine - build fresh image
NODE_ENV=production npm run build
docker build --platform linux/amd64 -t tme-portal-server:production-$(date +%Y%m%d) .
docker save -o tme-portal-production-$(date +%Y%m%d).tar tme-portal-server:production-$(date +%Y%m%d)

# Transfer to server
scp tme-portal-production-*.tar tme-user@192.168.97.149:~/

# On server - load and deploy
docker load -i tme-portal-production-*.tar
docker tag tme-portal-server:production-* tme-portal-server:latest
docker-compose up -d app
```

## Verification Checklist:

- [ ] Test environment running on port 3001
- [ ] Database migrations applied successfully
- [ ] No more user_todos constraint errors
- [ ] No more revision_number errors
- [ ] Urgency field working (not sending 'standard')
- [ ] All 45 users can still login
- [ ] Application submission works
- [ ] PDF generation works

## Rollback Plan:

If anything goes wrong:
```bash
# Restore from backup
docker exec tme-user-postgres-1 psql -U tme_user -d postgres -c "DROP DATABASE IF EXISTS tme_portal;"
docker exec tme-user-postgres-1 psql -U tme_user -d postgres -c "CREATE DATABASE tme_portal;"
docker exec tme-user-postgres-1 psql -U tme_user -d tme_portal < backup_production_working_20250909-103042.sql

# Revert to old image
docker tag tme-portal-server:latest-fix tme-portal-server:latest
docker-compose up -d app
```

## Next Steps:

1. First, run the verification commands above to confirm the analysis
2. Set up test environment on port 3001
3. Test all fixes on test environment
4. Once verified, apply to production
5. Deploy new Docker image with latest code

This approach ensures zero downtime and safe testing before touching production.