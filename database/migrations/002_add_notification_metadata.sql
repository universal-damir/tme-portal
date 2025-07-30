-- Add metadata column to notifications table for storing profile info and other data
-- This migration adds support for profile pictures and enhanced notification data

ALTER TABLE notifications ADD COLUMN metadata JSONB DEFAULT '{}';

-- Add index for metadata queries
CREATE INDEX idx_notifications_metadata ON notifications USING GIN (metadata);