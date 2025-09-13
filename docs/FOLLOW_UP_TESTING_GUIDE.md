# Email Follow-Up System Testing Guide

## Overview
This guide provides step-by-step instructions to test all features of the Email Response Tracker system, including the dropdown menu actions and team member selection for escalation.

## Prerequisites

### 1. Database Setup
Ensure migrations are applied:
```bash
# Check if tables exist
docker exec -i tme-portal-1-postgres-1 psql -U tme_user -d tme_portal -c "\dt email_follow*"

# If not, run migrations
docker exec -i tme-portal-1-postgres-1 psql -U tme_user -d tme_portal < database/migrations/018_email_follow_ups.sql
docker exec -i tme-portal-1-postgres-1 psql -U tme_user -d tme_portal < database/migrations/019_follow_up_email_templates.sql
```

### 2. Development Environment
```bash
# Start the development server
npm run dev

# In a separate terminal, start the email queue processor
npm run process-email-queue:dev
```

## Test Scenarios

### 1. Creating Follow-Ups via Email Send

**Steps:**
1. Navigate to any form that sends emails (e.g., Cost Overview)
2. Fill out the form with test data
3. Send the email with an attachment
4. Go to Profile Tab → Email Response Tracker

**Expected Result:**
- New follow-up appears in "Awaiting Response" tab
- Status shows "1st Attempt"
- Due date shows appropriate time (1 minute in dev, 1 day in production)

### 2. Testing Dropdown Actions

#### A. Mark as Completed
**Steps:**
1. Click the dropdown menu (three dots) on a follow-up
2. Select "Completed"
3. Confirm in the modal

**Expected Result:**
- Follow-up moves to "Completed" tab
- Status changes to "completed"
- Item removed from "Awaiting Response" tab

#### B. Follow-up Reminder Sent (Snooze)
**Steps:**
1. Click the dropdown menu on a 1st attempt follow-up
2. Select "Follow-up Reminder Sent"
3. Confirm in the modal

**Expected Result:**
- Follow-up upgrades to "2nd Attempt"
- Due date extends by 1 minute (dev) or 1 day (production)
- Badge color changes from blue to orange

**Test Progression:**
- Repeat for 2nd → 3rd attempt (badge becomes red)
- After 3rd attempt, snooze is no longer available

#### C. Client Did Not Respond (Manual Escalation)
**Steps:**
1. Click the dropdown menu on any follow-up
2. Select "Client Did Not Respond"
3. In the modal that opens:
   - Start typing a team member's name (at least 2 characters)
   - Select from the autocomplete results
   - Click "Escalate to Manager"

**Expected Result:**
- Follow-up moves to "No Response (3 attempts)" tab
- Escalation email sent to selected team member
- Status changes to "no_response"

### 3. Testing Team Member Search

**Steps:**
1. Click dropdown → "Client Did Not Respond"
2. Test search functionality:
   - Type 1 character: Should show "Type at least 2 characters to search"
   - Type 2+ characters: Should show matching team members
   - Search by name, email, or employee code

**Expected Results:**
- Managers/Supervisors appear first with blue badges
- Regular team members appear below
- Current user is excluded from results
- Maximum 20 results shown

### 4. Testing Automated Email Reminders

#### Development Mode (Minutes)
**Steps:**
1. Create a new follow-up via email send
2. Wait 1 minute for it to become due
3. Run the reminder script:
```bash
node scripts/test-follow-up-reminders.js
```

**Expected Result:**
- Email reminder sent to your inbox
- Check email content shows:
  - Correct attempt number
  - Client name and email subject
  - Time since original email (e.g., "1 minute ago")

#### Testing All Levels
```bash
# Quick test script for all scenarios
node scripts/test-follow-up-dev.js
```

This creates test follow-ups at different stages automatically.

### 5. Testing Automatic Escalation

**Steps:**
1. Let a 3rd attempt follow-up expire (wait 1 minute past due date in dev)
2. Run escalation script:
```bash
curl -X POST http://localhost:3000/api/cron/escalate-follow-ups \
  -H "Authorization: Bearer test-secret"
```

**Expected Result:**
- Follow-up automatically moves to "No Response (3 attempts)" tab
- Manager receives escalation email (if configured)

## Email Queue Processing

### Manual Processing
```bash
# Process pending emails
curl -X POST http://localhost:3000/api/cron/process-email-queue \
  -H "Authorization: Bearer test-secret"
```

### Automatic Processing (Development)
```bash
# Run this in a separate terminal for continuous processing
npm run process-email-queue:dev
```

## Troubleshooting

### Emails Not Sending
1. Check email queue:
```bash
docker exec -i tme-portal-1-postgres-1 psql -U tme_user -d tme_portal \
  -c "SELECT * FROM email_queue WHERE status = 'pending' ORDER BY created_at DESC LIMIT 5;"
```

2. Process queue manually:
```bash
curl -X POST http://localhost:3000/api/cron/process-email-queue \
  -H "Authorization: Bearer test-secret"
```

3. Check logs:
```bash
# Check application logs
npm run dev

# Check for email service errors in console output
```

### Follow-Ups Not Appearing
1. Verify tables exist:
```bash
docker exec -i tme-portal-1-postgres-1 psql -U tme_user -d tme_portal \
  -c "SELECT COUNT(*) FROM email_follow_ups WHERE user_id = [YOUR_USER_ID];"
```

2. Check if email had attachments (required for follow-up creation)

3. Verify user preferences allow follow-up emails:
   - Go to Settings → Notification Preferences
   - Ensure "Follow-up Reminders" is enabled

### Team Member Search Not Working
1. Verify at least 2 characters typed
2. Check console for API errors
3. Verify active users exist in database:
```bash
docker exec -i tme-portal-1-postgres-1 psql -U tme_user -d tme_portal \
  -c "SELECT COUNT(*) FROM users WHERE status = 'active';"
```

## Test Data Cleanup

Remove test follow-ups:
```bash
# Delete all follow-ups for your user (be careful!)
docker exec -i tme-portal-1-postgres-1 psql -U tme_user -d tme_portal \
  -c "DELETE FROM email_follow_ups WHERE client_name LIKE 'Test%' AND user_id = [YOUR_USER_ID];"
```

## Production Testing

### Timing Differences
- Development: 1, 2, 3 minutes
- Production: 1, 2, 3 days

### Cron Jobs (Production Only)
```bash
# These run automatically in production
0 9 * * * - Send daily reminders
0 10 * * * - Process escalations
0 * * * * - Process email queue
```

## Quick Reference

### Dropdown Action Meanings
- **"Completed"** - Client responded, mark as done
- **"Follow-up Reminder Sent"** - You sent a manual follow-up, snooze to next level
- **"Client Did Not Respond"** - Escalate to a team member

### Follow-Up Lifecycle
```
Email Sent → 1st Attempt (blue) → 2nd Attempt (orange) → 3rd Attempt (red) → No Response/Escalated
```

### Key Files to Monitor
- `/src/components/follow-ups/ActionDropdown.tsx` - Dropdown menu logic
- `/src/components/follow-ups/ManagerSelectionModal.tsx` - Team selection
- `/src/lib/services/follow-up-service.ts` - Core business logic
- `/src/app/api/user/managers/route.ts` - Team member search API

## Support

If issues persist:
1. Check browser console for errors
2. Review application logs
3. Verify database connectivity
4. Ensure email service credentials are configured
5. Check `FOLLOW_UP_EMAIL_TROUBLESHOOTING_REPORT.md` for detailed debugging

---

*Last Updated: January 2025*
*Version: 1.0.0*