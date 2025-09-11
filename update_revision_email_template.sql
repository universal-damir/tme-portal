-- Update the Application Requires Revision email template to match Review Request formatting
UPDATE email_templates 
SET html_template = '<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Inter, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #243F7B; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .badge { display: inline-block; padding: 4px 12px; background: #D2BC99; color: #243F7B; border-radius: 4px; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Revision Required</h1>
        </div>
        <div class="content">
            <p>Hello {{user_name}},</p>
            <p>Your document requires revisions before approval:</p>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Document:</strong> {{form_name}}</p>
                <p><strong>Reviewed by:</strong> {{reviewer_name}}</p>
                <p><strong>Status:</strong> <span class="badge">Revision Required</span></p>
                {{#if feedback}}<p><strong>Feedback:</strong> {{feedback}}</p>{{/if}}
            </div>
            <p>Please address the feedback and resubmit your application.</p>
            <a href="{{portal_url}}" class="button">Open TME Portal</a>
        </div>
        <div class="footer">
            <p>TME Services Portal</p>
        </div>
    </div>
</body>
</html>',
updated_at = CURRENT_TIMESTAMP
WHERE name = 'application_rejected';

-- Verify the update
SELECT name, subject_template, LEFT(html_template, 200) as template_preview 
FROM email_templates 
WHERE name = 'application_rejected';