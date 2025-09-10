# Migration Workflow Guide - TME Portal

## Overview
Standardized process for managing database migrations safely, regardless of type. The test database (`tme_portal_test`) serves as your permanent staging environment.

---

## 🎯 Golden Rules

1. **ALWAYS test on `tme_portal_test` first** - No exceptions
2. **Track every migration** - Use the schema_migrations table
3. **Include rollback SQL** - In every migration file
4. **Backup before production** - Always
5. **Test database is permanent** - Container is temporary

---

## 📁 Migration File Structure

### Naming Convention
```
database/migrations/
├── 001_initial_schema.sql
├── 002_add_user_fields.sql
├── 003_create_new_table.sql
└── PENDING_MIGRATIONS.md
```

### Migration Template
```sql
-- Migration: 016_add_feature_x.sql
-- Date: 2025-09-15
-- Author: Your Name
-- Type: [SAFE|BREAKING] - Can deploy before code?
-- Description: Add support for feature X

-- ============================================
-- SAFETY CHECK
-- ============================================
-- Safe to run before code deploy: YES/NO
-- Rollback included: YES
-- Tested on: tme_portal_test
-- ============================================

BEGIN;

-- Forward Migration
ALTER TABLE users ADD COLUMN IF NOT EXISTS feature_x BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_users_feature_x ON users(feature_x);

-- Migration tracking
INSERT INTO schema_migrations (version, description) 
VALUES ('016_add_feature_x', 'Add support for feature X')
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- ============================================
-- ROLLBACK (Save this separately)
-- ============================================
-- BEGIN;
-- ALTER TABLE users DROP COLUMN IF EXISTS feature_x;
-- DELETE FROM schema_migrations WHERE version = '016_add_feature_x';
-- COMMIT;
```

---

## 🚀 Standard Migration Workflow

### Step 1: Create Migration Locally

```bash
# Create migration file
cat > database/migrations/$(date +%Y%m%d)_migration_name.sql << 'EOF'
-- Your migration SQL here
EOF

# Test locally first
psql -U postgres -d tme_portal_dev < database/migrations/*_migration_name.sql
```

### Step 2: Apply to Test Database (Immediately)

```bash
# Transfer to server
scp database/migrations/*_migration_name.sql tme-user@192.168.97.149:~/migrations/

# SSH to server
ssh tme-user@192.168.97.149

# Apply to TEST database
docker exec -i tme-user-postgres-1 psql -U tme_user -d tme_portal_test < ~/migrations/*_migration_name.sql

# Verify it worked
docker exec tme-user-postgres-1 psql -U tme_user -d tme_portal_test -c "SELECT * FROM schema_migrations ORDER BY applied_at DESC LIMIT 5;"
```

### Step 3: Classify Migration Type

**SAFE Migrations** (Can apply before code):
- ✅ Adding new tables
- ✅ Adding nullable columns
- ✅ Adding indexes
- ✅ Adding new enum values
- ✅ Data backfills with defaults

**BREAKING Migrations** (Must deploy with code):
- ❌ Dropping columns
- ❌ Renaming columns
- ❌ Changing data types
- ❌ Adding NOT NULL without default
- ❌ Removing tables

### Step 4: Production Deployment

#### For SAFE Migrations (Apply Anytime)
```bash
# Can apply immediately to production
/home/tme-user/scripts/backup-daily.sh  # Backup first
docker exec -i tme-user-postgres-1 psql -U tme_user -d tme_portal < ~/migrations/*_migration_name.sql

# Deploy code days/weeks later - no coordination needed
```

#### For BREAKING Migrations (Coordinate with Code)
```bash
# On deployment day only:

# 1. Test with container
docker run -d --name tme-test -p 3001:3000 \
  --env-file /home/tme-user/.env \
  -e DATABASE_URL="postgresql://tme_user:TTJNkCMDFwXvfhYbogdVllzaS1mmCpnH@postgres:5432/tme_portal_test" \
  --network tme-user_tme_network \
  tme-portal-server:production

# 2. Verify on port 3001
curl http://localhost:3001

# 3. Apply to production
/home/tme-user/scripts/backup-daily.sh
docker exec -i tme-user-postgres-1 psql -U tme_user -d tme_portal < ~/migrations/*_migration_name.sql

# 4. Deploy new code immediately
docker stop tme-user-app-new && docker rm tme-user-app-new
docker run -d --name tme-user-app-new -p 80:3000 ...
```

---

## 📊 Migration Tracking System

### One-Time Setup (Run Once)

```bash
# Create tracking table in both databases
docker exec tme-user-postgres-1 psql -U tme_user -d tme_portal_test << 'EOF'
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    applied_by VARCHAR(100) DEFAULT CURRENT_USER
);
EOF

# Same for production
docker exec tme-user-postgres-1 psql -U tme_user -d tme_portal << 'EOF'
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    applied_by VARCHAR(100) DEFAULT CURRENT_USER
);
EOF
```

### Track Your Migrations

```bash
# Check what's applied where
echo "=== TEST Database Migrations ==="
docker exec tme-user-postgres-1 psql -U tme_user -d tme_portal_test -c "SELECT version, applied_at FROM schema_migrations ORDER BY applied_at;"

echo "=== PRODUCTION Database Migrations ==="
docker exec tme-user-postgres-1 psql -U tme_user -d tme_portal -c "SELECT version, applied_at FROM schema_migrations ORDER BY applied_at;"

# See differences
diff <(docker exec tme-user-postgres-1 psql -t -U tme_user -d tme_portal -c "SELECT version FROM schema_migrations ORDER BY version;") \
     <(docker exec tme-user-postgres-1 psql -t -U tme_user -d tme_portal_test -c "SELECT version FROM schema_migrations ORDER BY version;")
```

---

## 🔄 Rollback Procedures

### Emergency Rollback

```bash
# 1. Backup current state
/home/tme-user/scripts/backup-daily.sh

# 2. Run rollback SQL
docker exec tme-user-postgres-1 psql -U tme_user -d tme_portal << 'EOF'
BEGIN;
-- Your rollback SQL here
DELETE FROM schema_migrations WHERE version = 'XXX';
COMMIT;
EOF

# 3. Deploy previous code if needed
docker stop tme-user-app-new && docker rm tme-user-app-new
docker run -d --name tme-user-app-new [previous-image-tag]
```

---

## 📝 Migration Checklist Template

Copy this for each migration:

```markdown
## Migration: XXX_description.sql

- [ ] Created migration file with rollback SQL
- [ ] Tested locally
- [ ] Classified as [SAFE/BREAKING]
- [ ] Applied to tme_portal_test
- [ ] Verified in test database
- [ ] Added to schema_migrations tracking
- [ ] Documented in PENDING_MIGRATIONS.md

### If SAFE:
- [ ] Applied to production immediately
- [ ] Verified in production
- [ ] Removed from PENDING_MIGRATIONS.md

### If BREAKING:
- [ ] Waiting for code deployment
- [ ] Tested with tme-test container on port 3001
- [ ] Backed up production
- [ ] Applied to production with code deployment
- [ ] Verified everything working
- [ ] Removed from PENDING_MIGRATIONS.md
```

---

## 🗂️ Pending Migrations Tracking

Keep track in `database/migrations/PENDING_MIGRATIONS.md`:

```markdown
# Pending Production Migrations

## Applied to Test, Not Production

### 016_add_user_preferences.sql
- Type: SAFE
- Test Applied: 2025-09-15
- Production Applied: PENDING
- Can deploy before code: YES

### 017_rename_client_fields.sql  
- Type: BREAKING
- Test Applied: 2025-09-16
- Production Applied: PENDING
- Can deploy before code: NO - MUST COORDINATE
- Blocked by: Next production deployment
```

---

## 🎯 Quick Decision Tree

```
Is migration SAFE (backward compatible)?
├── YES → Apply to test AND production immediately
│         Deploy code whenever ready
└── NO  → Apply to test immediately
          Apply to production ONLY with code deployment
```

---

## 📊 Status Check Commands

```bash
# Full migration status
cat > ~/check_migrations.sh << 'EOF'
#!/bin/bash
echo "=== Migration Status Check ==="
echo ""
echo "TEST Database:"
docker exec tme-user-postgres-1 psql -U tme_user -d tme_portal_test -c "SELECT COUNT(*) as count FROM schema_migrations;"
echo ""
echo "PRODUCTION Database:"
docker exec tme-user-postgres-1 psql -U tme_user -d tme_portal -c "SELECT COUNT(*) as count FROM schema_migrations;"
echo ""
echo "=== Pending Migrations (in TEST but not PRODUCTION) ==="
diff --suppress-common-lines \
  <(docker exec tme-user-postgres-1 psql -t -U tme_user -d tme_portal -c "SELECT version FROM schema_migrations ORDER BY version;" | sed 's/^[[:space:]]*//' | grep -v '^$') \
  <(docker exec tme-user-postgres-1 psql -t -U tme_user -d tme_portal_test -c "SELECT version FROM schema_migrations ORDER BY version;" | sed 's/^[[:space:]]*//' | grep -v '^$') \
  | grep "^>" | sed 's/^> //'
EOF
chmod +x ~/check_migrations.sh
```

---

## ⚠️ Common Pitfalls to Avoid

1. **Never apply BREAKING migrations before code deployment**
2. **Never skip the test database** - Even for "simple" changes
3. **Never forget rollback SQL** - You'll need it eventually
4. **Never apply migrations during business hours** - Unless SAFE type
5. **Never trust "it works locally"** - Test on tme_portal_test

---

## 💡 Best Practices

1. **Batch BREAKING migrations** - Deploy multiple together
2. **Apply SAFE migrations immediately** - Don't let them pile up
3. **Keep test database current** - Apply all migrations as you write them
4. **Document everything** - Future you will thank you
5. **Use transactions** - BEGIN/COMMIT in every migration
6. **Make migrations idempotent** - Use IF EXISTS/IF NOT EXISTS

---

## 🚨 Emergency Contacts

If migration goes wrong:
1. Check `/home/tme-user/backups/` for recent backups
2. Use rollback SQL immediately
3. Restore from backup if needed: `zcat backup.sql.gz | docker exec -i tme-user-postgres-1 psql -U tme_user -d tme_portal`

---

*Last Updated: September 10, 2025*
*Test Database: tme_portal_test (permanent staging)*
*Production Database: tme_portal*