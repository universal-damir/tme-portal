-- Document Urgency Mapping
-- Created: August 31, 2025
-- Purpose: Document the urgency value mapping between frontend and database
-- 
-- IMPORTANT: This migration only adds documentation, no schema changes
-- The mapping is handled in the API layer for clean separation of concerns
--
-- Mapping:
--   Frontend sends → Database stores
--   'standard'     → 'medium'  
--   'urgent'       → 'high'
--   (unused)       → 'low'

-- Add documentation comment to the urgency column
COMMENT ON COLUMN applications.urgency IS 
'Urgency levels: low, medium, high. Frontend sends standard->medium, urgent->high via API mapping in /api/applications/[id]/submit-review';

-- Ensure the constraint is correct (safe to run multiple times)
DO $$ 
BEGIN
    -- Check if constraint exists with correct definition
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'applications_urgency_check' 
        AND pg_get_constraintdef(oid) LIKE '%low%medium%high%'
    ) THEN
        -- Drop any incorrect constraint
        ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_urgency_check;
        
        -- Add correct constraint
        ALTER TABLE applications ADD CONSTRAINT applications_urgency_check 
        CHECK (urgency IN ('low', 'medium', 'high'));
    END IF;
END $$;

-- Ensure default value is correct
ALTER TABLE applications ALTER COLUMN urgency SET DEFAULT 'medium';

-- Note for developers:
-- The frontend uses user-friendly terms ('standard', 'urgent')
-- The database uses technical terms ('low', 'medium', 'high')  
-- The API layer handles the translation - this is intentional and provides flexibility