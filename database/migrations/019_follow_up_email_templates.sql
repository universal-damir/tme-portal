-- Migration 019: Follow-up Email Templates and Preferences
-- Adds email templates for follow-up reminders and manager escalations
-- Date: 2025-01-12

-- 1. Add follow-up reminder preference to notification_preferences table
ALTER TABLE notification_preferences 
ADD COLUMN IF NOT EXISTS email_follow_up_reminders BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS email_follow_up_escalations BOOLEAN DEFAULT TRUE;

-- 2. Insert follow-up reminder email template
INSERT INTO email_templates (name, subject_template, html_template, variables) VALUES
(
  'follow_up_reminder',
  'Follow-up Reminder: {{client_name}} - {{attempt_text}} Attempt',
  '<!DOCTYPE html>
<html>
<head>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            font-size: 10pt;
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background-color: white;
        }
        .email-body {
            padding: 10px;
        }
        p {
            margin: 10px 0;
            font-size: 10pt;
        }
        .field-label {
            color: #243F7B;
            font-weight: bold;
        }
        .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background: #243F7B; 
            color: white !important;
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
            font-size: 10pt;
            font-weight: bold;
        }
        .badge { 
            display: inline-block; 
            padding: 2px 8px; 
            background: #D2BC99; 
            color: #243F7B; 
            border-radius: 4px; 
            font-weight: 600;
            font-size: 9pt;
        }
        .info-box {
            background-color: #f5f5f5;
            border-left: 4px solid #243F7B;
            padding: 10px;
            margin: 15px 0;
        }
        .overdue {
            color: #d32f2f;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="email-body">
        <p>Hello {{user_name}},</p>
        
        <p>This is a reminder to follow up with your client regarding the email sent {{time_ago_text}}.</p>
        
        <div class="info-box">
            <p><span class="field-label">Client:</span> {{client_name}}</p>
            <p><span class="field-label">Email Subject:</span> {{email_subject}}</p>
            <p><span class="field-label">Originally Sent:</span> {{sent_date}}</p>
            <p><span class="field-label">Follow-up Due:</span> <span{{#if is_overdue}} class="overdue"{{/if}}>{{due_date}}{{#if is_overdue}} (OVERDUE){{/if}}</span></p>
            <p><span class="field-label">Attempt:</span> <span class="badge">{{attempt_text}} ({{follow_up_number}} of 3)</span></p>
        </div>
        
        {{#if is_final_attempt}}
        <p><strong>Note:</strong> This is your final follow-up attempt. If no response is received, this will be escalated to management tomorrow.</p>
        {{/if}}
        
        <p>Please take one of the following actions:</p>
        <ul>
            <li>Mark as complete if the client has responded</li>
            <li>Send a follow-up email to the client</li>
            <li>Snooze to the next follow-up level if more time is needed</li>
        </ul>
        
        <p><a href="{{portal_url}}/portal#profile" class="button">Manage Follow-ups</a></p>
        
        <p style="color: #666; font-size: 9pt; margin-top: 20px;">
            This is an automated {{attempt_text}} follow-up reminder from TME Portal.
        </p>
    </div>
</body>
</html>',
  '{
    "user_name": "First name of the user",
    "client_name": "Name of the client",
    "email_subject": "Subject of the original email",
    "sent_date": "Date when email was originally sent",
    "due_date": "Due date for this follow-up",
    "days_ago": "Number of days/minutes since email was sent",
    "time_ago_text": "Full text like 2 minutes ago or 7 days ago",
    "follow_up_number": "Current follow-up number (1, 2, or 3)",
    "attempt_text": "Text description of attempt (1st, 2nd, 3rd)",
    "is_overdue": "Boolean - true if follow-up is overdue",
    "is_final_attempt": "Boolean - true if this is the 3rd attempt",
    "portal_url": "URL to the TME portal"
  }'::jsonb
)
ON CONFLICT (name) DO UPDATE SET 
  subject_template = EXCLUDED.subject_template,
  html_template = EXCLUDED.html_template,
  variables = EXCLUDED.variables,
  updated_at = CURRENT_TIMESTAMP;

-- 3. Insert manager escalation email template
INSERT INTO email_templates (name, subject_template, html_template, variables) VALUES
(
  'follow_up_escalation',
  'Escalation: No Response from {{client_name}} After 3 Follow-up Attempts',
  '<!DOCTYPE html>
<html>
<head>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            font-size: 10pt;
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background-color: white;
        }
        .email-body {
            padding: 10px;
        }
        p {
            margin: 10px 0;
            font-size: 10pt;
        }
        .field-label {
            color: #243F7B;
            font-weight: bold;
        }
        .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background: #243F7B; 
            color: white !important;
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
            font-size: 10pt;
            font-weight: bold;
        }
        .escalation-box {
            background-color: #fff3e0;
            border: 2px solid #ff9800;
            border-radius: 5px;
            padding: 15px;
            margin: 15px 0;
        }
        .timeline {
            background-color: #f5f5f5;
            padding: 10px;
            margin: 10px 0;
            border-left: 4px solid #243F7B;
        }
        .timeline-item {
            margin: 5px 0;
            padding-left: 10px;
        }
        .urgent {
            color: #d32f2f;
            font-weight: bold;
            text-transform: uppercase;
        }
    </style>
</head>
<body>
    <div class="email-body">
        <p>Dear {{manager_name}},</p>
        
        <div class="escalation-box">
            <p class="urgent">Management Escalation Required</p>
            <p>The following client has not responded after 3 follow-up attempts and requires management intervention.</p>
        </div>
        
        <p><strong>Employee:</strong> {{employee_name}} ({{employee_code}})</p>
        
        <p><strong>Client Details:</strong></p>
        <p><span class="field-label">Client Name:</span> {{client_name}}</p>
        <p><span class="field-label">Client Email:</span> {{client_email}}</p>
        <p><span class="field-label">Original Email Subject:</span> {{email_subject}}</p>
        
        <div class="timeline">
            <p><strong>Follow-up Timeline:</strong></p>
            <div class="timeline-item">• <span class="field-label">Original Email:</span> {{original_sent_date}}</div>
            <div class="timeline-item">• <span class="field-label">1st Follow-up Due:</span> {{first_followup_date}} (Day 7)</div>
            <div class="timeline-item">• <span class="field-label">2nd Follow-up Due:</span> {{second_followup_date}} (Day 14)</div>
            <div class="timeline-item">• <span class="field-label">3rd Follow-up Due:</span> {{third_followup_date}} (Day 21)</div>
            <div class="timeline-item">• <span class="field-label">Escalated:</span> {{escalation_date}} (Day {{days_since_sent}})</div>
        </div>
        
        <p><strong>Recommended Actions:</strong></p>
        <ul>
            <li>Contact the client directly via phone</li>
            <li>Send a management-level follow-up email</li>
            <li>Review the client relationship status</li>
            <li>Determine if alternative contact methods are needed</li>
        </ul>
        
        <p><a href="{{portal_url}}/portal#profile" class="button">View in TME Portal</a></p>
        
        <p style="color: #666; font-size: 9pt; margin-top: 20px;">
            This is an automated escalation from the TME Portal Email Response Tracker system.
        </p>
    </div>
</body>
</html>',
  '{
    "manager_name": "Name of the manager",
    "employee_name": "Name of the employee who sent the original email",
    "employee_code": "Employee code",
    "client_name": "Name of the client",
    "client_email": "Email address of the client",
    "email_subject": "Subject of the original email",
    "original_sent_date": "Date when email was originally sent",
    "first_followup_date": "Date of first follow-up",
    "second_followup_date": "Date of second follow-up",
    "third_followup_date": "Date of third follow-up",
    "escalation_date": "Date of escalation",
    "days_since_sent": "Total days since original email",
    "portal_url": "URL to the TME portal"
  }'::jsonb
)
ON CONFLICT (name) DO UPDATE SET 
  subject_template = EXCLUDED.subject_template,
  html_template = EXCLUDED.html_template,
  variables = EXCLUDED.variables,
  updated_at = CURRENT_TIMESTAMP;

-- 4. Add notification types for follow-ups to existing constraints
-- Note: This is safe to run multiple times due to IF NOT EXISTS
DO $$
BEGIN
    -- Check if we need to update the notification type constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'notifications_type_check' 
        AND conrelid = 'notifications'::regclass
    ) THEN
        -- If constraint doesn't exist, create it
        ALTER TABLE notifications 
        ADD CONSTRAINT notifications_type_check 
        CHECK (type IN (
            'review_requested', 
            'review_completed', 
            'application_approved', 
            'application_rejected',
            'follow_up_reminder',
            'follow_up_escalation'
        ));
    ELSE
        -- If it exists, drop and recreate with new values
        ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
        ALTER TABLE notifications 
        ADD CONSTRAINT notifications_type_check 
        CHECK (type IN (
            'review_requested', 
            'review_completed', 
            'application_approved', 
            'application_rejected',
            'follow_up_reminder',
            'follow_up_escalation'
        ));
    END IF;
END $$;

-- 5. Grant permissions
GRANT SELECT, INSERT, UPDATE ON email_templates TO tme_user;
GRANT UPDATE ON notification_preferences TO tme_user;