-- Migration: Add metadata column to notifications table
-- This enables profile photos and enhanced notification data
-- Date: 2025-08-22

BEGIN;

-- Add metadata column to store notification context (employee codes, etc.)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create index on metadata for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_metadata ON notifications USING GIN (metadata);

-- Add comment for documentation
COMMENT ON COLUMN notifications.metadata IS 'JSON metadata containing employee codes and other notification context for profile photos and enhanced UI';

COMMIT;