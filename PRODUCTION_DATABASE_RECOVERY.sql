-- TME PORTAL PRODUCTION DATABASE RECOVERY
-- Complete schema migration to restore all missing tables
-- Run this script to fix the incomplete database schema issue
-- Date: 2025-08-30

-- ==============================================================================
-- CRITICAL: This script contains ALL missing production tables
-- ==============================================================================

BEGIN;

-- 1. REVIEW SYSTEM FOUNDATION
-- ==============================================================================

-- Applications table - Generic application storage
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('golden-visa', 'cost-overview', 'company-services', 'taxation', 'corporate-changes')),
    title VARCHAR(255) NOT NULL,
    form_data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'under_review', 'approved', 'rejected')),
    
    -- User relationships
    submitted_by_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Review details
    review_comments TEXT,
    urgency VARCHAR(10) DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high')),
    
    -- Revision tracking (added in migration 012)
    revision_number INTEGER DEFAULT 1 NOT NULL,
    
    -- Timestamps
    submitted_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table - In-app notification system
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('review_requested', 'review_completed', 'application_approved', 'application_rejected')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Related application
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    
    -- Status and metadata
    is_read BOOLEAN DEFAULT false,
    metadata JSONB, -- Added in migration 004
    
    -- Todo integration (added in migration 003)
    todo_generated BOOLEAN DEFAULT FALSE,
    todo_completed BOOLEAN DEFAULT FALSE,
    todo_dismissed BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Review messages table - Conversation history
CREATE TABLE IF NOT EXISTS review_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('submitter', 'reviewer')),
    message TEXT NOT NULL,
    message_type VARCHAR(30) DEFAULT 'comment' CHECK (message_type IN ('comment', 'submission', 'approval', 'rejection', 'revision', 'resubmission')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TODO SYSTEM
-- ==============================================================================

-- User todos table - Main todo management system
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
    action_type VARCHAR(50),
    action_data JSONB,
    
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

-- 3. CLIENT MANAGEMENT
-- ==============================================================================

-- Clients table - Core client database
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    company_code VARCHAR(10) UNIQUE NOT NULL,
    company_name VARCHAR(500) NOT NULL,
    company_name_short VARCHAR(200) NOT NULL,
    registered_authority VARCHAR(100) NOT NULL CHECK (registered_authority IN (
        'AJM Ajman FZ', 'AUH DED', 'AUH Masdar FZ', 'DXB DACC', 'DXB DAC',
        'DXB DAFZ FZ', 'DXB DDA FZ', 'DXB DET', 'DXB DHCC FZ', 'DXB DIFC FZ',
        'DXB DMCC FZ', 'DXB DSO FZ', 'DXB DWC FZ', 'DXB DWTC FZ', 'DXB ECDA FZ',
        'DXB IFZA FZ', 'DXB JAFZA FZ', 'DXB JAFZA Offshore', 'DXB Meydan FZ',
        'FUJ FM FZ', 'FUJ Fujairah FZ', 'RAK RAKEZ FZ', 'RAK RAKICC Offshore',
        'RAK RAKMC FZ', 'SHJ Hamriyah FZ', 'SHJ SAIF FZ', 'SHJ Shams FZ',
        'SHJ SPC FZ', 'UMM Umm Al Quwain FZ', 'X Not registered', 'X Outside UAE'
    )),
    
    -- Management information (split fields from migration 006)
    management_first_name VARCHAR(150),
    management_last_name VARCHAR(150),
    management_name VARCHAR(300) NOT NULL,
    management_email VARCHAR(255) NOT NULL,
    
    -- Location and registration details
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'UAE', -- Added in migration 007
    po_box VARCHAR(50),
    vat_trn VARCHAR(50),
    
    -- Status and notes
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    notes TEXT,
    
    -- Timestamps and audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id)
);

-- 4. CREATE ALL INDEXES
-- ==============================================================================

-- Applications indexes
CREATE INDEX IF NOT EXISTS idx_applications_submitted_by ON applications(submitted_by_id);
CREATE INDEX IF NOT EXISTS idx_applications_reviewer ON applications(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_type ON applications(type);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);
CREATE INDEX IF NOT EXISTS idx_applications_revision_number ON applications(revision_number);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_application_id ON notifications(application_id);
CREATE INDEX IF NOT EXISTS idx_notifications_metadata ON notifications USING GIN (metadata);

-- Review messages indexes
CREATE INDEX IF NOT EXISTS idx_review_messages_application_id ON review_messages(application_id);
CREATE INDEX IF NOT EXISTS idx_review_messages_user_id ON review_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_review_messages_created_at ON review_messages(created_at);

-- User todos indexes
CREATE INDEX IF NOT EXISTS idx_user_todos_user_id ON user_todos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_todos_status ON user_todos(status);
CREATE INDEX IF NOT EXISTS idx_user_todos_due_date ON user_todos(due_date);
CREATE INDEX IF NOT EXISTS idx_user_todos_category ON user_todos(category);
CREATE INDEX IF NOT EXISTS idx_user_todos_priority ON user_todos(priority);
CREATE INDEX IF NOT EXISTS idx_user_todos_notification_id ON user_todos(notification_id);
CREATE INDEX IF NOT EXISTS idx_user_todos_created_at ON user_todos(created_at);
CREATE INDEX IF NOT EXISTS idx_user_todos_application_id ON user_todos(application_id);
CREATE INDEX IF NOT EXISTS idx_user_todos_user_status ON user_todos(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_todos_user_due_date ON user_todos(user_id, due_date) WHERE status IN ('pending', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_user_todos_overdue ON user_todos(due_date, status) WHERE due_date < CURRENT_TIMESTAMP AND status IN ('pending', 'in_progress');

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_company_code ON clients(company_code);
CREATE INDEX IF NOT EXISTS idx_clients_registered_authority ON clients(registered_authority);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);
CREATE INDEX IF NOT EXISTS idx_clients_company_name ON clients USING gin(to_tsvector('english', company_name));
CREATE INDEX IF NOT EXISTS idx_clients_country ON clients(country);

-- 5. UPDATE TRIGGERS
-- ==============================================================================

-- Add updated_at triggers
CREATE TRIGGER IF NOT EXISTS update_applications_updated_at 
    BEFORE UPDATE ON applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

CREATE TRIGGER IF NOT EXISTS update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. ADD MISSING PERMISSIONS
-- ==============================================================================

-- Review system permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('review_applications', 'Review submitted applications', 'applications', 'review'),
('view_notifications', 'View in-app notifications', 'notifications', 'read'),
('manage_notifications', 'Manage notification settings', 'notifications', 'write')
ON CONFLICT (name) DO NOTHING;

-- Todo system permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('manage_todos', 'Manage personal todo items', 'todos', 'write'),
('view_todos', 'View personal todo items', 'todos', 'read')
ON CONFLICT (name) DO NOTHING;

-- Client management permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('client_management_read', 'View client database', 'clients', 'read'),
('client_management_write', 'Create and edit clients', 'clients', 'write'),
('client_management_delete', 'Delete clients', 'clients', 'delete'),
('client_management_export', 'Export client data', 'clients', 'export')
ON CONFLICT (name) DO NOTHING;

-- 7. ADD AUDIT LOG EXTENSIONS
-- ==============================================================================

-- Add client_id column to audit_logs if it doesn't exist
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id);

-- 8. CREATE HELPFUL VIEWS
-- ==============================================================================

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

-- 9. GRANT PERMISSIONS TO ADMIN USERS
-- ==============================================================================

DO $$
DECLARE
    admin_user RECORD;
    perm_id INTEGER;
BEGIN
    -- Grant client management permissions to all admin users
    FOR perm_id IN 
        SELECT id FROM permissions WHERE resource IN ('clients', 'applications', 'notifications', 'todos')
    LOOP
        FOR admin_user IN 
            SELECT id FROM users WHERE role = 'admin'
        LOOP
            INSERT INTO user_permissions (user_id, permission_id, granted_by, granted_at)
            VALUES (admin_user.id, perm_id, admin_user.id, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, permission_id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- 10. FINAL VERIFICATION
-- ==============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TME PORTAL DATABASE RECOVERY COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables created/verified:';
    RAISE NOTICE '- applications: %', (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'applications'));
    RAISE NOTICE '- notifications: %', (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications'));
    RAISE NOTICE '- review_messages: %', (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'review_messages'));
    RAISE NOTICE '- user_todos: %', (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_todos'));
    RAISE NOTICE '- clients: %', (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients'));
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Users count: %', (SELECT COUNT(*) FROM users);
    RAISE NOTICE 'Permissions count: %', (SELECT COUNT(*) FROM permissions);
    RAISE NOTICE '========================================';
END $$;

COMMIT;