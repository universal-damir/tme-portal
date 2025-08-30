-- User Todos System Migration
-- Phase 1: Database Foundation for Notification-to-Todo Integration
-- TME Portal

-- Add todo tracking columns to existing notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS todo_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS todo_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS todo_dismissed BOOLEAN DEFAULT FALSE;

-- Create user_todos table - Main todo management system
CREATE TABLE IF NOT EXISTS user_todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,
    
    -- Todo content
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('review', 'follow_up', 'reminder', 'action')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Status and timing
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'dismissed', 'expired')),
    due_date TIMESTAMP,
    auto_generated BOOLEAN DEFAULT TRUE,
    
    -- Action metadata for smart handling
    action_type VARCHAR(50), -- 'contact_client', 'review_document', 'send_document', 'follow_up_call'
    action_data JSONB, -- Client info, document details, form data
    
    -- Related entities for context
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    client_name VARCHAR(255),
    document_type VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    dismissed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes for user_todos
CREATE INDEX IF NOT EXISTS idx_user_todos_user_id ON user_todos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_todos_status ON user_todos(status);
CREATE INDEX IF NOT EXISTS idx_user_todos_due_date ON user_todos(due_date);
CREATE INDEX IF NOT EXISTS idx_user_todos_category ON user_todos(category);
CREATE INDEX IF NOT EXISTS idx_user_todos_priority ON user_todos(priority);
CREATE INDEX IF NOT EXISTS idx_user_todos_notification_id ON user_todos(notification_id);
CREATE INDEX IF NOT EXISTS idx_user_todos_created_at ON user_todos(created_at);
CREATE INDEX IF NOT EXISTS idx_user_todos_application_id ON user_todos(application_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_todos_user_status ON user_todos(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_todos_user_due_date ON user_todos(user_id, due_date) WHERE status IN ('pending', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_user_todos_overdue ON user_todos(due_date, status) WHERE due_date < CURRENT_TIMESTAMP AND status IN ('pending', 'in_progress');

-- Add updated_at trigger for user_todos
CREATE OR REPLACE FUNCTION update_user_todos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_user_todos_updated_at 
    BEFORE UPDATE ON user_todos 
    FOR EACH ROW EXECUTE FUNCTION update_user_todos_updated_at();

-- Add new permissions for todo system
INSERT INTO permissions (name, description, resource, action) VALUES
('manage_todos', 'Manage personal todo items', 'todos', 'write'),
('view_todos', 'View personal todo items', 'todos', 'read')
ON CONFLICT (name) DO NOTHING;

-- Grant basic todo permissions to all existing users via their roles
-- This assumes standard user roles exist
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name IN ('user', 'admin', 'reviewer') 
AND p.name IN ('view_todos', 'manage_todos')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- Create helpful views for common queries

-- Active todos view
CREATE OR REPLACE VIEW active_todos AS
SELECT 
    ut.*,
    u.full_name as user_name,
    u.email as user_email,
    n.title as notification_title,
    n.type as notification_type,
    CASE 
        WHEN ut.due_date < CURRENT_TIMESTAMP AND ut.status IN ('pending', 'in_progress') THEN true
        ELSE false 
    END as is_overdue,
    CASE
        WHEN ut.due_date < CURRENT_TIMESTAMP + INTERVAL '24 hours' AND ut.status IN ('pending', 'in_progress') THEN true
        ELSE false
    END as is_due_soon
FROM user_todos ut
JOIN users u ON ut.user_id = u.id
LEFT JOIN notifications n ON ut.notification_id = n.id
WHERE ut.status IN ('pending', 'in_progress')
ORDER BY 
    CASE ut.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
    END,
    ut.due_date ASC NULLS LAST;

-- User todo statistics view
CREATE OR REPLACE VIEW user_todo_stats AS
SELECT 
    user_id,
    COUNT(*) as total_todos,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
    COUNT(*) FILTER (WHERE status = 'dismissed') as dismissed_count,
    COUNT(*) FILTER (WHERE due_date < CURRENT_TIMESTAMP AND status IN ('pending', 'in_progress')) as overdue_count,
    COUNT(*) FILTER (WHERE due_date < CURRENT_TIMESTAMP + INTERVAL '24 hours' AND status IN ('pending', 'in_progress')) as due_soon_count
FROM user_todos
GROUP BY user_id;

-- Add comments for documentation
COMMENT ON TABLE user_todos IS 'Smart todo items generated from notifications and user actions';
COMMENT ON COLUMN user_todos.category IS 'Todo category: review, follow_up, reminder, action';
COMMENT ON COLUMN user_todos.priority IS 'Priority level: low, medium, high, urgent';
COMMENT ON COLUMN user_todos.action_type IS 'Specific action required: contact_client, review_document, etc.';
COMMENT ON COLUMN user_todos.action_data IS 'JSON data containing context for the action (client info, document details, etc.)';
COMMENT ON COLUMN user_todos.auto_generated IS 'Whether this todo was automatically generated from a notification';

-- Migration verification queries (commented out for production)
/*
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('user_todos');

-- Verify indexes exist
SELECT indexname FROM pg_indexes 
WHERE tablename = 'user_todos';

-- Verify triggers exist
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'user_todos';

-- Verify views exist
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public' AND table_name IN ('active_todos', 'user_todo_stats');
*/