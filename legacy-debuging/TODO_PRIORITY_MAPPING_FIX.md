# Todo Priority Mapping Fix
Date: 2025-09-10

## Problem
The `user_todos` table priority constraint violations were occurring because:
- **Frontend/TypeScript** uses: `'standard'` and `'urgent'`
- **Database constraint** only allows: `'low'`, `'medium'`, `'high'`, `'urgent'`

## Root Cause
1. TypeScript types defined `TodoPriority = 'standard' | 'urgent'`
2. Todo generation rules returned `'standard'` for non-urgent todos
3. No mapping existed in `TodoService.create()` to convert values
4. The same issue was previously fixed for `applications.urgency` but not for `user_todos.priority`

## Solution Implemented
Added priority mapping in `TodoService.create()` (line 108-110):
```typescript
// Map frontend priority values to database values
// Frontend uses 'standard'/'urgent', database uses 'low'/'medium'/'high'/'urgent'
const mappedPriority = priority === 'standard' ? 'medium' : priority;
```

## Mapping Table
| Frontend Value | Database Value |
|---------------|----------------|
| 'standard'    | 'medium'       |
| 'urgent'      | 'urgent'       |

## Files Affected
1. `/src/lib/services/todo-service.ts` - Added mapping in create() method
2. Database constraint remains unchanged: `CHECK (priority IN ('low', 'medium', 'high', 'urgent'))`

## Why This Approach
- Matches the existing pattern used for `applications.urgency` field
- Maintains backward compatibility with existing frontend code
- No database migration needed
- Consistent with production environment

## Testing
The fix should resolve todo creation errors in:
- CIT Letters tab submissions
- Golden Visa tab submissions  
- Company Services tab submissions
- Any other workflow that creates todos with 'standard' priority

## Future Considerations
Consider updating TypeScript types to match database values:
- Change `TodoPriority = 'standard' | 'urgent'` to `'medium' | 'urgent'`
- Update all frontend components to use 'medium' instead of 'standard'
- This would eliminate the need for mapping but requires more extensive changes