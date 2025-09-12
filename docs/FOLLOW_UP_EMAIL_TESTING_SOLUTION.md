# Follow-Up Email System - Testing Solution & Bug Fixes

## Issues Fixed

### 1. Template Variable Bug ✅
**Problem:** Email template said `{{days_ago}} days ago` but in dev mode we passed `"1 minutes"` creating "1 minutes days ago"

**Solution:** 
- Added new variable `time_ago_text` that contains the full text (e.g., "2 minutes ago" or "7 days ago")
- Updated template to use `{{time_ago_text}}` instead of `{{days_ago}} days ago`
- Keeps `days_ago` as just the number for backward compatibility

### 2. Email Queue Not Processing ✅
**Problem:** Emails were being queued but not sent automatically

**Solution:**
- Created `/api/cron/process-email-queue` endpoint to manually process the queue
- This endpoint processes up to 20 pending emails at once
- Can be called manually or via cron job

### 3. Missing Email Processing Step ✅
**Problem:** The reminder system was creating notifications and queuing emails, but they weren't being sent

**Solution:**
- Two-step process now:
  1. `/api/cron/send-follow-up-reminders` - Creates reminders and queues emails
  2. `/api/cron/process-email-queue` - Actually sends the queued emails

## Quick Testing Guide

### 1. One-Line Test
```bash
./scripts/test-follow-up-quick.sh
```
This script will:
- Create a test follow-up due immediately
- Trigger reminder emails
- Process the email queue
- Show you the results

### 2. Manual Step-by-Step Testing

#### Step 1: Create a test follow-up (due in 1 minute)
```bash
node scripts/test-follow-up-dev.js --create-test
```

#### Step 2: Wait for it to become due (1 minute in dev mode)
```bash
# Check due follow-ups
psql $DATABASE_URL -c "SELECT client_name, follow_up_number, due_date FROM email_follow_ups WHERE status = 'pending' AND due_date <= NOW();"
```

#### Step 3: Trigger reminder emails
```bash
curl http://localhost:3000/api/cron/send-follow-up-reminders
```

#### Step 4: Process the email queue to send emails
```bash
curl http://localhost:3000/api/cron/process-email-queue
```

#### Step 5: Check your email inbox!

### 3. Comprehensive Debug Test
```bash
node scripts/test-email-follow-up-debug.js
```
This runs a full system check including:
- Environment variables
- Database tables
- Email templates
- User preferences
- Creates test data
- Sends reminders
- Processes queue
- Shows complete diagnostics

## Testing Different Scenarios

### Test 2nd Follow-up (2 minutes)
```sql
-- Snooze existing follow-up to 2nd attempt
UPDATE email_follow_ups 
SET follow_up_number = 2, due_date = NOW() 
WHERE client_name LIKE 'Test Client%' AND status = 'pending';

-- Wait 1 second, then trigger
```

### Test 3rd Follow-up (3 minutes)
```sql
-- Set to 3rd attempt
UPDATE email_follow_ups 
SET follow_up_number = 3, due_date = NOW() 
WHERE client_name LIKE 'Test Client%' AND status = 'pending';
```

### Test Manager Escalation
```sql
-- Make 3rd follow-up overdue by 2 minutes
UPDATE email_follow_ups 
SET follow_up_number = 3, due_date = NOW() - INTERVAL '2 minutes' 
WHERE client_name LIKE 'Test Client%';

-- Trigger escalation
curl http://localhost:3000/api/cron/escalate-follow-ups
```

## Monitor the System

### Check Email Queue
```sql
-- See all pending emails
SELECT id, to_email, subject, status, last_error 
FROM email_queue 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### Check Follow-up History
```sql
-- See what actions have been taken
SELECT ef.client_name, h.action, h.notes, h.created_at
FROM email_follow_up_history h
JOIN email_follow_ups ef ON h.follow_up_id = ef.id
WHERE h.created_at > NOW() - INTERVAL '1 hour'
ORDER BY h.created_at DESC;
```

### Check Notification Records
```sql
-- See created notifications
SELECT type, title, message, email_sent, created_at
FROM notifications
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

## Development Mode Timing

In development mode (detected automatically when NODE_ENV=development or localhost):
- **1st follow-up:** 1 minute after email sent (instead of 7 days)
- **2nd follow-up:** 2 minutes after snooze (instead of 14 days)  
- **3rd follow-up:** 3 minutes after snooze (instead of 21 days)
- **Manager escalation:** 1 minute after 3rd is overdue (instead of 1 day)

## Required Environment Variables

```bash
# In your .env file
DATABASE_URL=postgresql://...
BREVO_SMTP_USER=your-smtp-user
BREVO_SMTP_PASSWORD=your-smtp-password
NEXT_PUBLIC_PORTAL_URL=http://localhost:3000
NODE_ENV=development
```

## Cron Jobs for Production

When deploying to production, set up these cron jobs:

```bash
# Send daily reminders at 9 AM
0 9 * * * curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/send-follow-up-reminders

# Process email queue every 5 minutes
*/5 * * * * curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/process-email-queue

# Check for escalations at 10 AM
0 10 * * * curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/escalate-follow-ups
```

## Troubleshooting

### Emails not sending?
1. Check SMTP credentials are set
2. Check user has email enabled in preferences
3. Check email templates exist in database
4. Run the process-email-queue endpoint manually

### Wrong timing in emails?
- Make sure the migration has been run to update templates
- Check that `time_ago_text` variable is being used in template

### Not receiving emails?
- Check spam folder
- Verify email address in users table
- Check email_queue table for errors
- Look at email_queue.last_error field for SMTP errors

## Success Indicators

You know the system is working when:
1. ✅ Follow-ups appear in `email_follow_ups` table when emails are sent
2. ✅ Notifications are created in `notifications` table
3. ✅ Emails are queued in `email_queue` table with status "pending"
4. ✅ After processing, status changes to "sent"
5. ✅ You receive the actual email in your inbox
6. ✅ History is logged in `email_follow_up_history` table

---

*Last Updated: January 2025*
*Fixed by: Development Team*