# Email Follow-Up System Setup Instructions

## Quick Setup

To enable the new Email Follow-Up System, you need to run the database migration:

```bash
# Option 1: Using npm script
npm run migrate:follow-ups

# Option 2: Manually with psql
psql $DATABASE_URL -f database/migrations/018_email_follow_ups.sql

# Option 3: If using Docker
docker exec -it tme-portal-db psql -U tme_user -d tme_portal -f /migrations/018_email_follow_ups.sql
```

## What This System Does

The Email Follow-Up System automatically tracks email follow-ups with clients:

1. **Automatic Creation**: When you send an email with PDF attachment, a follow-up is created
2. **3-Stage Follow-Up**: Day 7, Day 14, Day 21 reminders
3. **Manager Escalation**: After 3rd attempt, managers are notified
4. **Simple Interface**: 3 tabs - Follow Up | Completed | No Response

## Features

- ✅ No configuration needed - works automatically after migration
- ✅ Integrates with existing email send functionality
- ✅ Graceful fallback if tables don't exist
- ✅ Clean column layout without emojis
- ✅ Compatible with existing todo system

## Verification

After running the migration, verify the system is working:

1. Go to your Profile tab
2. You should see the "Email Follow-ups" panel
3. Send a test email with attachment
4. Check that a follow-up appears in the "Follow Up" tab

## Troubleshooting

If you see "Follow-up System Setup Required" message:
- Run the migration command above
- Refresh the page
- The system should now work

## Optional: Daily Escalation

For automatic manager escalation, set up a daily cron job:

```bash
# Add to crontab
0 9 * * * curl https://your-domain.com/api/cron/escalate-follow-ups
```

## Support

The system is designed to work alongside your existing todo system. Both will continue to function, giving you time to transition if needed.