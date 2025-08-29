-- Update review_messages table to support resubmission message type
-- This allows tracking when an application is resubmitted after rejection

-- Add resubmission to the message_type check constraint
ALTER TABLE review_messages 
DROP CONSTRAINT IF EXISTS review_messages_message_type_check;

ALTER TABLE review_messages 
ADD CONSTRAINT review_messages_message_type_check 
CHECK (message_type IN ('comment', 'submission', 'approval', 'rejection', 'revision', 'resubmission'));

-- Add comment to clarify the new message type
COMMENT ON COLUMN review_messages.message_type IS 'Types: comment, submission, approval, rejection, revision, resubmission';