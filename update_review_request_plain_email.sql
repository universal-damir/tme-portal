-- Update Review Request email to plain email format aligned to upper left

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

-- Verify the update
SELECT name, subject_template, LEFT(html_template, 500) as template_preview 
FROM email_templates 
WHERE name = 'review_requested';