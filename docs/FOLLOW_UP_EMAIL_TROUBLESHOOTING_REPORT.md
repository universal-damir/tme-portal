# Follow-Up Email Reminder System - Implementation & Troubleshooting Report

**Date:** January 12, 2025  
**Status:** Partially Working - Needs Further Testing

## Executive Summary

We implemented an automated email reminder system for the follow-up feature that sends reminders to employees at 7, 14, and 21-day intervals (or 1, 2, 3 minutes in development mode). The system is built on top of the existing email notification infrastructure but encountered several integration issues that need team review.

## What Was Implemented

### 1. Core Features Added

#### Email Templates (Migration 019)
- **`follow_up_reminder`** - Sent to employees when follow-ups are due
- **`follow_up_escalation`** - Sent to managers after 3 failed attempts
- Professional format matching existing TME email standards
- Dynamic content based on attempt number (1st/2nd/3rd)

#### Development Mode Testing
- **Production:** 7, 14, 21 days
- **Development:** 1, 2, 3 minutes (for rapid testing)
- Automatic detection via `NODE_ENV` or localhost URL
- Escalation after 1 minute in dev (vs 1 day in production)

#### Service Layer Enhancements
```typescript
// New methods in FollowUpService
- sendReminderEmail(followUp) // Sends reminder to employee
- sendEscalationEmail(followUp, managerId) // Notifies manager
- getFollowUpsNeedingReminders() // Finds due follow-ups
```

#### Cron Endpoint
- `/api/cron/send-follow-up-reminders`
- Checks for due follow-ups and sends email reminders
- Respects user notification preferences
- Prevents duplicate reminders on same day

### 2. User Preference Integration
- Added `email_follow_up_reminders` and `email_follow_up_escalations` to notification preferences
- UI simplified - all email types auto-enabled when "Both Portal & Email" selected
- Checkboxes commented out for cleaner interface

## Issues Encountered & Troubleshooting Steps

### Issue 1: UUID Package Compatibility ❌ → ✅ FIXED
**Problem:** UUID v13 package caused module resolution errors
```
Module not found: Can't resolve './rng.js'
```

**Solution:** 
- Removed external UUID package
- Switched to Node.js built-in `crypto.randomUUID()`
- This matches Node.js best practices and removes dependency

### Issue 2: Foreign Key Constraint ❌ → ✅ FIXED
**Problem:** 
```
error: insert or update on table "email_queue" violates foreign key constraint
Key (notification_id)=(uuid) is not present in table "notifications"
```

**Root Cause:** 
- Email queue requires notification_id that exists in notifications table
- We were generating UUID without creating notification record

**Solution:**
- Create notification record FIRST, then use its ID
- Modified `sendReminderEmail()` to insert into notifications table before queuing email

### Issue 3: Audit Log Parameter Mismatch ❌ → ✅ FIXED
**Problem:**
```
error: null value in column "action" of relation "audit_logs" violates not-null constraint
```

**Root Cause:**
- `logAuditEvent()` expects object with properties
- We were passing individual parameters

**Solution:**
- Changed from: `logAuditEvent(userId, action, resource, details)`
- To: `logAuditEvent({ user_id: userId, action: action, resource: resource, details: details })`

### Issue 4: Client vs Employee Confusion ✅ CLARIFIED
**Important Clarification:**
- Emails go to **EMPLOYEES** (users of the system), NOT clients
- Employee gets reminder to follow up with their client
- System tracks client name for reference only

## Current Architecture

```
Email Send (with attachment)
    ↓
Creates Follow-Up Record
    ↓
[Development: 1 min | Production: 7 days]
    ↓
Cron Job Runs → Finds Due Follow-ups
    ↓
Creates Notification Record
    ↓
Queues Email to Employee
    ↓
Email Processor Sends Email
```

## Testing Workflow for Developers

### Quick Test in Development Mode

1. **Create Test Follow-up** (due in 1 minute):
```bash
node scripts/test-follow-up-dev.js --create-test
```

2. **Wait 1 minute, then trigger reminder**:
```bash
curl http://localhost:3000/api/cron/send-follow-up-reminders
```

3. **Check if email was queued**:
```sql
psql $DATABASE_URL -c "SELECT * FROM email_queue ORDER BY created_at DESC LIMIT 5;"
```

4. **Check for errors in terminal** running `npm run dev`

### Full Cycle Test (6-7 minutes total)
- **T+0:00** - Send email with attachment
- **T+1:00** - 1st reminder (check email)
- **T+1:00** - Snooze in UI
- **T+3:00** - 2nd reminder (2 min after snooze)
- **T+3:00** - Snooze again
- **T+6:00** - 3rd reminder (3 min after snooze)
- **T+7:00** - Manager escalation

## Known Issues Still Under Investigation

### 1. Email Queue Processing
- Notifications are created successfully
- But `NotificationEmailService.queueEmail()` returns false
- Need to verify:
  - SMTP credentials are set
  - Email templates are properly formatted
  - User has valid email address

### 2. Possible Template Variable Issues
- Template expects variables like `{{days_ago}}`
- In dev mode, we're passing minutes - may need adjustment

### 3. Error Logging
- Errors visible in terminal but need better structured logging
- Consider adding detailed error table for debugging

## Files Modified/Created

### New Files
- `/database/migrations/019_follow_up_email_templates.sql`
- `/src/app/api/cron/send-follow-up-reminders/route.ts`
- `/scripts/test-follow-up-dev.js`
- `/scripts/test-follow-up-reminders.js`
- `/docs/FOLLOW_UP_DEV_TESTING.md`

### Modified Files
- `/src/lib/services/follow-up-service.ts` - Added email methods
- `/src/lib/services/notification-email.ts` - Added new notification types
- `/src/components/notifications/NotificationPreferences.tsx` - UI updates
- `/src/app/api/email/send/route.ts` - Fixed variable scope issue

## Recommendations for Team Testing

### 1. Environment Setup
```bash
# Ensure these are set in .env
BREVO_SMTP_USER=your-smtp-user
BREVO_SMTP_PASSWORD=your-smtp-password
CRON_SECRET=your-secret
```

### 2. Database Verification
```sql
-- Check templates exist
SELECT name, is_active FROM email_templates 
WHERE name IN ('follow_up_reminder', 'follow_up_escalation');

-- Check user preferences
SELECT * FROM notification_preferences WHERE user_id = YOUR_USER_ID;

-- Verify follow-ups exist
SELECT * FROM email_follow_ups WHERE status = 'pending';
```

### 3. Debug Points
- Add console.log in `NotificationEmailService.queueEmail()` 
- Check `shouldSendEmail()` logic
- Verify template rendering with test data
- Monitor email_queue table for status changes

### 4. Testing Checklist
- [ ] User has email enabled in preferences
- [ ] SMTP credentials are valid
- [ ] No duplicate reminders on same day
- [ ] Correct timing in dev mode (1/2/3 minutes)
- [ ] Manager escalation triggers after 3rd attempt
- [ ] Email content displays correctly
- [ ] Audit logs are created

## Next Steps

1. **Team Review Session**
   - Walk through the implementation together
   - Test on different developer machines
   - Identify any environment-specific issues

2. **Enhanced Logging**
   - Add structured logging for email queue
   - Create debug mode for verbose output
   - Log template rendering process

3. **Integration Testing**
   - Test with real SMTP server
   - Verify email delivery
   - Check spam folder issues

4. **Documentation**
   - Update user documentation
   - Create troubleshooting guide
   - Document cron job setup for production

## Questions for Team Discussion

1. Should we have different email templates for each attempt (1st/2nd/3rd)?
2. Do we want to allow custom timing per client or document type?
3. Should managers get a daily digest instead of individual escalations?
4. Do we need a "pause reminders" feature for holidays/OOO?
5. Should we add SMS/WhatsApp as additional channels?

## Conclusion

The follow-up email reminder system is architecturally complete and integrated with existing systems. The main challenge is debugging the email queue processing, which appears to be a configuration or data issue rather than a fundamental design problem. With multiple developers testing, we should be able to identify and resolve the remaining issues quickly.

The development mode timing (1/2/3 minutes) makes testing much more efficient than waiting for production intervals (7/14/21 days).

---

**Prepared by:** Development Team  
**For Review by:** All Developers  
**Priority:** High - Core CRM Feature