-- Migration 016: Email Notification System
-- Adds support for email notifications alongside existing in-app notifications
-- Date: 2025-01-11

-- 1. Add email tracking columns to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS email_error TEXT,
ADD COLUMN IF NOT EXISTS email_attempts INTEGER DEFAULT 0;

-- Add index for email processing queries
CREATE INDEX IF NOT EXISTS idx_notifications_email_pending 
ON notifications(email_sent, created_at) 
WHERE email_sent = FALSE;

-- 2. Create notification preferences table (simplified for employee use)
CREATE TABLE IF NOT EXISTS notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Delivery method preferences
    in_app_enabled BOOLEAN DEFAULT TRUE,
    email_enabled BOOLEAN DEFAULT FALSE,
    
    -- Granular notification type preferences
    email_review_requested BOOLEAN DEFAULT TRUE,
    email_review_completed BOOLEAN DEFAULT TRUE,
    email_application_approved BOOLEAN DEFAULT TRUE,
    email_application_rejected BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one preference row per user
    CONSTRAINT unique_user_preferences UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user 
ON notification_preferences(user_id);

-- 3. Create email queue table for async processing
CREATE TABLE IF NOT EXISTS email_queue (
    id SERIAL PRIMARY KEY,
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Email details
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    html_content TEXT NOT NULL,
    
    -- Processing status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    -- Error tracking
    last_error TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    
    -- Prevent duplicate emails
    CONSTRAINT unique_notification_email UNIQUE(notification_id)
);

-- Create indexes for queue processing
CREATE INDEX IF NOT EXISTS idx_email_queue_pending 
ON email_queue(status, scheduled_for) 
WHERE status IN ('pending', 'processing');

CREATE INDEX IF NOT EXISTS idx_email_queue_notification 
ON email_queue(notification_id);

-- 4. Create email templates table for reusable templates
CREATE TABLE IF NOT EXISTS email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    subject_template VARCHAR(500) NOT NULL,
    html_template TEXT NOT NULL,
    
    -- Template variables documentation
    variables JSONB DEFAULT '{}',
    
    -- Active flag for enabling/disabling templates
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Insert default email templates
INSERT INTO email_templates (name, subject_template, html_template, variables) VALUES
(
    'review_requested',
    'Review Requested: {{form_name}}',
    '<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Inter, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #243F7B 0%, #1a2d5a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #243F7B; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .badge { display: inline-block; padding: 4px 12px; background: #D2BC99; color: #243F7B; border-radius: 4px; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Review Request</h1>
        </div>
        <div class="content">
            <p>Hello {{reviewer_name}},</p>
            <p>A new document has been submitted for your review:</p>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Document:</strong> {{form_name}}</p>
                <p><strong>Submitted by:</strong> {{submitter_name}}</p>
                <p><strong>Priority:</strong> <span class="badge">{{urgency}}</span></p>
                {{#if comments}}<p><strong>Comments:</strong> {{comments}}</p>{{/if}}
            </div>
            <p>Please review this document at your earliest convenience.</p>
            <a href="{{portal_url}}" class="button">Open TME Portal</a>
        </div>
        <div class="footer">
            <p>TME Services Portal</p>
        </div>
    </div>
</body>
</html>',
    '{"reviewer_name": "string", "form_name": "string", "submitter_name": "string", "urgency": "string", "comments": "string", "portal_url": "string"}'
),
(
    'review_completed',
    'Review Completed: {{form_name}}',
    '<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Inter, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #243F7B 0%, #1a2d5a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #243F7B; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .status-approved { color: #10b981; font-weight: 600; }
        .status-rejected { color: #ef4444; font-weight: 600; }
        .status-revision { color: #f59e0b; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Review Completed</h1>
        </div>
        <div class="content">
            <p>Hello {{submitter_name}},</p>
            <p>Your document has been reviewed:</p>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Document:</strong> {{form_name}}</p>
                <p><strong>Status:</strong> <span class="status-{{status_class}}">{{status}}</span></p>
                <p><strong>Reviewed by:</strong> {{reviewer_name}}</p>
                {{#if feedback}}<p><strong>Feedback:</strong> {{feedback}}</p>{{/if}}
            </div>
            <a href="{{portal_url}}" class="button">View in Portal</a>
        </div>
        <div class="footer">
            <p>TME Services Portal</p>
        </div>
    </div>
</body>
</html>',
    '{"submitter_name": "string", "form_name": "string", "status": "string", "status_class": "string", "reviewer_name": "string", "feedback": "string", "portal_url": "string"}'
),
(
    'application_approved',
    'Application Approved: {{form_name}}',
    '<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Inter, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #243F7B; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .success-icon { font-size: 48px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="success-icon">✓</div>
            <h1>Application Approved</h1>
        </div>
        <div class="content">
            <p>Hello {{user_name}},</p>
            <p>Great news! Your application has been approved:</p>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <p><strong>Application:</strong> {{form_name}}</p>
                <p><strong>Approved by:</strong> {{reviewer_name}}</p>
                <p><strong>Date:</strong> {{approval_date}}</p>
                {{#if comments}}<p><strong>Comments:</strong> {{comments}}</p>{{/if}}
            </div>
            <p>You can now download the approved document from the portal.</p>
            <a href="{{portal_url}}" class="button">Access Document</a>
        </div>
        <div class="footer">
            <p>TME Services Portal</p>
        </div>
    </div>
</body>
</html>',
    '{"user_name": "string", "form_name": "string", "reviewer_name": "string", "approval_date": "string", "comments": "string", "portal_url": "string"}'
),
(
    'application_rejected',
    'Application Requires Revision: {{form_name}}',
    '<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Inter, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #243F7B; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Revision Required</h1>
        </div>
        <div class="content">
            <p>Hello {{user_name}},</p>
            <p>Your application requires some revisions before approval:</p>
            <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p><strong>Application:</strong> {{form_name}}</p>
                <p><strong>Reviewed by:</strong> {{reviewer_name}}</p>
                <p><strong>Feedback:</strong></p>
                <p style="margin-left: 20px;">{{feedback}}</p>
            </div>
            <p>Please address the feedback and resubmit your application.</p>
            <a href="{{portal_url}}" class="button">View Feedback</a>
        </div>
        <div class="footer">
            <p>TME Services Portal</p>
        </div>
    </div>
</body>
</html>',
    '{"user_name": "string", "form_name": "string", "reviewer_name": "string", "feedback": "string", "portal_url": "string"}'
)
ON CONFLICT (name) DO NOTHING;

-- 6. Create function to auto-create default preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to auto-create preferences for new users
DROP TRIGGER IF EXISTS create_notification_preferences_on_user_create ON users;
CREATE TRIGGER create_notification_preferences_on_user_create
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_default_notification_preferences();

-- 8. Create preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

-- Function removed - no daily limits for employee system

-- 10. Add comments for documentation
COMMENT ON TABLE notification_preferences IS 'User preferences for notification delivery methods including email settings';
COMMENT ON TABLE email_queue IS 'Queue for asynchronous email processing with retry logic';
COMMENT ON TABLE email_templates IS 'Reusable HTML email templates for different notification types';
COMMENT ON COLUMN notifications.email_sent IS 'Whether an email has been sent for this notification';
COMMENT ON COLUMN notifications.email_sent_at IS 'Timestamp when the email was successfully sent';
COMMENT ON COLUMN notifications.email_error IS 'Last error message if email sending failed';
COMMENT ON COLUMN email_queue.status IS 'Current processing status: pending, processing, sent, failed, cancelled';