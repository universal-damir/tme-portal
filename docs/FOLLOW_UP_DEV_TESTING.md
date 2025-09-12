# Follow-Up System Development Testing Guide

## Overview
In development mode, the follow-up system uses **minutes instead of days** for rapid testing:
- **1st follow-up**: 1 minute after email sent (instead of 7 days)
- **2nd follow-up**: 2 minutes after snooze (instead of 14 days)
- **3rd follow-up**: 3 minutes after snooze (instead of 21 days)
- **Manager escalation**: 1 minute after 3rd follow-up is overdue (instead of 1 day)

## How Development Mode is Detected
The system automatically detects development mode when:
- `NODE_ENV === 'development'` OR
- `NEXT_PUBLIC_PORTAL_URL` contains 'localhost'

## Testing Workflow

### 1. Create a Test Follow-Up
```bash
# Create a test follow-up that will be due in 1 minute
node scripts/test-follow-up-dev.js --create-test
```

### 2. Enable Email for Test User
Make sure the user has email notifications enabled:
```sql
-- Check user preferences
SELECT u.full_name, np.email_enabled, np.email_follow_up_reminders 
FROM users u 
LEFT JOIN notification_preferences np ON u.id = np.user_id;

-- Enable email for a user
UPDATE notification_preferences 
SET email_enabled = true, email_follow_up_reminders = true 
WHERE user_id = [USER_ID];
```

### 3. Wait for Follow-Up to Become Due
- 1st follow-up: Wait 1 minute after creation
- 2nd follow-up: Snooze and wait 2 minutes
- 3rd follow-up: Snooze again and wait 3 minutes

### 4. Trigger Email Reminders
```bash
# Check for due follow-ups and send reminders
curl http://localhost:3000/api/cron/send-follow-up-reminders

# Check for escalations (after 3rd follow-up + 1 minute)
curl http://localhost:3000/api/cron/escalate-follow-ups
```

### 5. Monitor Results
```bash
# Check follow-up status
node scripts/test-follow-up-dev.js

# Check email queue
psql $DATABASE_URL -c "SELECT * FROM email_queue WHERE created_at > NOW() - INTERVAL '10 minutes' ORDER BY created_at DESC;"

# Check follow-up history
psql $DATABASE_URL -c "SELECT * FROM email_follow_up_history WHERE created_at > NOW() - INTERVAL '10 minutes' ORDER BY created_at DESC;"
```

## Testing the Complete Cycle

### Minute-by-Minute Timeline
```
T+0:00 - Create test follow-up (due at T+1:00)
T+1:00 - 1st reminder sent
         User can: Complete, Snooze, or Ignore
T+1:00 - If snoozed → 2nd follow-up created (due at T+3:00)
T+3:00 - 2nd reminder sent
         User can: Complete, Snooze, or Ignore
T+3:00 - If snoozed → 3rd follow-up created (due at T+6:00)
T+6:00 - 3rd (final) reminder sent
         User can: Complete or Mark No Response
T+7:00 - If no action → Manager escalation email sent
```

### Quick Test Commands
```bash
# Create and test in one command
node scripts/test-follow-up-dev.js --create-test && \
sleep 65 && \
curl http://localhost:3000/api/cron/send-follow-up-reminders
```

## Simulating Actions

### Complete a Follow-Up
```sql
UPDATE email_follow_ups 
SET status = 'completed', completed_date = NOW() 
WHERE client_name LIKE 'Test Client%' 
AND status = 'pending';
```

### Snooze a Follow-Up (moves to next level)
```sql
-- This would normally be done via the API
-- The snooze action automatically:
-- 1. Upgrades follow-up number (1→2 or 2→3)
-- 2. Sets new due date (+1/2/3 minutes in dev)
-- 3. Updates status to 'snoozed' then back to 'pending'
```

### Force Escalation
```sql
-- Make a 3rd follow-up overdue by more than 1 minute
UPDATE email_follow_ups 
SET follow_up_number = 3, 
    due_date = NOW() - INTERVAL '2 minutes' 
WHERE client_name LIKE 'Test Client%';

-- Then run escalation
curl http://localhost:3000/api/cron/escalate-follow-ups
```

## Email Templates in Development

The email templates will show:
- "X minutes ago" instead of "X days ago" 
- Due dates in minutes for testing
- Same professional format as production

## Troubleshooting

### Reminder Not Sending?
1. Check user has email enabled:
   ```sql
   SELECT * FROM notification_preferences WHERE user_id = [USER_ID];
   ```

2. Check if reminder was already sent today:
   ```sql
   SELECT * FROM email_follow_up_history 
   WHERE follow_up_id = '[FOLLOW_UP_ID]' 
   AND action = 'reminder_sent' 
   AND DATE(created_at) = CURRENT_DATE;
   ```

3. Check SMTP configuration:
   - `BREVO_SMTP_USER` and `BREVO_SMTP_PASSWORD` must be set
   - Email queue processor must be running

### Clear Test Data
```sql
-- Remove test follow-ups
DELETE FROM email_follow_ups WHERE client_name LIKE 'Test Client%';

-- Clear email queue
DELETE FROM email_queue WHERE created_at > NOW() - INTERVAL '1 hour';

-- Clear history
DELETE FROM email_follow_up_history 
WHERE follow_up_id IN (
  SELECT id FROM email_follow_ups WHERE client_name LIKE 'Test Client%'
);
```

## Production vs Development

| Feature | Development | Production |
|---------|------------|------------|
| 1st Follow-up | 1 minute | 7 days |
| 2nd Follow-up | 2 minutes | 14 days |
| 3rd Follow-up | 3 minutes | 21 days |
| Escalation | 1 minute after 3rd | 1 day after 3rd |
| Email shows | "X minutes ago" | "X days ago" |
| Cron frequency | Can run every minute | Daily at 9 AM |

## Important Notes

- Development timing only affects NEW follow-ups created while in dev mode
- Existing follow-ups retain their original due dates
- The system uses the same email templates and queue system as production
- All actions are logged in `email_follow_up_history` for debugging

---

*Last Updated: January 2025*