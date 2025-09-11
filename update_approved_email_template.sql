-- Update the Application Approved email template to match Review Request formatting
-- This includes proper font sizing (Arial 10pt), correct button text color (white), and formatted content

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
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
        }
        .header { 
            background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 10px 10px 0 0; 
        }
        .header h1 {
            margin: 0;
            font-size: 18pt;
        }
        .success-icon { 
            font-size: 48px; 
            margin-bottom: 10px;
        }
        .content { 
            background: white; 
            padding: 30px; 
            border: 1px solid #e5e7eb; 
            border-radius: 0 0 10px 10px; 
        }
        .content p {
            margin: 10px 0;
            font-size: 10pt;
        }
        .info-box {
            background: #f9fafb; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
        }
        .info-box p {
            margin: 8px 0;
            font-size: 10pt;
        }
        .info-box strong {
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
            margin: 20px auto;
            font-size: 10pt;
            font-weight: bold;
            text-align: center;
        }
        .button-container {
            text-align: center;
            margin: 25px 0;
        }
        .footer { 
            text-align: center; 
            padding: 20px; 
            color: #666; 
            font-size: 9pt; 
        }
        .badge { 
            display: inline-block; 
            padding: 4px 12px; 
            background: #D2BC99; 
            color: #243F7B; 
            border-radius: 4px; 
            font-weight: 600; 
        }
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
            <p>Great news! Your document has been approved:</p>
            <div class="info-box">
                <p><strong>Document:</strong> {{form_name}}</p>
                <p><strong>Submitted by:</strong> {{submitter_code}} {{submitter_full_name}}</p>
                <p><strong>Approved by:</strong> {{reviewer_name}}</p>
                <p><strong>Date:</strong> {{approval_date}}</p>
                {{#if show_urgency}}<p><strong>Priority:</strong> <span class="badge">Urgent</span></p>{{/if}}
                {{#if comments}}<p><strong>Comments:</strong> {{comments}}</p>{{/if}}
            </div>
            <p>You can now download the approved document from the portal.</p>
            <div class="button-container">
                <a href="{{portal_url}}" class="button">Visit TME Portal</a>
            </div>
        </div>
        <div class="footer">
            <p>TME Services Portal</p>
        </div>
    </div>
</body>
</html>',
updated_at = CURRENT_TIMESTAMP
WHERE name = 'application_approved';

-- Verify the update
SELECT name, subject_template, LEFT(html_template, 500) as template_preview 
FROM email_templates 
WHERE name = 'application_approved';