# Review System Implementation Plan
## 4-Eyes Review System for TME Portal v5.2

### Overview
Implement a generic review/approval workflow system starting with Golden Visa, then roll out app-wide to all forms (Cost Overview, Company Services, Taxation, Corporate Changes).

---

## Phase 1: Database & Core Infrastructure ✅

### 1.1 Database Schema Migration
- [x] Create `applications` table (generic storage for all form types)
- [x] Create `notifications` table (in-app notification system)
- [x] Add indexes for performance optimization
- [x] Add new permissions for review system
- [x] Create rollback migration for safety
- [x] Test migration on development database

### 1.2 Core Types & Interfaces
- [x] Create TypeScript interfaces for review system
- [x] Define application status enums
- [x] Create notification type definitions
- [x] Add form data type mappings
- [x] Add testing scripts and npm commands

---

## Phase 2: Notification System ✅

### 2.1 Backend API Routes
- [x] `/api/notifications` - GET user notifications
- [x] `/api/notifications/[id]/read` - Mark notification as read
- [x] `/api/notifications/mark-all-read` - Bulk mark as read
- [x] `/api/review-system/health` - Health check endpoint
- [x] `/api/applications` - CRUD operations for applications
- [x] `/api/applications/[id]/review` - Review submission endpoint

### 2.2 Notification Infrastructure
- [x] Create notification service functions with safety checks
- [x] Implement real-time polling mechanism with error recovery
- [x] Add comprehensive feature flags and environment configuration
- [x] Build notification UI component with TME design system
- [x] Add notification badge to sidebar/header  
- [x] Create notification dropdown/panel with animations
- [x] Implement safe rollback capabilities

---

## Phase 3: Generic Review Components ✅

### 3.1 Review Modal Component
- [x] Reviewer selection dropdown (department + UH user Uwe)
- [x] Urgency level selector (low/medium/high)
- [x] Comments field for submission
- [x] Submit for Review button integration

### 3.2 Review Interface Component
- [x] Review form display (read-only populated state)
- [x] Approve/Reject action buttons
- [x] Comments field for review feedback
- [x] Review history display

### 3.3 Application Status Components
- [x] Status badge component (draft/pending/approved/rejected)
- [x] Status timeline component
- [x] Review comments display

---

## Phase 4: Golden Visa Integration ✅

### 4.1 Button Integration
- [x] Replace current button layout:
  - **Current**: `[Preview PDF] [Download PDF]`
  - **New**: `[Preview PDF] [Submit for Review] [Download PDF*]`
- [x] Implement conditional Download PDF (only after approval)
- [x] Add review status indicator

### 4.2 Form State Management
- [x] Save/load application state from database
- [x] Handle rejected applications (preserve form data)
- [x] Implement auto-save functionality
- [x] Add form validation before review submission

### 4.3 Review Workflow
- [x] Submit application for review
- [x] Send notification to selected reviewer
- [x] Handle reviewer actions (approve/reject)
- [x] Update submitter with review outcome
- [x] Enable PDF download after approval

---

## Phase 5: User Management & Permissions 🔧

### 5.1 Reviewer Selection System
- [x] API endpoint to get department colleagues
- [x] Include "UH user Uwe" in all department dropdowns
- [x] Exclude self from reviewer options
- [x] Handle reviewer availability/status

### 5.2 Permission System Integration
- [ ] Add review permissions to RBAC system
- [ ] Check user permissions for review actions
- [ ] Implement reviewer role validation
- [ ] Add audit logging for review actions

---

## Phase 6: Testing & Validation ✅

### 6.1 Golden Visa Testing
- [ ] Test complete review workflow
- [ ] Test rejection and re-editing flow
- [ ] Test notification delivery and read status
- [ ] Test multi-user scenario (different departments)
- [ ] Test UH user Uwe universal access

### 6.2 Performance & Security Testing
- [ ] Test database performance with large datasets
- [ ] Validate notification polling performance
- [ ] Security audit of review permissions
- [ ] Test edge cases and error handling

---

## Phase 7: App-Wide Rollout 🚀

### 7.1 Cost Overview Integration
- [ ] Integrate review system into Cost Overview tab
- [ ] Adapt form data serialization
- [ ] Test review workflow
- [ ] Update PDF generation logic

### 7.2 Company Services Integration
- [ ] Integrate review system into Company Services tab
- [ ] Adapt form data serialization
- [ ] Test review workflow
- [ ] Update PDF generation logic

### 7.3 Taxation Integration
- [ ] Integrate review system into Taxation tab
- [ ] Adapt form data serialization
- [ ] Test review workflow
- [ ] Update PDF generation logic

### 7.4 Corporate Changes Integration
- [ ] Integrate review system into Corporate Changes tab
- [ ] Adapt form data serialization
- [ ] Test review workflow
- [ ] Update PDF generation logic

---

## Phase 8: Polish & Documentation 📚

### 8.1 UI/UX Improvements
- [ ] Add loading states and animations
- [ ] Improve error handling and user feedback
- [ ] Add keyboard shortcuts for reviewers
- [ ] Implement bulk review actions

### 8.2 Documentation
- [ ] Update user documentation
- [ ] Create reviewer training guide
- [ ] Document API endpoints
- [ ] Update deployment instructions

---

## Technical Architecture

### Database Design
```sql
applications (
  id, type, title, form_data, status, 
  submitted_by_id, reviewer_id, review_comments, 
  urgency, submitted_at, reviewed_at, created_at, updated_at
)

notifications (
  id, user_id, type, title, message, 
  application_id, is_read, created_at
)
```

### Component Structure
```
src/components/review-system/
├── modals/
│   ├── ReviewSubmissionModal.tsx
│   └── ReviewModal.tsx
├── ui/
│   ├── StatusBadge.tsx
│   ├── ReviewTimeline.tsx
│   └── NotificationPanel.tsx
├── hooks/
│   ├── useNotifications.ts
│   ├── useReviewSystem.ts
│   └── useReviewers.ts
└── utils/
    ├── reviewHelpers.ts
    └── notificationHelpers.ts
```

### API Endpoints
- `GET /api/notifications` - User notifications
- `POST /api/applications` - Create/update application
- `POST /api/applications/[id]/submit-review` - Submit for review
- `POST /api/applications/[id]/review` - Approve/reject
- `GET /api/users/reviewers` - Get available reviewers

---

## Success Criteria

### Phase 1-4 (Golden Visa MVP)
- ✅ User can submit Golden Visa for review
- ✅ Reviewer receives notification
- ✅ Reviewer can approve/reject with comments
- ✅ User gets notified of review outcome
- ✅ PDF download only available after approval
- ✅ Rejected applications preserve form state

### Full Implementation
- ✅ All 5 tabs support review workflow
- ✅ Real-time notifications working
- ✅ Department-based reviewer selection
- ✅ UH user Uwe has universal access
- ✅ Comprehensive audit trail
- ✅ Performance meets requirements (<2s response times)

---

**Next Step**: Begin Phase 1 - Database Migration
**Estimated Timeline**: 2-3 weeks for complete implementation
**Testing Strategy**: Incremental testing after each phase