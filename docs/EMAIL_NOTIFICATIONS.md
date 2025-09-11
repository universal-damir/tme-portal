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
```sql
UPDATE email_templates 
SET html_template = '<your new HTML template>',
    subject_template = 'Your New Subject: {{variable}}'
WHERE name = 'review_requested';
```

#### Method 2: Edit Template Variables in Code
Edit `/src/lib/services/review-system.ts` (lines 1100-1170) to change what data is passed to templates:

```typescript
// Example: Add new variable to review_requested email
emailMetadata.your_new_field = 'value';
```

### Template Variables

#### review_requested
- `{{reviewer_name}}` - First name of reviewer
- `{{form_name}}` - Document/form name
- `{{submitter_name}}` - Full name of submitter
- `{{submitter_code}}` - Employee code of submitter
- `{{comments}}` - Review comments
- `{{portal_url}}` - Link to portal
- `{{#if show_urgency}}` - Conditionally show urgent badge

#### review_completed
- `{{submitter_name}}` - First name of document owner
- `{{form_name}}` - Document/form name
- `{{status}}` - Review status (approved/rejected/revision)
- `{{feedback}}` - Reviewer feedback
- `{{reviewer_name}}` - Reviewer's name

### Template Placeholders
- Simple variables: `{{variable_name}}`
- Conditionals: `{{#if variable}}...{{/if}}`
- HTML is preserved - you can include styling

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

*Last Updated: September 2025*
*Version: 1.0*