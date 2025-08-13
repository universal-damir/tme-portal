# Review Submission Modal Debug Guide

## Issue Description
The review submission modal stops working after submitting a few forms when testing with multiple accounts. Works on different computers but fails on the same machine after several submissions.

## Likely Causes

### 1. Database Connection Pool Exhaustion
**Location**: `/src/lib/services/review-system.ts:19-31`
- Pool has max 20 connections
- Transactions may not be releasing connections properly on errors
- Check: Monitor active database connections in production

### 2. Transaction Deadlock/Hanging
**Location**: `/src/lib/services/review-system.ts:580-614` (submitForReview method)
- Transaction uses BEGIN/COMMIT/ROLLBACK
- If notification creation fails (line 596-606), connection might hang
- The `safeDbOperation` wrapper might be masking errors

### 3. Client-Side State Issues
**Location**: `/src/components/review-system/modals/ReviewSubmissionModal.tsx`
- Modal state might not reset properly on errors
- `isSubmitting` flag might stay true, preventing future submissions

## Immediate Debugging Steps

### 1. Check Browser Console
```javascript
// In browser console when issue occurs:
console.log('Check for stuck requests');
// Look for:
// - Network requests stuck in pending
// - JavaScript errors
// - Console logs starting with "🔧"
```

### 2. Check Server Logs
```bash
# SSH into production server
docker logs tme-portal-app -f --tail 100

# Look for:
# - "🔧 API ROUTE:" messages
# - "🔧 BACKEND:" messages
# - Transaction errors
# - Connection timeout errors
```

### 3. Check Database Connections
```sql
-- Run in PostgreSQL to check active connections
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    state_change,
    query
FROM pg_stat_activity
WHERE datname = 'tme_portal'
AND state != 'idle'
ORDER BY state_change;

-- Check for locked queries
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
AND state != 'idle';
```

### 4. Monitor Network Tab
1. Open Chrome DevTools → Network tab
2. Submit a form
3. Look for `/api/applications/[id]/submit-review` request
4. Check:
   - Status code (should be 200)
   - Response time (should be < 2 seconds)
   - Response body for error messages

## Quick Fixes to Try

### 1. Clear Browser State
```javascript
// Run in browser console
localStorage.clear();
sessionStorage.clear();
// Then refresh the page
```

### 2. Restart Docker Container
```bash
docker restart tme-portal-app
```

### 3. Reset Database Connections
```bash
# Kill all connections and restart
docker exec -it tme-portal-db psql -U postgres -d tme_portal -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'tme_portal' AND pid <> pg_backend_pid();"
docker restart tme-portal-app
```

## Code Fix Recommendations

### 1. Add Connection Release in review-system.ts
```typescript
// In submitForReview method, ensure connection release:
const client = await pool.connect();
try {
  await client.query('BEGIN');
  // ... operations
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release(); // IMPORTANT: Always release
}
```

### 2. Add Timeout to API Route
```typescript
// In submit-review/route.ts
const timeout = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Request timeout')), 10000)
);

try {
  const result = await Promise.race([
    ApplicationsService.submitForReview(...),
    timeout
  ]);
} catch (error) {
  // Handle timeout
}
```

### 3. Add Better Error Recovery in Modal
```typescript
// In ReviewSubmissionModal.tsx handleSubmit
} catch (error) {
  setError(error instanceof Error ? error.message : 'An unexpected error occurred');
  setIsSubmitting(false); // Ensure this always resets
} finally {
  // Add timeout safety
  setTimeout(() => {
    setIsSubmitting(false);
  }, 5000);
}
```

## Monitoring Points

1. **API Response Times**: Should be < 2 seconds
2. **Database Pool Usage**: Should not exceed 15/20 connections
3. **Error Logs**: Look for "ROLLBACK" messages
4. **Browser Console**: No hanging promises or network requests
5. **Modal State**: `isSubmitting` should reset after 5 seconds max

## Emergency Workaround

If the issue persists in production:

1. **Increase connection pool**:
```javascript
// In review-system.ts
max: 50, // Increase from 20
```

2. **Add request retry logic**:
```javascript
// In modal submission
let retries = 3;
while (retries > 0) {
  try {
    await onSubmit(...);
    break;
  } catch (error) {
    retries--;
    if (retries === 0) throw error;
    await new Promise(r => setTimeout(r, 1000));
  }
}
```

3. **Enable debug mode temporarily**:
Set `REVIEW_SYSTEM_DEBUG=true` in environment to get detailed error messages.

## Contact for Help

If the issue persists after trying these steps:
1. Check the detailed logs with timestamps
2. Note which user accounts are affected
3. Record the exact sequence of actions that triggers the issue
4. Check if it's browser-specific (try Chrome, Firefox, Safari)