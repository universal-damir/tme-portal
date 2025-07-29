# Notification System Rewrite - Simple & Reliable

## Overview
Fix rate limiting, clean up state management, and add a notification center in the profile section. Keep it simple and functional.

## Core Fixes

### 1. **Rate Limit Protection**
- Start with 30-second polling
- On 429 error: Double interval (30s → 60s → 120s → max 300s)
- On success: Reset to 30s
- Pause when tab hidden
- Stop on auth errors (prevent logout loops)
- Silent error handling (no console spam)

### 2. **Clean State Architecture**
```
TMEPortalSidebar (Parent)
├── NotificationBadge (shows count)
├── NotificationPanel (simple dropdown)
└── ReviewModal (managed by parent)
```

### 3. **Simple User Flow**
1. Click notification badge → Panel opens
2. Click specific notification → Panel closes, modal opens
3. Click "Review PDF" → PDF opens in new tab
4. For bulk management → Go to Profile section

## File Structure

### New Files:
- `src/components/profile/NotificationCenter.tsx` - Checklist section for profile

### Modified Files:
- `src/hooks/useNotifications.ts` - Fix polling and rate limits
- `src/components/review-system/ui/NotificationPanel.tsx` - Simplify (no modal logic)
- `src/components/portal/TMEPortalSidebar.tsx` - Clean state management
- `src/components/portal/tabs/ProfileTab.tsx` - Add notification center section

## Implementation Details

### **useNotifications.ts Changes:**
- Exponential backoff for 429 errors
- Tab visibility detection to pause polling
- Auth error handling
- Silent error states (no console spam)
- Max retry limits

### **NotificationPanel.tsx Changes:**
- Remove all modal-related state and logic
- Only emit events: `onNotificationClick(notification)`
- Parent handles modal opening
- Clean animations and immediate close

### **TMEPortalSidebar.tsx Changes:**
- Single source of truth for all notification states
- Handle notification clicks → close panel → open modal
- Clean event handling with proper preventDefault
- One modal open at a time rule

### **ProfileTab.tsx Changes:**
- Add "Notifications" section next to "Recent Activity"
- Import and render NotificationCenter component
- Responsive layout for both sections

### **NotificationCenter.tsx (New):**
- Checklist interface with checkboxes
- "Mark All as Read" button
- "Delete Read Notifications" button  
- Filter toggles: "Show Read" / "Unread Only"
- Simple table/list layout
- Bulk selection capabilities
- No polling (uses existing notification state)

## UI Layout

### Profile Page Structure:
```
Profile Tab
├── User Info Section
├── Recent Activity Section (existing)
└── Notifications Section (NEW)
    ├── Header: "Notifications" + "Mark All Read" button
    ├── Filter: [All] [Unread Only] toggle
    ├── Notification List:
    │   ├── [☑] Notification 1 - timestamp
    │   ├── [☐] Notification 2 - timestamp  
    │   └── [☐] Notification 3 - timestamp
    └── Footer: "Delete Read" button
```

### Notification Panel (Dropdown):
- Keep existing design
- Remove modal opening logic
- Just emit click events
- Immediate close on notification click

## Error Handling

### Rate Limiting:
- Detect 429 responses
- Increase polling interval exponentially
- Show "connection issues" in badge (optional)
- Never break the user experience

### Network Issues:
- Graceful degradation
- Keep showing last known notification count
- Manual refresh capability
- No error toasts/popups

### Auth Issues:
- Stop polling on 401/403
- Don't trigger logouts
- Resume when auth recovered

## Data Flow

### Normal Flow:
1. useNotifications polls every 30s
2. Updates badge count in sidebar
3. User clicks badge → panel opens
4. User clicks notification → panel closes, modal opens

### Bulk Management Flow:
1. User goes to Profile tab
2. NotificationCenter shows all notifications
3. User can check/uncheck, bulk mark as read
4. Changes sync back to main notification state

## Retention Policy
- Notifications stay until user manually marks them as "committed"
- Read notifications stay in list (just visually different)
- "Delete Read" button removes committed/read notifications
- Unread notifications always visible

## Technical Specifications

### Polling Strategy:
- Initial interval: 30 seconds
- Exponential backoff: interval × 2 on each 429 error
- Maximum interval: 300 seconds (5 minutes)
- Reset to 30s on successful response
- Pause completely when tab is hidden/inactive

### State Management:
- Single notification state in TMEPortalSidebar
- Event-driven communication between components
- No setTimeout hacks or race conditions
- Proper cleanup on component unmount

### Error Recovery:
- Silent handling of network errors
- Automatic retry with backoff
- Graceful degradation when services unavailable
- User can manually refresh if needed

**This keeps everything simple, fixes the rate limiting, and gives users proper notification management.**

## Implementation Phases

### Phase 1: Fix Rate Limiting & Polling (Critical) 
**Status: ✅ Complete**

- [x] Modify `useNotifications.ts` to implement smart polling
- [x] Add exponential backoff for 429 errors
- [x] Implement tab visibility detection
- [x] Add auth error handling (stop polling on 401/403)
- [x] Remove console spam and add silent error handling
- [x] Test polling behavior with network throttling

**Acceptance Criteria:**
- ✅ No more 429 errors in console (silent handling with exponential backoff)
- ✅ No unexpected logouts (auth errors stop polling instead of causing logout loops)
- ✅ Polling pauses when tab hidden (saves resources and prevents rate limits)
- ✅ Graceful handling of network issues (smart backoff, silent errors, keeps existing data)

---

### Phase 2: Clean Up State Management 
**Status: ✅ Complete**

- [x] Remove modal-related logic from `NotificationPanel.tsx`
- [x] Simplify NotificationPanel to only emit click events
- [x] Move all notification state management to `TMEPortalSidebar.tsx`
- [x] Fix event handling to prevent profile page redirects
- [x] Ensure only one modal can be open at a time
- [x] Test notification click → panel close → modal open flow

**Acceptance Criteria:**
- ✅ Clicking notification closes panel and opens modal cleanly (event-driven architecture)
- ✅ No more dual panel + modal opening (proper state management)
- ✅ Review PDF button works correctly (proper event handling with preventDefault)
- ✅ No profile page redirects (separated click handlers)

---

### Phase 3: Create Profile Notification Center
**Status: ❌ Not Started**

- [ ] Create `src/components/profile/NotificationCenter.tsx`
- [ ] Design checklist interface with TME design system
- [ ] Implement "Mark All as Read" functionality  
- [ ] Add "Delete Read Notifications" feature
- [ ] Create filter toggles (All/Unread Only)
- [ ] Add bulk selection capabilities
- [ ] Integrate with existing notification state

**Acceptance Criteria:**
- Notification center appears in Profile tab
- Users can manage notifications in bulk
- Filters work correctly
- Changes sync with sidebar badge count

---

### Phase 4: Integrate Profile Section
**Status: ❌ Not Started**

- [ ] Modify `ProfileTab.tsx` to include notification section
- [ ] Add responsive layout for notifications + recent activity
- [ ] Style notification section to match existing profile design
- [ ] Test responsive behavior on different screen sizes
- [ ] Ensure notifications sync between sidebar and profile

**Acceptance Criteria:**
- Profile page shows notifications section
- Layout is responsive and matches design system
- Data syncs properly between sidebar and profile views

---

### Phase 5: Final Testing & Polish
**Status: ❌ Not Started**

- [ ] End-to-end testing of complete notification flow
- [ ] Test rate limiting behavior with server load
- [ ] Verify no memory leaks or state issues
- [ ] Test error recovery scenarios
- [ ] Polish animations and transitions
- [ ] Update documentation

**Acceptance Criteria:**
- Complete user flow works smoothly
- No console errors or warnings
- Proper error handling in all scenarios
- Good user experience across all devices

---

## Progress Tracking

**Overall Progress: 40% Complete (2/5 phases)**

| Phase | Status | Completion Date | Notes |
|-------|--------|----------------|--------|
| Phase 1: Rate Limiting | ✅ Complete | 2025-07-29 | Critical for stability - DONE |
| Phase 2: State Management | ✅ Complete | 2025-07-29 | Fixes UI confusion - DONE |
| Phase 3: Profile Center | ❌ Not Started | - | New feature |
| Phase 4: Integration | ❌ Not Started | - | UI polish |
| Phase 5: Testing | ❌ Not Started | - | Final validation |

---

## Completion Checklist

When each phase is complete, update the status:
- ❌ Not Started
- 🚧 In Progress  
- ⚠️ Needs Review
- ✅ Complete

**Phase completion requires:**
1. All tasks in phase completed
2. Acceptance criteria met
3. Code review passed
4. Testing completed