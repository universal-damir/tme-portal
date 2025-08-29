-- Complete Review System Multiple Rounds Migration
-- This migration adds support for conversation history across multiple review cycles
-- Created: 2025-08-29

-- Step 1: Add revision tracking to applications table
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS revision_number INTEGER DEFAULT 1 NOT NULL;

-- Add comment for the new column
COMMENT ON COLUMN applications.revision_number IS 'Tracks the revision number for resubmissions after rejections';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_applications_revision_number ON applications(revision_number);

-- Update existing applications to have revision_number = 1
UPDATE applications SET revision_number = 1 WHERE revision_number IS NULL;

-- Step 2: Create review_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS review_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('submitter', 'reviewer')),
    message TEXT NOT NULL,
    message_type VARCHAR(30) DEFAULT 'comment' CHECK (message_type IN ('comment', 'submission', 'approval', 'rejection', 'revision', 'resubmission')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add comment for the message_type column
COMMENT ON COLUMN review_messages.message_type IS 'Message types: comment, submission, approval, rejection, revision, resubmission';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_review_messages_application_id ON review_messages(application_id);
CREATE INDEX IF NOT EXISTS idx_review_messages_user_id ON review_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_review_messages_created_at ON review_messages(created_at);

-- Step 3: Update message_type constraint if it exists without resubmission
DO $$
BEGIN
    -- Check if constraint exists and doesn't include resubmission
    IF EXISTS (
        SELECT 1 
        FROM information_schema.check_constraints cc
        JOIN information_schema.table_constraints tc ON cc.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'review_messages' 
        AND tc.constraint_type = 'CHECK'
        AND cc.constraint_name = 'review_messages_message_type_check'
        AND cc.check_clause NOT LIKE '%resubmission%'
    ) THEN
        -- Drop and recreate the constraint with resubmission included
        ALTER TABLE review_messages DROP CONSTRAINT review_messages_message_type_check;
        ALTER TABLE review_messages ADD CONSTRAINT review_messages_message_type_check 
        CHECK (message_type IN ('comment', 'submission', 'approval', 'rejection', 'revision', 'resubmission'));
        
        RAISE NOTICE 'Updated review_messages message_type constraint to include resubmission';
    END IF;
END $$;

-- Verification queries
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Applications with revision tracking: %', (SELECT COUNT(*) FROM applications WHERE revision_number IS NOT NULL);
    RAISE NOTICE 'Review messages table exists: %', (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'review_messages'));
END $$;