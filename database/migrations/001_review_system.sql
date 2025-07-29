-- Review System Database Migration
-- Generic review system for all application types
-- Safe migration - only adds new tables, doesn't modify existing ones

-- Applications table - Generic application storage
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('golden-visa', 'cost-overview', 'company-services', 'taxation', 'corporate-changes')),
    title VARCHAR(255) NOT NULL, -- Human readable title
    form_data JSONB NOT NULL, -- Form data specific to each type
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'under_review', 'approved', 'rejected')),
    
    -- User relationships
    submitted_by_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Review details
    review_comments TEXT,
    urgency VARCHAR(10) DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high')),
    
    -- Timestamps
    submitted_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table - In-app notification system
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('review_requested', 'review_completed', 'application_approved', 'application_rejected')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Related application
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_applications_submitted_by ON applications(submitted_by_id);
CREATE INDEX idx_applications_reviewer ON applications(reviewer_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_type ON applications(type);
CREATE INDEX idx_applications_created_at ON applications(created_at);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_application_id ON notifications(application_id);

-- Add updated_at trigger for applications
CREATE TRIGGER update_applications_updated_at 
    BEFORE UPDATE ON applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add new permissions for review system
INSERT INTO permissions (name, description, resource, action) VALUES
('review_applications', 'Review submitted applications', 'applications', 'review'),
('view_notifications', 'View in-app notifications', 'notifications', 'read'),
('manage_notifications', 'Manage notification settings', 'notifications', 'write');