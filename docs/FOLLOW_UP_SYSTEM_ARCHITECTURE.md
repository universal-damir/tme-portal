# Email Follow-Up System - Architecture & Developer Guide

## System Overview

The Email Follow-Up System is a CRM-like feature that automatically tracks email follow-ups with clients, ensuring timely communication and escalation when needed.

## Architecture Components

### 1. Database Schema

#### Tables
- **`email_follow_ups`**: Main tracking table for follow-ups
- **`email_follow_up_history`**: Audit trail for all actions

#### Key Fields
```sql
email_follow_ups:
- id (UUID)
- user_id (references users)
- email_subject
- client_name
- client_email
- follow_up_number (1-3)
- sent_date
- due_date
- status (pending/completed/no_response/snoozed)
- escalated_to_manager (boolean)
- manager_id (references users)
```

### 2. Backend Services

#### FollowUpService (`/src/lib/services/follow-up-service.ts`)
Core service layer handling all follow-up operations:

```typescript
// Key methods
FollowUpService.create()           // Create new follow-up
FollowUpService.getByUser()        // Fetch user's follow-ups
FollowUpService.updateStatus()     // Mark complete/no response
FollowUpService.snooze()          // Delay by 7 days & upgrade level
FollowUpService.resend()          // Create fresh follow-up cycle
FollowUpService.escalateOverdueFollowUps() // Manager escalation
```

#### API Routes (`/src/app/api/user/follow-ups/`)
- `GET /api/user/follow-ups` - Fetch follow-ups with filters
- `POST /api/user/follow-ups` - Create manual follow-up
- `PATCH /api/user/follow-ups` - Update status/snooze/resend

### 3. Frontend Components

#### FollowUpPanel (`/src/components/follow-ups/FollowUpPanel.tsx`)
Main container with 3-tab interface:
- **Awaiting Response Tab**: Active items requiring action (renamed from "Follow Up")
- **Completed Tab**: Client responded items
- **No Response (3 attempts) Tab**: After 3 failed attempts

#### FollowUpTable (`/src/components/follow-ups/FollowUpTable.tsx`)
Table component with different layouts per tab:
- Pending: Checkbox only in last column (simplified from multiple action buttons)
- Completed: Read-only with completion reason
- No Response: Single "Mark Complete" button

**Key UI Features:**
- Full subject line display (no truncation)
- Click-to-copy subject functionality with subtle copy icon
- Confirmation modal using React Portals (prevents hydration errors)
- Graceful refresh with `requestAnimationFrame` (no flickering)

#### useFollowUps Hook (`/src/hooks/useFollowUps.ts`)
React hook for state management with graceful refresh:
```typescript
const { followUps, stats, updateFollowUp, createFollowUp } = useFollowUps({
  autoRefresh: true,
  refreshInterval: 60000
})
```
**Improvements:**
- Skip loading state during auto-refresh (prevents UI flickering)
- Uses `requestAnimationFrame` for smooth data updates
- Separate loading states for initial load vs auto-refresh

### 4. Integration Points

#### Email Send API (`/src/app/api/email/send/route.ts`)
Automatically creates follow-up when email is sent:
1. Email sent via SMTP with metadata support
2. Follow-up created with proper client name (if tables exist)
3. Client name extraction hierarchy:
   - First: `metadata.clientName` from form data
   - Second: `metadata.clientFirstName + clientLastName`
   - Third: PDF filename parsing (fallback)
   - Fourth: Email address extraction (last resort)

## How It Works

### Follow-Up Lifecycle

```
Day 0: Email Sent → Follow-up Created (Due: Day 1)
         ↓
Day 1: 1st Follow-up Due
         ├─ Email Reminder Sent (if enabled)
         ├─ Complete → Done
         ├─ Snooze → Becomes 2nd follow-up (Due: Day 2)
         └─ No action → Daily reminders continue
         ↓
Day 2: 2nd Follow-up Due
         ├─ Email Reminder Sent (if enabled)
         ├─ Complete → Done
         ├─ Snooze → Becomes 3rd follow-up (Due: Day 3)
         └─ No action → Daily reminders continue
         ↓
Day 3: 3rd Follow-up Due
         ├─ Final Email Reminder Sent (if enabled)
         ├─ Complete → Done
         ├─ No Response → Move to tab
         └─ No action → Auto-escalate (Day 4)
         ↓
Day 4+: Manager Escalation
         ├─ Escalation Email to Manager
         └─ Status → "No Response"
```

### Key Business Logic

1. **Automatic Creation**: Triggered when email has attachments
2. **Progressive Escalation**: 1 → 2 → 3 days
3. **Email Reminders**: Sent automatically when follow-ups are due (configurable)
4. **Snooze Behavior**: Upgrades to next level (1st → 2nd → 3rd)
5. **Manager Escalation**: After 3rd attempt expires with email notification
6. **Self-Notification Prevention**: Managers don't notify themselves

### Cron Job Configuration

**Required Cron Jobs for Full Functionality:**

```bash
# Send daily follow-up reminders (run at 9 AM daily)
0 9 * * * curl -H "Authorization: Bearer ${CRON_SECRET}" https://your-domain.com/api/cron/send-follow-up-reminders

# Process escalations (run at 10 AM daily)
0 10 * * * curl -H "Authorization: Bearer ${CRON_SECRET}" https://your-domain.com/api/cron/escalate-follow-ups

# Process general follow-ups and todos (run every hour)
0 * * * * curl -H "Authorization: Bearer ${CRON_SECRET}" https://your-domain.com/api/cron/process-follow-ups
```

**Environment Variable Required:**
```bash
CRON_SECRET=your-secure-cron-secret-here
```

## Customization Guide

### Modifying Follow-Up Schedule

To change the 1-2-3 day schedule, edit in `follow-up-service.ts`:

```typescript
private static calculateDueDate(sentDate: Date, followUpNumber: 1 | 2 | 3): Date {
  const daysMap = { 
    1: 1,   // Change these values
    2: 2,  
    3: 3 
  };
  // ...
}
```

### Adding New Status Types

1. Update database constraint:
```sql
ALTER TABLE email_follow_ups 
DROP CONSTRAINT email_follow_ups_status_check,
ADD CONSTRAINT email_follow_ups_status_check 
CHECK (status IN ('pending', 'completed', 'no_response', 'snoozed', 'your_new_status'));
```

2. Update TypeScript types in `/src/types/follow-up.ts`:
```typescript
export type FollowUpStatus = 'pending' | 'completed' | 'no_response' | 'snoozed' | 'your_new_status';
```

### Customizing Email Detection

To change what emails trigger follow-ups, modify in `/src/app/api/email/send/route.ts`:

```typescript
// Current: Only emails with attachments
if (primaryFilename && attachments && attachments.length > 0) {
  // Create follow-up
}

// Example: All emails to clients
if (to.includes('@client-domain.com')) {
  // Create follow-up
}
```

### Adding Custom Actions

To add new actions beyond Complete/Snooze/Resend:

1. Add action handler in `FollowUpService`:
```typescript
static async customAction(followUpId: string, userId: number): Promise<EmailFollowUp> {
  // Your logic
}
```

2. Add API route case:
```typescript
case 'custom_action':
  updatedFollowUp = await FollowUpService.customAction(follow_up_id, userId);
  break;
```

3. Add button in `FollowUpTable.tsx`:
```tsx
<motion.button onClick={() => onAction(followUp.id, 'custom_action')}>
  Custom Action
</motion.button>
```

### Modifying Manager Escalation

Edit escalation logic in `follow-up-service.ts`:

```typescript
static async escalateOverdueFollowUps(): Promise<void> {
  // Find overdue 3rd follow-ups
  const overdueResult = await query(
    `SELECT ef.*, u.role, u.is_manager
     FROM email_follow_ups ef
     JOIN users u ON ef.user_id = u.id
     WHERE ef.status = 'pending'
     AND ef.follow_up_number = 3
     AND ef.due_date < NOW() - INTERVAL '1 day'  // Change timing here
     AND ef.escalated_to_manager = FALSE`
  );
  // ...
}
```

### Changing UI Layout

The system uses a 3-tab layout. To add more tabs:

1. Update `FollowUpPanel.tsx`:
```tsx
const [activeTab, setActiveTab] = useState<'follow_up' | 'completed' | 'no_response' | 'your_tab'>('follow_up');

// Add to tab array
{ key: 'your_tab', label: 'Your Tab' }
```

2. Add data filtering in `useFollowUps` hook
3. Add rendering case in the panel

## Database Migrations

### Running Migrations

**Local Development:**
```bash
docker exec -i tme-portal-1-postgres-1 psql -U tme_user -d tme_portal < database/migrations/018_email_follow_ups.sql
```

**Staging/Production:**
Follow the standard workflow in `MIGRATION_WORKFLOW_GUIDE.md`

### Migration Classification
- **Type**: SAFE (backward compatible)
- **Can deploy before code**: YES
- **Tables created**: email_follow_ups, email_follow_up_history

## Testing

### Manual Testing
1. Send email with attachment
2. Check follow-up appears in "Follow Up" tab
3. Test Complete action
4. Test Snooze (verify it upgrades level)
5. Test Resend (creates new cycle)
6. Wait for due date to test overdue styling

### Automated Testing Points
- Follow-up creation on email send
- Status transitions
- Snooze level upgrading
- Manager escalation logic
- Table existence checks

## Performance Considerations

1. **Indexes**: Created on user_id, status, due_date, client_name
2. **Auto-refresh**: Default 60 seconds (configurable)
3. **Pagination**: Returns 50 items by default
4. **Graceful degradation**: Works without tables

## Security Notes

1. **User isolation**: Users only see their own follow-ups
2. **Audit trail**: All actions logged in history table
3. **No sensitive data**: Only email metadata stored
4. **Role-based escalation**: Manager check prevents self-notification

## Troubleshooting

### Common Issues

**"Follow-ups table not initialized"**
- Run migration: `npm run migrate:follow-ups`

**Follow-ups not appearing**
- Check email has attachments
- Verify tables exist
- Check browser console for API errors

**Escalation not working**
- Verify cron job is set up
- Check is_manager field in users table
- Review escalation date logic

## Recent Updates (January 2025)

### Email Reminder System (January 12, 2025)
1. **Automated Email Reminders**:
   - Email notifications sent automatically when follow-ups are due
   - Separate templates for 1st/2nd/3rd attempts
   - Manager escalation emails for overdue 3rd attempts
   - User preference controls for follow-up emails

2. **Email Templates Added**:
   - `follow_up_reminder` - For 7/14/21 day reminders
   - `follow_up_escalation` - For manager escalations
   - Professional format matching existing email standards
   - Dynamic content based on attempt number and status

3. **New Cron Endpoints**:
   - `/api/cron/send-follow-up-reminders` - Daily email reminders
   - Checks user preferences before sending
   - Prevents duplicate reminders on same day
   - Logs all reminder activities

4. **Integration Points**:
   - Uses existing NotificationEmailService
   - Leverages email queue system with retry logic
   - Respects user notification preferences
   - Full audit trail in email_follow_up_history

## Recent Updates (January 2025)

### Dropdown Action System (January 13, 2025)
1. **Text-Based Actions**:
   - Replaced icon buttons with dropdown menu
   - Three clear text options:
     - "Completed" - Marks as complete
     - "Follow-up Reminder Sent" - Snoozes to next level
     - "Client Did Not Respond" - Opens team member selection

2. **Team Member Selection**:
   - Any team member can be selected for escalation
   - Autocomplete search after 2 characters
   - Managers/supervisors shown first, then regular team members
   - Search by name, email, or employee code
   - Prevents self-escalation

3. **Manual Escalation Flow**:
   - User selects "Client Did Not Respond" from dropdown
   - Modal opens with team member search
   - Type 2+ characters to search all active employees
   - Select team member and confirm escalation
   - Escalation email sent to selected person

### UI/UX Improvements
1. **Renamed Labels** for clarity:
   - "Email Follow-ups" → "Email Response Tracker"
   - "Follow Up" tab → "Awaiting Response"
   - "No Response" → "No Response (3 attempts)"
   - "Sent Date" → "Originally Sent"
   - "Due Date" → "Next Follow-up"
   - Shows "1st/2nd/3rd Attempt" instead of "follow-up"

2. **Simplified Actions**:
   - Removed action buttons (Complete/Snooze/Resend)
   - Single checkbox in last column for completion
   - Confirmation modal to prevent accidental actions

3. **Visual Enhancements**:
   - Colored badges for attempt numbers (blue/orange/red)
   - Full subject line display without truncation
   - Click-to-copy subject with hover icon
   - Better visual hierarchy with stronger borders
   - Alternating row colors for better readability

4. **Technical Improvements**:
   - Fixed hydration errors using React Portals for modals
   - Graceful refresh without UI flickering
   - Proper client name extraction from form metadata
   - Support for CIT letters and all email types

### Integration with Profile Tab
- Email Response Tracker is now the primary component in Profile Tab
- Todo List Panel has been removed for simplicity
- Increased vertical space (700px) for better visibility

## Future Enhancements

Potential improvements to consider:

1. **Email Templates**: Pre-written follow-up messages
2. **Bulk Operations**: Select multiple items for actions
3. **Custom Schedules**: Per-client follow-up timing
4. **Email Integration**: Auto-detect client responses
5. **Analytics Dashboard**: Follow-up success rates
6. **WhatsApp/SMS**: Multi-channel follow-ups
7. **AI Suggestions**: Smart follow-up content generation

## Code Organization

```
src/
├── app/api/
│   ├── user/follow-ups/      # API endpoints
│   ├── user/managers/         # Team member search API
│   ├── email/send/            # Email integration
│   └── cron/                  # Cron jobs
│       ├── send-follow-up-reminders/
│       ├── process-email-queue/
│       └── escalate-follow-ups/
├── components/follow-ups/     # UI components
│   ├── FollowUpPanel.tsx
│   ├── FollowUpTable.tsx
│   ├── ActionDropdown.tsx     # New dropdown menu
│   └── ManagerSelectionModal.tsx  # Team member selector
├── hooks/useFollowUps.ts      # React hook
├── lib/services/
│   ├── follow-up-service.ts   # Business logic
│   └── notification-email.ts  # Email service
└── types/follow-up.ts         # TypeScript types

database/migrations/
├── 018_email_follow_ups.sql   # Database schema
└── 019_follow_up_email_templates.sql  # Email templates
```

## Support & Maintenance

- Migration is idempotent (safe to run multiple times)
- System gracefully handles missing tables
- Backward compatible with existing todo system
- No breaking changes to existing functionality

---

*Last Updated: January 2025*
*Version: 1.1.0*

## Changelog

### Version 1.1.0 (January 2025)
- Improved UI/UX with simplified actions and better visual hierarchy
- Fixed hydration errors with React Portals implementation
- Enhanced client name extraction with metadata support
- Added click-to-copy functionality for email subjects
- Renamed system labels for better clarity
- Removed action buttons in favor of single checkbox
- Implemented graceful refresh mechanism
- Integrated as primary component in Profile Tab

### Version 1.0.0 (January 2025)
- Initial release of Email Follow-Up System
- Basic 3-tab interface with follow-up tracking
- Automatic creation on email send
- Manager escalation after 3 attempts