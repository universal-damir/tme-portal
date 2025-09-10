-- Add missing todo categories used in CIT Letters and other workflows
-- Date: 2025-09-10
-- Issue: CIT Letters and other submissions failing due to missing 'to_check' and 'to_follow_up' categories

-- Drop the old constraint
ALTER TABLE user_todos DROP CONSTRAINT IF EXISTS user_todos_category_check;

-- Add new constraint with all required categories including the missing ones
ALTER TABLE user_todos ADD CONSTRAINT user_todos_category_check 
  CHECK (category IN (
    'review',                -- Original: document review tasks
    'follow_up',            -- Original: follow-up tasks
    'reminder',             -- Original: reminders
    'action',               -- Original: action items
    'task',                 -- Added: general tasks
    'deadline',             -- Added: deadline-based todos
    'system',               -- Added: system-generated todos
    'to_send',              -- Added: documents to send (for approved documents)
    'send_approved_document', -- Added: approved documents to send
    'to_check',             -- Added: documents to check/review (used in review_requested)
    'to_follow_up'          -- Added: follow-up items (used in various workflows)
  ));

-- Add comment for documentation
COMMENT ON COLUMN user_todos.category IS 'Category of todo: review, follow_up, reminder, action, task, deadline, system, to_send, send_approved_document, to_check, to_follow_up';