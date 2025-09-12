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
Day 0: Email Sent → Follow-up Created (Due: Day 7)
         ↓
Day 7: 1st Follow-up Due
         ├─ Complete → Done
         ├─ Snooze → Becomes 2nd follow-up (Due: Day 14)
         └─ No action → Reminder
         ↓
Day 14: 2nd Follow-up Due
         ├─ Complete → Done
         ├─ Snooze → Becomes 3rd follow-up (Due: Day 21)
         └─ No action → Reminder
         ↓
Day 21: 3rd Follow-up Due
         ├─ Complete → Done
         ├─ No Response → Move to tab
         └─ No action → Auto-escalate (Day 22)
         ↓
Day 22+: Manager Escalation (if user not manager)
```

### Key Business Logic

1. **Automatic Creation**: Triggered when email has attachments
2. **Progressive Escalation**: 7 → 14 → 21 days
3. **Snooze Behavior**: Upgrades to next level (1st → 2nd → 3rd)
4. **Manager Escalation**: After 3rd attempt expires
5. **Self-Notification Prevention**: Managers don't notify themselves

## Customization Guide

### Modifying Follow-Up Schedule

To change the 7-14-21 day schedule, edit in `follow-up-service.ts`:

```typescript
private static calculateDueDate(sentDate: Date, followUpNumber: 1 | 2 | 3): Date {
  const daysMap = { 
    1: 7,   // Change these values
    2: 14,  
    3: 21 
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
│   ├── user/follow-ups/     # API endpoints
│   ├── email/send/           # Email integration
│   └── cron/escalate/        # Escalation job
├── components/follow-ups/    # UI components
├── hooks/useFollowUps.ts     # React hook
├── lib/services/
│   └── follow-up-service.ts  # Business logic
└── types/follow-up.ts        # TypeScript types

database/migrations/
└── 018_email_follow_ups.sql  # Database schema
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