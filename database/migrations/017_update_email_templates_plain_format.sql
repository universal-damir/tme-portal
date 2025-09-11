-- Migration: 017_update_email_templates_plain_format.sql
-- Date: 2025-09-11
-- Author: TME Portal Team
-- Type: SAFE - Can deploy before code (data-only change)
-- Description: Update all email templates to plain format without containers

-- ============================================
-- SAFETY CHECK
-- ============================================
-- Safe to run before code deploy: YES (data-only change)
-- Rollback included: YES
-- Tested on: tme_portal_test
-- ============================================

BEGIN;

-- Store original templates for rollback (create temp table)
CREATE TEMP TABLE email_templates_backup AS 
SELECT * FROM email_templates;

-- 1. Update Review Requested template
UPDATE email_templates 
SET html_template = '<!DOCTYPE html>
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
    </style>
</head>
<body>
    <div class="email-body">
        <p>Hello {{reviewer_name}},</p>
        
        <p>A new document has been submitted for your review:</p>
        
        <p><span class="field-label">Document:</span> {{form_name}}</p>
        <p><span class="field-label">Submitted by:</span> {{submitter_code}} {{submitter_name}}</p>
        {{#if show_urgency}}<p><span class="field-label">Priority:</span> <span class="badge">Urgent</span></p>{{/if}}
        {{#if comments}}<p><span class="field-label">Comments:</span> {{comments}}</p>{{/if}}
        
        <p>Please review this document at your earliest convenience.</p>
        
        <p><a href="{{portal_url}}" class="button">Visit TME Portal</a></p>
    </div>
</body>
</html>',
updated_at = CURRENT_TIMESTAMP
WHERE name = 'review_requested';

-- 2. Update Application Approved template
UPDATE email_templates 
SET html_template = '<!DOCTYPE html>
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
    </style>
</head>
<body>
    <div class="email-body">
        <p>Hello {{user_name}},</p>
        
        <p>Great news! Your document has been approved:</p>
        
        <p><span class="field-label">Document:</span> {{form_name}}</p>
        <p><span class="field-label">Approved by:</span> {{reviewer_name}}</p>
        <p><span class="field-label">Date:</span> {{approval_date}}</p>
        {{#if show_urgency}}<p><span class="field-label">Priority:</span> <span class="badge">Urgent</span></p>{{/if}}
        {{#if comments}}<p><span class="field-label">Comments:</span> {{comments}}</p>{{/if}}
        
        <p>You can now download the approved document from the portal and send it to the client.</p>
        
        <p><a href="{{portal_url}}" class="button">Visit TME Portal</a></p>
    </div>
</body>
</html>',
updated_at = CURRENT_TIMESTAMP
WHERE name = 'application_approved';

-- 3. Update Application Rejected template
UPDATE email_templates 
SET html_template = '<!DOCTYPE html>
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
    </style>
</head>
<body>
    <div class="email-body">
        <p>Hello {{user_name}},</p>
        
        <p>Your document has been checked and requires further attention:</p>
        
        <p><span class="field-label">Document:</span> {{form_name}}</p>
        <p><span class="field-label">Submitted by:</span> {{submitter_code}} {{submitter_full_name}}</p>
        <p><span class="field-label">Reviewed by:</span> {{reviewer_name}}</p>
        {{#if show_urgency}}<p><span class="field-label">Priority:</span> <span class="badge">Urgent</span></p>{{/if}}
        {{#if feedback}}<p><span class="field-label">Comments:</span> {{feedback}}</p>{{/if}}
        
        <p>Please address the feedback at your earliest convenience.</p>
        
        <p><a href="{{portal_url}}" class="button">Visit TME Portal</a></p>
    </div>
</body>
</html>',
updated_at = CURRENT_TIMESTAMP
WHERE name = 'application_rejected';

-- 4. Update Review Completed template
UPDATE email_templates 
SET html_template = '<!DOCTYPE html>
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
        .status-approved { 
            color: #10b981; 
            font-weight: 600; 
        }
        .status-rejected { 
            color: #ef4444; 
            font-weight: 600; 
        }
        .status-revision { 
            color: #f59e0b; 
            font-weight: 600; 
        }
    </style>
</head>
<body>
    <div class="email-body">
        <p>Hello {{submitter_name}},</p>
        
        <p>Your document has been reviewed:</p>
        
        <p><span class="field-label">Document:</span> {{form_name}}</p>
        <p><span class="field-label">Submitted by:</span> {{submitter_code}} {{submitter_full_name}}</p>
        <p><span class="field-label">Status:</span> <span class="status-{{status_class}}">{{status}}</span></p>
        <p><span class="field-label">Reviewed by:</span> {{reviewer_name}}</p>
        {{#if show_urgency}}<p><span class="field-label">Priority:</span> <span class="badge">Urgent</span></p>{{/if}}
        {{#if feedback}}<p><span class="field-label">Feedback:</span> {{feedback}}</p>{{/if}}
        
        <p>Please check the review status in the portal.</p>
        
        <p><a href="{{portal_url}}" class="button">Visit TME Portal</a></p>
    </div>
</body>
</html>',
updated_at = CURRENT_TIMESTAMP
WHERE name = 'review_completed';

-- Migration tracking
INSERT INTO schema_migrations (version, description) 
VALUES ('017_update_email_templates_plain_format', 'Update all email templates to plain format without containers')
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- ============================================
-- ROLLBACK (Save this separately)
-- ============================================
-- To rollback this migration, you would need to restore the original templates
-- from your backup or from the 016_email_notifications.sql file
-- 
-- BEGIN;
-- UPDATE email_templates SET html_template = (original template content);
-- DELETE FROM schema_migrations WHERE version = '017_update_email_templates_plain_format';
-- COMMIT;