# Review System Multiple Rounds Migration

This directory contains the complete migration for implementing conversation history across multiple review rounds in the TME Portal review system.

## Migration Files

### Primary Migration
- `012_review_system_multiple_rounds_complete.sql` - **Complete migration script (RECOMMENDED)**
  - Adds `revision_number` column to `applications` table
  - Creates `review_messages` table with full conversation history support
  - Updates constraints to support `resubmission` message type
  - Safe to run multiple times (uses IF NOT EXISTS)

### Individual Migration Files (Legacy)
- `010_add_application_revision_tracking.sql` - Adds revision_number column
- `011_update_review_messages_types.sql` - Updates message type constraint
- `run_review_migrations.sql` - Combined script with additional checks

## How to Apply Migration

### Method 1: Complete Migration (Recommended)
```bash
psql -d your_database_name -f database/migrations/012_review_system_multiple_rounds_complete.sql
```

### Method 2: Using Environment Variable
```bash
psql $DATABASE_URL -f database/migrations/012_review_system_multiple_rounds_complete.sql
```

### Method 3: Manual Commands
```sql
-- Connect to your database and run:
\i database/migrations/012_review_system_multiple_rounds_complete.sql
```

## What This Migration Does

### 1. Applications Table Enhancement
- Adds `revision_number` column (tracks how many times application was resubmitted)
- Creates index for performance
- Sets default value of 1 for existing applications

### 2. Review Messages Table
- Creates complete conversation history table
- Supports message types: comment, submission, approval, rejection, revision, **resubmission**
- Includes proper foreign key constraints
- Creates performance indexes

### 3. Database Constraints
- Updates message type constraint to include `resubmission`
- Ensures data integrity with proper CHECK constraints

## Features Enabled

After migration, the review system supports:

✅ **Multiple Review Rounds** - Same application can be reviewed multiple times
✅ **Conversation Threading** - Complete message history preserved across cycles
✅ **Round Indicators** - UI shows "Round 1", "Round 2", etc.
✅ **Message Type Badges** - "Initial Submit", "Resubmitted", "Approved", "Rejected"
✅ **Status Progression** - Visual tracking of review progression
✅ **Backward Compatibility** - Existing applications continue to work

## Verification

After running the migration, you can verify success:

```sql
-- Check revision_number column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'applications' AND column_name = 'revision_number';

-- Check review_messages table exists
SELECT table_name FROM information_schema.tables WHERE table_name = 'review_messages';

-- Check message_type constraint includes resubmission
SELECT check_clause 
FROM information_schema.check_constraints cc
JOIN information_schema.table_constraints tc ON cc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'review_messages' AND tc.constraint_type = 'CHECK';

-- Test data
SELECT COUNT(*) as total_applications, 
       COUNT(CASE WHEN revision_number IS NOT NULL THEN 1 END) as with_revision_tracking
FROM applications;
```

## Rollback (If Needed)

If you need to rollback the migration:

```sql
-- Remove revision_number column
ALTER TABLE applications DROP COLUMN IF EXISTS revision_number;

-- Drop review_messages table (WARNING: This removes all conversation history)
DROP TABLE IF EXISTS review_messages CASCADE;
```

## Troubleshooting

### Common Issues

1. **Permission Error**: Ensure you have ALTER TABLE permissions
2. **Foreign Key Error**: Ensure `applications` and `users` tables exist
3. **Constraint Error**: If migration fails, check if older constraints exist

### Support

If you encounter issues:
1. Check PostgreSQL logs for detailed error messages
2. Ensure database user has proper permissions
3. Verify all referenced tables (`applications`, `users`) exist

## File Structure After Migration

```
database/
├── migrations/
│   ├── 012_review_system_multiple_rounds_complete.sql  ← Use this one
│   ├── 010_add_application_revision_tracking.sql       ← Legacy
│   ├── 011_update_review_messages_types.sql            ← Legacy
│   └── run_review_migrations.sql                       ← Legacy
└── README_REVIEW_SYSTEM.md                             ← This file
```

## Implementation Details

- **Application ID Preservation**: Applications keep same ID across review cycles
- **Message Threading**: Messages grouped by review rounds in UI
- **Type Safety**: TypeScript interfaces updated to support new message types
- **Performance**: Indexes created for optimal query performance
- **Error Handling**: Graceful fallbacks for missing columns/tables