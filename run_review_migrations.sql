-- Review System Multiple Rounds Migration Script
-- Run this script to add support for multiple review rounds

-- Step 1: Add revision_number column to applications table (if it doesn't exist)
DO $$
BEGIN
    -- Check if revision_number column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'applications' 
                  AND column_name = 'revision_number') THEN
        
        -- Add revision_number column
        ALTER TABLE applications 
        ADD COLUMN revision_number INTEGER DEFAULT 1 NOT NULL;
        
        -- Add comment for the new column
        COMMENT ON COLUMN applications.revision_number IS 'Tracks the revision number for resubmissions after rejections';
        
        -- Create index for better performance
        CREATE INDEX idx_applications_revision_number ON applications(revision_number);
        
        -- Update existing applications to have revision_number = 1
        UPDATE applications SET revision_number = 1 WHERE revision_number IS NULL;
        
        RAISE NOTICE 'Added revision_number column to applications table';
    ELSE
        RAISE NOTICE 'revision_number column already exists in applications table';
    END IF;
END $$;

-- Step 2: Update review_messages message_type constraint (if needed)
DO $$
BEGIN
    -- Drop existing constraint if it exists
    BEGIN
        ALTER TABLE review_messages 
        DROP CONSTRAINT IF EXISTS review_messages_message_type_check;
    EXCEPTION 
        WHEN undefined_table THEN 
            RAISE NOTICE 'review_messages table does not exist yet - this is normal for new installations';
            RETURN;
    END;
    
    -- Add updated constraint with resubmission type
    ALTER TABLE review_messages 
    ADD CONSTRAINT review_messages_message_type_check 
    CHECK (message_type IN ('comment', 'submission', 'approval', 'rejection', 'revision', 'resubmission'));
    
    -- Add comment to clarify the new message type
    COMMENT ON COLUMN review_messages.message_type IS 'Types: comment, submission, approval, rejection, revision, resubmission';
    
    RAISE NOTICE 'Updated review_messages message_type constraint';
END $$;

-- Verification queries
SELECT 'Applications with revision tracking:' as info, COUNT(*) as count 
FROM applications WHERE revision_number IS NOT NULL;

SELECT 'Review message types available:' as info, 
       STRING_AGG(DISTINCT message_type, ', ') as types
FROM review_messages 
WHERE message_type IS NOT NULL;