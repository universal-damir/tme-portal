# Email Notification System Documentation

## Overview
The TME Portal email notification system sends automated emails to users when certain events occur (review requests, approvals, rejections, etc.). It uses Brevo (SendinBlue) SMTP for delivery and includes a queue system for reliability.

## Architecture

### Core Components

1. **Database Tables**
   - `email_templates` - Stores HTML email templates with placeholders
   - `email_queue` - Queue for pending/sent emails
   - `notification_preferences` - User email preferences
   - `notifications` - Main notifications table (extended with email tracking fields)

2. **Service Files**
   - `/src/lib/services/notification-email.ts` - Main email service
   - `/src/lib/services/email-sender.ts` - SMTP transport handler
   - `/src/lib/services/email-queue-processor.ts` - Background queue processor
   - `/src/lib/services/review-system.ts` - Creates notifications and queues emails

3. **API Routes**
   - `/api/notifications/email-queue` - Process email queue endpoint
   - `/api/notifications/preferences` - User preference management
   - `/api/health` - Health check with email stats

## How It Works

### Email Flow
1. **Event Occurs** → Review requested, application approved, etc.
2. **Notification Created** → `NotificationsService.create()` in review-system.ts
3. **Email Queued** → Email added to `email_queue` table with status='pending'
4. **Queue Processor** → Runs every 30 seconds, sends pending emails
5. **Email Sent** → Via Brevo SMTP, status updated to 'sent'

### Queue Processing
- Automatic processor runs every 30 seconds
- Processes up to 10 emails per batch
- Retries failed emails up to 3 times
- Uses database locks to prevent duplicate processing

## Configuration

### Environment Variables
```bash
# Required for email functionality
BREVO_SMTP_USER=your-brevo-smtp-user@smtp-brevo.com
BREVO_SMTP_PASSWORD=your-brevo-smtp-password

# Optional
EMAIL_QUEUE_INTERVAL=30000  # Queue processing interval in ms (default: 30000)
NEXT_PUBLIC_PORTAL_URL=https://your-domain.com  # Portal URL in emails
```

### Database Migration
Run the email notification migration:
```bash
# Local
psql $DATABASE_URL < database/migrations/016_email_notifications.sql

# Production
docker exec -i tme-user-postgres-1 psql -U tme_user -d tme_portal < database/migrations/016_email_notifications.sql
```

## Email Templates

### Template Structure
Email templates are stored in the `email_templates` table with:
- `name` - Template identifier (e.g., 'review_requested')
- `subject_template` - Email subject with placeholders
- `html_template` - HTML body with placeholders
- `variables` - JSON schema of available variables

### Available Templates

1. **review_requested** - Sent when document needs review
2. **review_completed** - Sent when review is finished
3. **application_approved** - Sent when application is approved
4. **application_rejected** - Sent when application is rejected

### Editing Email Content

#### Method 1: Direct Database Update (Recommended for Production)

**Step-by-Step Guide for Modifying Email Templates:**

1. **Create an SQL file with your template changes:**
```bash
# Create a new SQL file for your changes
touch update_email_templates.sql
```

2. **Write the UPDATE query with the new template:**
```sql
-- Example: Update the review_requested email template
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
    </style>
</head>
<body>
    <div class="email-body">
        <p>Hello {{reviewer_name}},</p>
        <p>Your custom content here...</p>
        <p><a href="{{portal_url}}" class="button">Visit TME Portal</a></p>
    </div>
</body>
</html>',
    subject_template = 'Your New Subject: {{form_name}}',
    updated_at = CURRENT_TIMESTAMP
WHERE name = 'review_requested';
```

3. **Apply the changes to the database:**
```bash
# For local development
psql $DATABASE_URL < update_email_templates.sql

# For production
docker exec -i tme-user-postgres-1 psql -U tme_user -d tme_portal < update_email_templates.sql
```

4. **Verify the changes:**
```sql
-- Check that the template was updated
SELECT name, subject_template, LEFT(html_template, 200) as preview 
FROM email_templates 
WHERE name = 'review_requested';
```

**Important Notes:**
- Changes take effect immediately (no caching, no server restart needed)
- Always test templates in development first
- Keep a backup of the original template before modifying

#### Method 2: Edit Template Variables in Code

To add or modify variables passed to email templates, edit `/src/lib/services/review-system.ts`:

1. **Locate the email metadata section (around lines 1100-1190)**
2. **Add your custom variables based on the email type:**

```typescript
// For review_requested emails
if (data.type === 'review_requested') {
    emailMetadata.your_custom_field = 'value';
    emailMetadata.another_field = data.metadata?.some_value || 'default';
}

// For application_approved emails
if (data.type === 'application_approved') {
    // Format dates in dd.MM.yyyy format
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    emailMetadata.approval_date = `${day}.${month}.${year}`;
}
```

3. **Use the variables in your email template:**
```html
<p>Custom field: {{your_custom_field}}</p>
{{#if another_field}}<p>Conditional field: {{another_field}}</p>{{/if}}
```

### Current Email Template Format Standards

**As of September 2025, all email templates use a plain, professional format:**

1. **Styling Guidelines:**
   - Font: Arial, sans-serif, 10pt
   - No containers, borders, or colored headers
   - Simple layout starting from upper left corner (10px padding)
   - Blue color (#243F7B) for field labels
   - Button: Blue background (#243F7B) with white text

2. **Standard Template Structure:**
```html
<!DOCTYPE html>
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
        <!-- Email content here -->
    </div>
</body>
</html>
```

### Template Variables

#### review_requested
- `{{reviewer_name}}` - First name of reviewer
- `{{form_name}}` - Document/form name
- `{{submitter_name}}` - Full name of submitter
- `{{submitter_code}}` - Employee code of submitter
- `{{comments}}` - Review comments
- `{{portal_url}}` - Link to portal
- `{{show_urgency}}` - Boolean for conditional urgent badge
- `{{urgency}}` - Priority level (standard/urgent)

#### review_completed
- `{{submitter_name}}` - First name of document owner
- `{{submitter_full_name}}` - Full name of document owner
- `{{submitter_code}}` - Employee code of submitter
- `{{form_name}}` - Document/form name
- `{{status}}` - Review status (approved/rejected/revision)
- `{{status_class}}` - CSS class for status color
- `{{feedback}}` - Reviewer feedback
- `{{reviewer_name}}` - Reviewer's name
- `{{show_urgency}}` - Boolean for conditional urgent badge

#### application_approved
- `{{user_name}}` - First name of user
- `{{form_name}}` - Document/form name
- `{{reviewer_name}}` - Reviewer's name
- `{{approval_date}}` - Date in dd.MM.yyyy format
- `{{comments}}` - Approval comments
- `{{show_urgency}}` - Boolean for conditional urgent badge
- `{{portal_url}}` - Link to portal

#### application_rejected
- `{{user_name}}` - First name of user
- `{{form_name}}` - Document/form name
- `{{submitter_full_name}}` - Full name of submitter
- `{{submitter_code}}` - Employee code of submitter
- `{{reviewer_name}}` - Reviewer's name
- `{{feedback}}` - Rejection feedback
- `{{show_urgency}}` - Boolean for conditional urgent badge
- `{{portal_url}}` - Link to portal

### Template Placeholders
- Simple variables: `{{variable_name}}`
- Conditionals: `{{#if variable}}...{{/if}}`
- HTML is preserved - you can include styling

### Quick Reference: Common Email Modifications

#### Change Email Text Content
```sql
-- Example: Update the approval message
UPDATE email_templates 
SET html_template = REPLACE(
    html_template,
    'Great news! Your document has been approved:',
    'Your application has been successfully approved:'
)
WHERE name = 'application_approved';
```

#### Add a New Field to an Email
1. Update the backend code in `/src/lib/services/review-system.ts`:
```typescript
if (data.type === 'application_approved') {
    emailMetadata.department = userResult.rows[0]?.department || 'N/A';
}
```

2. Add the field to the email template:
```sql
UPDATE email_templates 
SET html_template = REPLACE(
    html_template,
    '<p><span class="field-label">Date:</span> {{approval_date}}</p>',
    '<p><span class="field-label">Date:</span> {{approval_date}}</p>
    <p><span class="field-label">Department:</span> {{department}}</p>'
)
WHERE name = 'application_approved';
```

#### Change Date Format
Edit `/src/lib/services/review-system.ts`:
```typescript
// For dd/MM/yyyy format
emailMetadata.approval_date = `${day}/${month}/${year}`;

// For MM.dd.yyyy format
emailMetadata.approval_date = `${month}.${day}.${year}`;

// For yyyy-MM-dd format
emailMetadata.approval_date = `${year}-${month}-${day}`;
```

#### Test Email Changes Locally
```bash
# 1. Update the template in your database
psql $DATABASE_URL < your_template_update.sql

# 2. Trigger a test notification (e.g., submit a review request)

# 3. Check the email queue
psql $DATABASE_URL -c "SELECT to_email, subject, LEFT(html_content, 500) FROM email_queue ORDER BY created_at DESC LIMIT 1;"

# 4. Force process the queue if needed
curl -X POST http://localhost:3000/api/notifications/email-queue \
  -H "x-queue-secret: default-secret-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}'
```

## User Preferences

### Preference Options
Users can choose:
- **Portal Only** - Only in-app notifications
- **Email Only** - Only email notifications
- **Both Portal & Email** - Both notification types

### Managing Preferences
- Users access via notification panel settings icon
- Stored in `notification_preferences` table
- All email types enabled by default when email is selected

## Development

### Testing Email Locally

1. **Ensure single dev server**:
```bash
# Check for running servers
ps aux | grep "npm run dev"

# Kill all if multiple found
pkill -f "npm run dev"

# Start single server
npm run dev
```

2. **Test email queue processing**:
```bash
node scripts/test-email-queue.js
```

3. **Check email queue status**:
```bash
psql $DATABASE_URL -c "SELECT * FROM email_queue ORDER BY created_at DESC LIMIT 5;"
```

### Common Issues

#### Multiple Emails Sent
- **Cause**: Multiple dev servers running
- **Fix**: Kill all servers, start only one
- **Check**: `ps aux | grep "npm run dev"`

#### Emails Not Sending
- **Check**: Environment variables set correctly
- **Check**: Email queue processor running: `curl http://localhost:3000/api/health`
- **Check**: User has email enabled in preferences

#### Email Content Not Updating
- **Clear queue**: `DELETE FROM email_queue WHERE status = 'pending';`
- **Restart server**: Changes to templates require new notifications

## Production Deployment

### Pre-deployment Checklist
1. ✅ Set production environment variables
2. ✅ Run database migration
3. ✅ Verify Brevo SMTP credentials
4. ✅ Test with single notification first

### Monitoring

#### Health Check Endpoint
```bash
GET /api/health

# Returns:
{
  "status": "healthy",
  "services": {
    "emailQueueProcessor": "running",
    "emailQueue": {
      "pending": "0",
      "sent": "245",
      "failed": "2"
    }
  }
}
```

#### Database Queries for Monitoring
```sql
-- Check queue status
SELECT status, COUNT(*) 
FROM email_queue 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;

-- Check failed emails
SELECT * FROM email_queue 
WHERE status = 'failed' 
ORDER BY created_at DESC;

-- User preference stats
SELECT 
  COUNT(*) FILTER (WHERE email_enabled = true) as email_enabled,
  COUNT(*) FILTER (WHERE in_app_enabled = true) as in_app_enabled
FROM notification_preferences;
```

### Scaling Considerations

#### Current Limits
- 10 emails per batch processing
- 30-second processing interval
- 3 retry attempts for failed emails

#### For Larger Scale
- Increase batch size in `processQueue(limit)`
- Decrease processing interval via `EMAIL_QUEUE_INTERVAL`
- Consider dedicated queue service for 1000+ users

## Troubleshooting

### Email Debugging Commands

```bash
# View recent email content
psql $DATABASE_URL -c "SELECT substring(html_content, 1, 500) FROM email_queue ORDER BY created_at DESC LIMIT 1;"

# Check email processor logs
grep "Email sent\|error" /path/to/app.log

# Force process queue
curl -X POST http://localhost:3000/api/notifications/email-queue \
  -H "x-queue-secret: default-secret-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}'
```

### Common SQL Fixes

```sql
-- Reset failed emails to retry
UPDATE email_queue 
SET status = 'pending', attempts = 0 
WHERE status = 'failed';

-- Clear old processed emails
DELETE FROM email_queue 
WHERE status = 'sent' 
AND processed_at < NOW() - INTERVAL '30 days';

-- Disable email for specific user
UPDATE notification_preferences 
SET email_enabled = false 
WHERE user_id = ?;
```

## Security Notes

1. **SMTP Credentials**: Never commit to git, use environment variables
2. **Email Queue Secret**: Change default in production
3. **Rate Limiting**: Built-in via 30-second intervals
4. **No PII in Logs**: Email addresses not logged in detail

## Future Improvements

### Planned Features
- [ ] Email bounce handling
- [ ] Delivery status webhooks
- [ ] Email open/click tracking
- [ ] Bulk email operations
- [ ] Custom email templates per user role

### Performance Optimizations
- [ ] Redis queue instead of PostgreSQL
- [ ] Separate microservice for email processing
- [ ] Connection pooling for SMTP
- [ ] Batch SMTP sending

## File Reference

### Critical Files for Email System
```
/src/lib/services/
├── notification-email.ts      # Main email service logic
├── email-sender.ts            # SMTP transport (Nodemailer)
├── email-queue-processor.ts   # Background processor
├── review-system.ts           # Creates notifications (lines 1100-1170)
└── app-initializer.ts         # Starts queue processor

/src/app/api/notifications/
├── email-queue/route.ts       # Queue processing endpoint
└── preferences/route.ts       # User preferences API

/src/components/notifications/
└── NotificationPreferences.tsx # User preference UI

/database/migrations/
└── 016_email_notifications.sql # Database schema
```

## Contact & Support

For issues or questions about the email notification system:
1. Check this documentation first
2. Review error logs in the application
3. Check database queue status
4. Contact the development team with specific error messages

---

*Last Updated: 11 September 2025*
*Version: 1.1*
*Changes: Added detailed instructions for email template modifications, current format standards, and quick reference guide*