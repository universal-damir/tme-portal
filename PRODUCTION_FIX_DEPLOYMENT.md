# Production Deployment - Review Submission Fix

## Changes Made

### 1. Database Connection Pool Improvements
- **Increased pool size**: 20 → 50 connections
- **Added connection timeout**: 2s → 5s  
- **Added maxUses**: Connections auto-close after 7500 uses
- **Added proper client release**: Transactions now always release connections

### 2. Transaction Handling Fix
- **Before**: Used pool directly (could leak connections)
- **After**: Uses dedicated client with proper release in finally block
- **Files changed**: `/src/lib/services/review-system.ts`

### 3. API Route Improvements
- **Added retry logic**: 3 attempts with exponential backoff
- **Added timeout**: 10 second timeout per attempt
- **Files changed**: `/src/app/api/applications/[id]/submit-review/route.ts`

### 4. Client-Side Recovery
- **Added safety timeout**: 15 second auto-recovery
- **Better error handling**: Always resets submission state
- **Files changed**: `/src/components/review-system/modals/ReviewSubmissionModal.tsx`

## Deployment Commands

Run these commands on your production server:

### Step 1: Backup Current State
```bash
# Create backup of current app
docker create --name backup-app tme-portal-app:latest
docker commit backup-app tme-portal-app:backup-$(date +%Y%m%d-%H%M%S)
docker rm backup-app
```

### Step 2: Pull Latest Code
```bash
cd /root/tme-portal
git pull origin main
```

### Step 3: Build New Image
```bash
# Build the production image
docker build -t tme-portal-app:latest .
```

### Step 4: Deploy with Zero Downtime
```bash
# Start new container alongside old one
docker run -d \
  --name tme-portal-app-new \
  --network tme-network \
  -p 3001:3000 \
  --env-file .env.production \
  tme-portal-app:latest

# Wait for new container to be healthy (check logs)
docker logs -f tme-portal-app-new --tail 50

# Once healthy, switch traffic
docker stop tme-portal-app
docker rm tme-portal-app
docker rename tme-portal-app-new tme-portal-app

# Update nginx to point to new container (if needed)
docker restart tme-portal-nginx
```

### Step 5: Verify Fix
```bash
# Check database connections
docker exec -it tme-portal-db psql -U postgres -d tme_portal -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'tme_portal' AND state != 'idle';"

# Monitor logs for errors
docker logs -f tme-portal-app --tail 100 | grep "🔧"

# Check for connection pool errors
docker logs tme-portal-app 2>&1 | grep -i "pool\|connection\|timeout"
```

## Quick Rollback (if needed)
```bash
# Stop new version
docker stop tme-portal-app
docker rm tme-portal-app

# Restore backup
docker run -d \
  --name tme-portal-app \
  --network tme-network \
  -p 3000:3000 \
  --env-file .env.production \
  tme-portal-app:backup-[timestamp]

docker restart tme-portal-nginx
```

## Monitor After Deployment

### Check Connection Pool Usage
```sql
-- Run this in PostgreSQL
SELECT 
    count(*) as active_connections,
    max(now() - state_change) as longest_connection_time
FROM pg_stat_activity 
WHERE datname = 'tme_portal' 
AND state != 'idle';
```

### Check for Stuck Transactions
```sql
-- Find long-running queries
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    state,
    query
FROM pg_stat_activity
WHERE datname = 'tme_portal'
AND (now() - pg_stat_activity.query_start) > interval '30 seconds'
AND state != 'idle';
```

### Monitor Application Logs
```bash
# Watch for submission errors
docker logs -f tme-portal-app 2>&1 | grep -E "submitForReview|transaction error|pool error"

# Check retry attempts
docker logs tme-portal-app 2>&1 | grep "Submit attempt"
```

## Success Indicators

✅ **Fixed Issues:**
- No more "connection pool exhausted" errors
- Modal doesn't get stuck in submitting state
- Transactions always release connections
- Automatic retry on temporary failures

✅ **What to Expect:**
- Users can submit multiple forms rapidly
- System handles 50+ concurrent submissions
- Failed submissions auto-retry up to 3 times
- Modal always recovers within 15 seconds

## Testing the Fix

1. Open two browser windows with different accounts
2. Submit 10+ forms rapidly between accounts
3. Check that all submissions complete
4. Monitor database connections (should stay under 30)

## Support Commands

### Emergency Connection Reset
```bash
# Kill all database connections and restart app
docker exec -it tme-portal-db psql -U postgres -d tme_portal -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'tme_portal' AND pid <> pg_backend_pid();"
docker restart tme-portal-app
```

### Increase Pool Size Further (if needed)
Edit the deployed container's environment:
```bash
docker exec -it tme-portal-app sh -c "echo 'export DB_POOL_MAX=100' >> /app/.env.production"
docker restart tme-portal-app
```