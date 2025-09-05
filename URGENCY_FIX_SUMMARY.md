# Urgency Fix Summary - Production Issue Resolved
## Date: August 30, 2025

## The Problem
- **Symptom**: Submit for Review button returned 400 error in production
- **Root Cause**: Database constraint mismatch
  - Production database expects: `urgency IN ('low', 'medium', 'high')`
  - Frontend/hooks send: `'standard'`
  - Local dev database was modified to accept `'standard'` and `'urgent'`

## Why It Worked in Dev but Not Production
1. **DEV Database** was manually altered to accept `'standard'` and `'urgent'`
2. **PRODUCTION Database** still had original constraint from migration files
3. No migration was created to sync this change to production

## The Fix Applied (Backend-Only Mapping)
We added urgency value mapping in the API route `/src/app/api/applications/[id]/submit-review/route.ts`:

```typescript
// Map frontend urgency values to database values
const dbUrgency = urgency === 'urgent' ? 'high' : 'medium';
```

This maps:
- `'standard'` → `'medium'`
- `'urgent'` → `'high'`

## Files Modified
1. `/src/app/api/applications/[id]/submit-review/route.ts` (lines 70-74, removed duplicate at line 90-93)

## Deployment Steps Used
```bash
# 1. Built with production environment
NODE_ENV=production npm run build

# 2. Created fast deployment package
tar -czf update-urgency-fix.tar.gz .next/standalone/ .next/static/ public/

# 3. Transferred to server
scp update-urgency-fix.tar.gz tme-user@192.168.97.149:~/

# 4. Applied on server
ssh tme-user@192.168.97.149
tar -xzf update-urgency-fix.tar.gz
docker cp .next/standalone/. tme-user-app-1:/app/
docker cp .next/static tme-user-app-1:/app/.next/
docker cp public/. tme-user-app-1:/app/public/
docker restart tme-user-app-1
```

## TO DO: Make This Fix Permanent

### Option 1: Keep Backend Mapping (RECOMMENDED)
This is the cleanest approach - frontend uses user-friendly terms, backend maps to database values.

**Already Done:**
- ✅ Backend API route maps values correctly

**Still Need to Do:**
1. Update the TypeScript type definition to match database:
   ```typescript
   // In src/types/review-system.ts
   export type UrgencyLevel = 'low' | 'medium' | 'high';
   ```

2. Update all 4 hooks to send correct values:
   - `src/hooks/useCostOverviewApplication.ts`
   - `src/hooks/useGoldenVisaApplication.ts`
   - `src/hooks/useCompanyServicesApplication.ts`
   - `src/hooks/useCITReturnLettersApplication.ts`
   
   Change from: `urgency: 'standard'`
   To: `urgency: 'medium'`

3. Update any UI components that show urgency options to use 'medium' instead of 'standard'

### Option 2: Update Database Constraint
Less recommended as it creates non-standard values in database.

```sql
-- Would need to run on production
ALTER TABLE applications DROP CONSTRAINT applications_urgency_check;
ALTER TABLE applications ADD CONSTRAINT applications_urgency_check 
  CHECK (urgency IN ('low', 'medium', 'high', 'standard', 'urgent'));
```

## Before Next Full Docker Deployment

### Pre-Deployment Checklist:
1. ✅ Ensure urgency mapping is in place in API route
2. ⬜ Update TypeScript types to reflect actual database values
3. ⬜ Fix all hooks to send correct urgency values
4. ⬜ Test thoroughly in dev environment
5. ⬜ Create proper migration if choosing database approach

### Build Commands:
```bash
# Always use production environment for builds
NODE_ENV=production npm run build

# For Docker builds
docker build -t tme-portal-server:latest .
```

## Current Working State
- ✅ All review submissions work (Golden Visa, Cost Overview, Company Services, CIT Letters)
- ✅ Backend correctly maps 'standard' → 'medium' and 'urgent' → 'high'
- ✅ Database integrity maintained
- ✅ No data loss or corruption
- ✅ Review messages table created and working
- ✅ User todos constraints fixed
- ✅ Conversation history now loads properly
- ✅ Form restoration after rejection works

## Additional Production Fixes Applied (August 30, 2025)

### 1. Missing Database Tables/Constraints
**Problem:** Migrations existed but weren't run in production
**Fixed by:**
- Manually created `review_messages` table (migration 009 existed but wasn't applied)
- Fixed `user_todos` categories constraint (added missing: 'task', 'deadline', 'system', 'to_send', 'send_approved_document')
- Created migration 013 to ensure future deployments get the fix

### 2. Critical Migration Files to Check
- ✅ `009_add_review_messages_history.sql` - Creates review_messages table
- ✅ `013_fix_user_todos_categories.sql` - Fixes user_todos constraints
- ⚠️  **IMPORTANT**: Ensure ALL migrations run during deployment!

## Lessons Learned
1. **Never modify database constraints manually in dev** without creating migrations
2. **Always check production database schema** before deploying
3. **Backend mapping is safer** than database schema changes in production
4. **Fast deployment works** for backend-only fixes (saved hours vs Docker rebuild)
5. **Migrations must be run** - Having migration files isn't enough, they must execute
6. **Test migration order** - Some migrations may depend on others

## Pre-Deployment Database Check Commands
```bash
# Run these on production BEFORE deploying to verify state
docker exec POSTGRES_CONTAINER psql -U tme_user -d tme_portal -c "\dt" # List all tables
docker exec POSTGRES_CONTAINER psql -U tme_user -d tme_portal -c "\d user_todos" # Check constraints
docker exec POSTGRES_CONTAINER psql -U tme_user -d tme_portal -c "\dt review_messages" # Check if exists
```

## Database Values Reference
```
Frontend Terms → Database Values
'standard'     → 'medium'
'urgent'       → 'high'
(unused)       → 'low'
```

## Final Resolution (August 31, 2025)

### Problem Solved
- Migration 002 was causing confusion by trying to change DB values to 'standard'/'urgent'
- Dev database had been modified to use 'standard'/'urgent' while production used 'low'/'medium'/'high'
- This created inconsistency between environments

### Solution Implemented
1. **Reverted dev database** to match production schema ('low'/'medium'/'high')
2. **Renamed problematic migration** 002 to prevent accidental execution
3. **Created documentation migration** 014 to document the mapping
4. **Kept the API mapping** as the permanent solution

### Current Architecture (FINAL)
- **Database Schema**: `urgency IN ('low', 'medium', 'high')` with default 'medium'
- **API Mapping**: Translates frontend 'standard'→'medium', 'urgent'→'high'
- **Both Environments**: Identical schema and behavior

### Why This Architecture is Good
1. **Separation of Concerns**: UI terms separate from database terms
2. **Flexibility**: Can change UI wording without database migrations
3. **Safety**: No risky production database changes needed
4. **Proven**: Working in production since August 30, 2025

### Files Changed Today
- Renamed: `database/migrations/002_update_urgency_levels.sql` → `002_update_urgency_levels.DEPRECATED_DO_NOT_RUN`
- Created: `database/migrations/014_document_urgency_mapping.sql`
- Updated: Dev database schema to match production