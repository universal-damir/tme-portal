# Email Follow-Up System Documentation

## Overview
The Email Follow-Up System is a streamlined CRM-like feature that automatically tracks email follow-ups with clients, ensuring no communication falls through the cracks.

## Key Features

### 1. Automatic Follow-Up Creation
- When an email with PDF attachment is sent through the portal, a follow-up entry is automatically created
- Initial follow-up is due after 7 days from email send date

### 2. Three-Tab Interface
- **Follow Up Tab**: Active follow-ups requiring action
- **Completed Tab**: Follow-ups where client has responded
- **No Response Tab**: Clients who haven't responded after 3 attempts

### 3. Progressive Follow-Up Schedule
- **1st Follow-up**: Day 7 after initial email
- **2nd Follow-up**: Day 14 (if snoozed or no action taken)
- **3rd Follow-up**: Day 21 (final attempt)
- After 3rd attempt with no response, automatically moved to "No Response" tab

### 4. Quick Actions
Each follow-up item has the following actions:
- **Complete**: Mark as done when client responds
- **Snooze 7 days**: Delay follow-up by a week (upgrades to next level)
- **Resend**: Create a new follow-up cycle
- **No Response** (3rd attempt only): Manually mark as no response

### 5. Manager Escalation
- After 3rd follow-up expires (Day 22+), system automatically escalates to manager
- Manager receives notification about non-responsive clients
- If user is already a manager, no self-notification is sent

## Database Schema

### Tables Created
1. **email_follow_ups**: Main follow-up tracking table
2. **email_follow_up_history**: Audit trail of all actions

## How to Use

### For End Users
1. Send an email with attachment through the portal
2. System automatically creates a follow-up entry
3. Check the "Follow Up" tab on Day 7
4. Take action: Complete if client responded, Snooze if need more time, or Resend
5. System will remind you again based on your action

### For Administrators

#### Running the Migration
```bash
# Run the follow-up system migration
npm run migrate:follow-ups

# Or manually
psql $DATABASE_URL -f database/migrations/018_email_follow_ups.sql
```

#### Setting Up Cron Job for Escalation
The system includes an endpoint for automatic escalation checks:
```
GET /api/cron/escalate-follow-ups
```

Set up a daily cron job to call this endpoint:
```bash
# Add to crontab
0 9 * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/escalate-follow-ups
```

## Integration Points

### Email Send API
The follow-up system is automatically integrated with the email sending process at:
- `/api/email/send/route.ts`

When an email is sent:
1. Email is sent via SMTP
2. Follow-up entry is created
3. Legacy todo is also created (for backward compatibility)

### Components

#### FollowUpPanel
Main component displaying the 3-tab interface:
```tsx
import { FollowUpPanel } from '@/components/follow-ups'

<FollowUpPanel 
  maxHeight="500px"
  autoRefresh={true}
  refreshInterval={60000}
/>
```

#### Hooks
```tsx
import { useFollowUps } from '@/hooks/useFollowUps'

const { followUps, stats, updateFollowUp } = useFollowUps({
  autoRefresh: true,
  refreshInterval: 60000
})
```

## API Endpoints

### GET /api/user/follow-ups
Fetch user's follow-ups with optional filters:
- `status`: pending, completed, no_response
- `follow_up_number`: 1, 2, or 3
- `client_name`: Filter by client name

### PATCH /api/user/follow-ups
Update follow-up status:
```json
{
  "follow_up_id": "uuid",
  "action": "complete|snooze|no_response|resend",
  "reason": "client_responded|signed|paid|cancelled|other"
}
```

### POST /api/user/follow-ups
Manually create a follow-up:
```json
{
  "email_subject": "Cost Overview for John Smith",
  "client_name": "John Smith",
  "client_email": "john@example.com",
  "document_type": "Cost Overview"
}
```

## Visual Indicators
- **Normal**: Black text on white background
- **Due Today**: Orange background
- **Overdue**: Red background
- **Completed**: Green badge
- **No Response**: Listed in separate tab for manual review

## Future Enhancements
1. Email template generation for follow-ups
2. WhatsApp/SMS integration
3. Analytics dashboard
4. Bulk actions for multiple follow-ups
5. Custom follow-up schedules per client type
6. Auto-detection of client responses (email integration)