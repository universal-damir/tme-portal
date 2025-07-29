-- Review System Rollback Migration
-- Safely removes all review system components

-- Remove permissions
DELETE FROM permissions WHERE name IN ('review_applications', 'view_notifications', 'manage_notifications');

-- Drop indexes
DROP INDEX IF EXISTS idx_notifications_application_id;
DROP INDEX IF EXISTS idx_notifications_created_at;
DROP INDEX IF EXISTS idx_notifications_is_read;
DROP INDEX IF EXISTS idx_notifications_user_id;

DROP INDEX IF EXISTS idx_applications_created_at;
DROP INDEX IF EXISTS idx_applications_type;
DROP INDEX IF EXISTS idx_applications_status;
DROP INDEX IF EXISTS idx_applications_reviewer;
DROP INDEX IF EXISTS idx_applications_submitted_by;

-- Drop trigger
DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;

-- Drop tables (notifications first due to foreign key)
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS applications;