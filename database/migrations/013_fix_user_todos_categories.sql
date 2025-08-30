-- Fix user_todos category constraint to include all needed categories
-- Date: 2025-08-30
-- Issue: Production was missing several category types causing todo creation to fail

-- Drop the old constraint
ALTER TABLE user_todos DROP CONSTRAINT IF EXISTS user_todos_category_check;

-- Add new constraint with all required categories
ALTER TABLE user_todos ADD CONSTRAINT user_todos_category_check 
  CHECK (category IN (
    'review',                -- Original: document review tasks
    'follow_up',            -- Original: follow-up tasks
    'reminder',             -- Original: reminders
    'action',               -- Original: action items
    'task',                 -- Added: general tasks
    'deadline',             -- Added: deadline-based todos
    'system',               -- Added: system-generated todos
    'to_send',              -- Added: documents to send
    'send_approved_document' -- Added: approved documents to send
  ));

-- Add comment for documentation
COMMENT ON COLUMN user_todos.category IS 'Category of todo: review, follow_up, reminder, action, task, deadline, system, to_send, send_approved_document';