# Production Fixes to Incorporate Before Next Deployment
## Date: August 30, 2025

## Critical Fixes Applied Directly to Production

### 1. Urgency Mapping Fix (Code Change - MUST KEEP)
**Location:** `/src/app/api/applications/[id]/submit-review/route.ts`

**Lines 70-74:** Added urgency mapping
```typescript
// Map frontend urgency values to database values
// Frontend sends: 'standard' or 'urgent'
// Database expects: 'low', 'medium', or 'high'
const dbUrgency = urgency === 'urgent' ? 'high' : 'medium';
console.log('🔧 API ROUTE: Mapping urgency for database:', urgency, '->', dbUrgency);
```

**Lines 96-99:** Use mapped value
```typescript
const submitPromise = ApplicationsService.submitForReview({
  application_id: id,
  reviewer_id: parseInt(reviewer_id),
  urgency: dbUrgency,  // Using mapped value
  comments
}, userId);
```

**Line 243:** Use mapped value in notification
```typescript
urgency: dbUrgency, // Use the already mapped urgency value
```

### 2. Database Schema Fixes (MUST ADD TO MIGRATIONS)

#### Missing Table: review_messages
**File to create:** `/database/migrations/XXX_add_review_messages.sql`
```sql
CREATE TABLE IF NOT EXISTS review_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('submitter', 'reviewer')),
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'comment' CHECK (message_type IN ('comment', 'submission', 'resubmission', 'approval', 'rejection')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    CONSTRAINT fk_review_messages_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_messages_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_review_messages_application ON review_messages(application_id);
CREATE INDEX idx_review_messages_created ON review_messages(created_at DESC);
```

#### Fixed Constraint: user_todos categories
**File to create:** `/database/migrations/XXX_fix_user_todos_categories.sql`
```sql
-- Drop old constraint
ALTER TABLE user_todos DROP CONSTRAINT IF EXISTS user_todos_category_check;

-- Add new constraint with all needed categories
ALTER TABLE user_todos ADD CONSTRAINT user_todos_category_check 
  CHECK (category IN ('task', 'follow_up', 'reminder', 'deadline', 'review', 'system', 'to_send', 'send_approved_document'));
```

## Consequences for Next Full Deployment

### WITHOUT These Fixes:
1. ❌ **Review submissions will break** - Urgency mismatch will return 400 errors
2. ❌ **Conversation history won't work** - Missing review_messages table
3. ❌ **Todo creation will fail** - Constraint violations
4. ❌ **Will overwrite production database** - Losing the fixes

### WITH These Fixes:
1. ✅ All review functionality works
2. ✅ Database schema stays consistent
3. ✅ No manual fixes needed after deployment

## Pre-Deployment Checklist

### 1. Code Changes (Already Done Locally)
- [x] Urgency mapping in `/src/app/api/applications/[id]/submit-review/route.ts`

### 2. Database Migrations (TO DO)
- [ ] Create migration file for review_messages table
- [ ] Create migration file for user_todos constraint fix
- [ ] Test migrations locally

### 3. Optional Improvements (Nice to Have)
- [ ] Update frontend to send 'medium' instead of 'standard' (cleaner solution)
- [ ] Update TypeScript types to reflect actual database values
- [ ] Add proper logging for review actions

## Build Commands for Next Deployment

```bash
# 1. Ensure all fixes are in place
git status  # Check all changes are committed

# 2. Build with production environment
NODE_ENV=production npm run build

# 3. Build Docker image
docker build -t tme-portal-server:production-v2 .

# 4. Tag for registry (if using)
docker tag tme-portal-server:production-v2 your-registry/tme-portal-server:latest

# 5. Save for transfer (if air-gapped)
docker save tme-portal-server:production-v2 | gzip > tme-portal-production-v2.tar.gz
```

## Deployment Steps

### Option 1: Fresh Deployment (Recommended)
1. Backup current database
2. Deploy new Docker image with all fixes
3. Run migrations to ensure schema is correct
4. Verify all functionality

### Option 2: Rolling Update
1. Deploy new code via Docker
2. Migrations will be idempotent (IF NOT EXISTS)
3. No downtime required

## Testing After Deployment

Run these tests to ensure everything works:

```bash
# 1. Check review_messages table exists
docker exec CONTAINER_NAME psql -U tme_user -d tme_portal -c "\dt review_messages"

# 2. Check user_todos constraint
docker exec CONTAINER_NAME psql -U tme_user -d tme_portal -c "\d user_todos"

# 3. Test submitting for review
# Try submitting a document through the UI

# 4. Test rejection flow
# Reject a document and check conversation history loads

# 5. Check for errors
docker logs CONTAINER_NAME --tail 100 | grep -i error
```

## Important Notes

1. **The urgency fix is temporary** - Eventually update frontend to send correct values
2. **Migrations are critical** - Without them, fresh deployments will break
3. **Test locally first** - Run migrations on local database before production
4. **Keep backups** - Always backup production database before deployment

## Files Modified/Created Summary

### Modified:
- `/src/app/api/applications/[id]/submit-review/route.ts`

### Need to Create:
- `/database/migrations/XXX_add_review_messages.sql`
- `/database/migrations/XXX_fix_user_todos_categories.sql`

### Already Fixed via Fast Deploy:
- `.next/standalone/` (contains compiled fixes)

## Contact for Issues
If deployment issues occur, check:
1. This document
2. URGENCY_FIX_SUMMARY.md
3. PRODUCTION_RECOVERY_RECAP.md
4. Database migration logs