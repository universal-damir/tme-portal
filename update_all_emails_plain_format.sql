-- Update all email templates to plain email format without containers/borders

-- 1. Application Approved
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

-- 2. Application Rejected (Revision Required)
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

-- 3. Review Completed
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

-- Verify all updates
SELECT name, subject_template 
FROM email_templates 
ORDER BY name;