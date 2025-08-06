# Notification-to-Todo Integration Plan
## TME Portal v5.2 - Smart Todo System Implementation

---

## 🎯 Project Overview

**Objective**: Convert user notifications into actionable todo items, integrating with the existing profile tab to display both recent activities and pending todos in a split-view layout.

**Current State**: Notification system exists with review workflow notifications only.  
**Target State**: Smart todo generation from notifications with automated client follow-up reminders.

---

## 📋 Implementation Phases

### **Phase 1: Database Foundation** 
*Duration: 2-3 days*

#### **1.1 Database Schema Updates**

**Extend Notifications Table:**
```sql
-- Add todo tracking columns to existing notifications table
ALTER TABLE notifications ADD COLUMN todo_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN todo_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN todo_dismissed BOOLEAN DEFAULT FALSE;
```

**Create User Todos Table:**
```sql
-- Main todos table
CREATE TABLE user_todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,
    
    -- Todo content
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('review', 'follow_up', 'reminder', 'action')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Status and timing
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'dismissed', 'expired')),
    due_date TIMESTAMP,
    auto_generated BOOLEAN DEFAULT TRUE,
    
    -- Action metadata
    action_type VARCHAR(50), -- 'contact_client', 'review_document', 'send_document', 'follow_up_call'
    action_data JSONB, -- Client info, document details, form data
    
    -- Related entities
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    client_name VARCHAR(255),
    document_type VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    dismissed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_user_todos_user_id ON user_todos(user_id);
CREATE INDEX idx_user_todos_status ON user_todos(status);
CREATE INDEX idx_user_todos_due_date ON user_todos(due_date);
CREATE INDEX idx_user_todos_category ON user_todos(category);
CREATE INDEX idx_user_todos_notification_id ON user_todos(notification_id);
CREATE INDEX idx_user_todos_created_at ON user_todos(created_at);

-- Updated at trigger
CREATE TRIGGER update_user_todos_updated_at 
    BEFORE UPDATE ON user_todos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### **1.2 Migration Script**
```bash
# Create migration file
database/migrations/003_user_todos_system.sql
```

### **Phase 2: Backend Services**
*Duration: 3-4 days*

#### **2.1 Todo Service Layer**

**Create Todo Service:** `src/lib/services/todo-service.ts`
```typescript
// Core CRUD operations for todos
// Smart todo generation from notifications
// Auto-completion logic based on related actions
// Due date calculation based on business rules
```

**Key Functions:**
- `generateTodoFromNotification(notification)` - Convert notification to todo
- `getTodosByUser(userId)` - Fetch user todos with filtering/sorting
- `updateTodoStatus(todoId, status)` - Mark todos as complete/dismissed
- `autoCompleteTodos(criteria)` - Smart auto-completion
- `createFollowUpReminders()` - 7-day client follow-up system

#### **2.2 Todo Generation Rules**

**Create Rules Engine:** `src/lib/config/todo-generation-rules.ts`
```typescript
export const TODO_GENERATION_RULES = {
  // Review workflow todos
  'review_requested': {
    title: (data) => `Review ${data.application_title || 'application'}`,
    description: (data) => `Review submitted by ${data.submitter_name} requires your attention`,
    category: 'review',
    priority: (data) => data.urgency === 'high' ? 'urgent' : 'high',
    due_date: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    action_type: 'review_document',
    action_data: (data) => ({ application_id: data.application_id })
  },
  
  'review_completed': {
    title: (data) => `Follow up on ${data.application_title} review result`,
    description: (data) => `Send review result to client and follow up`,
    category: 'follow_up',
    priority: 'medium',
    due_date: () => new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
    action_type: 'send_document',
    action_data: (data) => ({ 
      client_name: data.client_name,
      application_id: data.application_id,
      review_status: data.status
    })
  },
  
  // Client follow-up system
  'document_sent_to_client': {
    title: (data) => `Follow up with ${data.client_name} on ${data.document_type}`,
    description: (data) => `Check if client has questions or needs assistance`,
    category: 'follow_up',
    priority: 'medium',
    due_date: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    action_type: 'contact_client',
    action_data: (data) => ({ 
      client_name: data.client_name,
      document_type: data.document_type,
      sent_date: data.sent_date
    })
  },
  
  // Reminder system
  'client_no_response': {
    title: (data) => `URGENT: Contact ${data.client_name} - No response received`,
    description: (data) => `Client hasn't responded to ${data.document_type} sent ${data.days_ago} days ago`,
    category: 'reminder',
    priority: 'urgent',
    due_date: () => new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
    action_type: 'follow_up_call',
    action_data: (data) => ({ 
      client_name: data.client_name,
      days_overdue: data.days_ago
    })
  }
};
```

#### **2.3 API Endpoints**

**Create Todo APIs:** 
- `GET /api/user/todos` - Fetch user todos with filters
- `PUT /api/user/todos/[id]/status` - Update todo status
- `POST /api/user/todos/dismiss/[id]` - Dismiss todo
- `GET /api/user/todos/stats` - Todo statistics for dashboard

### **Phase 3: Frontend Components**
*Duration: 4-5 days*

#### **3.1 Profile Tab Layout Redesign**

**Update ProfileTab.tsx:**
```tsx
// Split layout: Recent Activities (50%) + Todo List (50%)
<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
  <RecentActivitiesPanel 
    activities={activities} 
    className="xl:max-h-[600px] overflow-y-auto" 
  />
  <TodoListPanel 
    todos={todos} 
    onTodoUpdate={handleTodoUpdate}
    className="xl:max-h-[600px] overflow-y-auto"
  />
</div>
```

#### **3.2 Todo Components**

**Create Todo Components:**

1. **TodoListPanel.tsx** - Main todo container
2. **TodoItem.tsx** - Individual todo item with actions
3. **TodoFilters.tsx** - Filter by category, priority, status
4. **TodoStats.tsx** - Quick stats (pending, completed, overdue)

**Design Standards:**
- TME color palette (#243F7B, #D2BC99)
- Inter font family
- Framer Motion animations
- Consistent with existing profile tab styling

#### **3.3 Todo Item Features**

**TodoItem Component Features:**
- **Priority Indicators**: Color-coded borders and icons
- **Due Date Display**: Relative time with urgency colors
- **Quick Actions**: Mark complete, dismiss, snooze
- **Category Tags**: Visual category identification
- **Action Context**: Show related client/document info

### **Phase 4: Smart Automation**
*Duration: 3-4 days*

#### **4.1 Automatic Todo Generation**

**Integration Points:**
- **Notification Creation**: Auto-generate todos when notifications are created
- **Activity Logging**: Generate follow-up todos from PDF sent activities
- **Review Workflow**: Smart todos for review lifecycle

**Auto-Generation Service:**
```typescript
// Trigger todo generation from existing systems
// PDF sent → follow-up todo (7 days)
// Review requested → review todo (24 hours)  
// Review completed → result follow-up todo (4 hours)
```

#### **4.2 Client Follow-up System**

**7-Day Follow-up Logic:**
1. When PDF is sent to client → create follow-up todo (due in 7 days)
2. Daily cron job checks overdue follow-ups
3. Create urgent reminder todos for no client response
4. Auto-dismiss todos when client responds/new activity occurs

**Cron Job:** `scripts/generate-follow-up-reminders.js`
```javascript
// Daily at 9 AM: Check for overdue client follow-ups
// Create urgent reminder todos
// Send internal notifications for critical delays
```

#### **4.3 Smart Auto-Completion**

**Auto-Complete Rules:**
- Review todo completes when review is submitted
- Follow-up todo completes when client responds
- Document send todo completes when PDF is sent
- Related todos get dismissed when new ones are generated

### **Phase 5: Enhanced Features**
*Duration: 2-3 days*

#### **5.1 Notification Enhancements**

**New Notification Types:**
```typescript
'document_sent_to_client' // When PDF is emailed
'client_follow_up_reminder' // 7-day reminders  
'payment_pending' // Payment follow-ups
'meeting_scheduled' // Meeting reminders
'document_expired' // Offer expiration alerts
```

#### **5.2 Advanced Todo Features**

**Additional Features:**
- **Snooze Functionality**: Postpone todos with custom dates
- **Bulk Actions**: Mark multiple todos complete/dismiss
- **Todo Templates**: Common todo patterns for manual creation
- **Client Communication Log**: Track follow-up attempts

---

## 🗂️ File Structure

```
src/
├── lib/
│   ├── services/
│   │   ├── todo-service.ts           # Core todo CRUD operations
│   │   └── notification-service.ts   # Enhanced with todo generation
│   ├── config/
│   │   └── todo-generation-rules.ts  # Business rules for todo creation
│   └── types/
│       └── todo.ts                   # TypeScript interfaces
├── components/
│   ├── portal/tabs/
│   │   └── ProfileTab.tsx           # Redesigned with split layout
│   └── todos/
│       ├── TodoListPanel.tsx        # Main todo container
│       ├── TodoItem.tsx             # Individual todo component
│       ├── TodoFilters.tsx          # Category/status filters
│       ├── TodoStats.tsx            # Statistics display
│       └── TodoActions.tsx          # Bulk action controls
├── app/api/
│   └── user/todos/
│       ├── route.ts                 # GET/POST todos
│       ├── [id]/
│       │   └── status/route.ts      # Update todo status
│       └── stats/route.ts           # Todo statistics
├── hooks/
│   └── useTodos.ts                  # Todo state management hook
└── contexts/
    └── TodoContext.tsx              # Todo context provider (optional)

database/
└── migrations/
    └── 003_user_todos_system.sql    # Database schema

scripts/
├── generate-follow-up-reminders.js  # Cron job for reminders
└── migrate-existing-notifications.js # One-time migration
```

---

## 🎨 UI/UX Design Specifications

### **Profile Tab Layout**
```
┌─────────────────────────────────────────────────────────────┐
│ Profile Information (Full Width)                           │
│ Employee Code | Email | Department | Designation           │
├─────────────────────────┬───────────────────────────────────┤
│ Recent Activities       │ Todo List                         │
│ (50% width)            │ (50% width)                      │
│                        │                                  │
│ ┌─────────────────────┐ │ ┌─────────────────────────────── │
│ │ Activity Feed       │ │ │ 📋 Todo Stats              │ │
│ │ with animations     │ │ │ 3 pending • 1 overdue      │ │
│ └─────────────────────┘ │ └─────────────────────────────── │
│                        │                                  │
│                        │ ┌─────────────────────────────── │
│                        │ │ 🔴 URGENT: Contact Ahmed    │ │
│                        │ │ 📧 Follow up on Golden Visa │ │
│                        │ │ ✅ Review completed         │ │
│                        │ └─────────────────────────────── │
└─────────────────────────┴───────────────────────────────────┘
```

### **Todo Item Design**
```
┌──────────────────────────────────────────────────────────┐
│ 🔴 URGENT: Contact Ahmed Al-Mahmoud          [Complete] │
│ Follow up on Golden Visa application         [Dismiss]  │
│ Due: 2 hours ago • Follow-up • High Priority            │
│ Client: Ahmed Al-Mahmoud • Golden Visa                  │
└──────────────────────────────────────────────────────────┘
```

### **Color Coding System**
- **Urgent**: Red border/icon (#EF4444)
- **High**: Orange border/icon (#F59E0B)  
- **Medium**: Blue border/icon (#243F7B)
- **Low**: Gray border/icon (#6B7280)
- **Completed**: Green checkmark (#10B981)
- **Overdue**: Pulsing red animation

---

## 📊 Success Metrics

### **Phase 1 Success Criteria**
- [ ] Database tables created and indexed
- [ ] Migration runs without errors
- [ ] Basic CRUD operations working

### **Phase 2 Success Criteria**
- [ ] Todo generation from existing notifications
- [ ] API endpoints respond correctly
- [ ] Business rules properly applied

### **Phase 3 Success Criteria**
- [ ] Profile tab shows split layout
- [ ] Todo items display correctly
- [ ] Actions (complete/dismiss) work
- [ ] TME design system compliance

### **Phase 4 Success Criteria**
- [ ] Auto-generation from PDF activities
- [ ] 7-day follow-up system active
- [ ] Smart auto-completion working

### **Phase 5 Success Criteria**
- [ ] New notification types implemented
- [ ] Advanced features functional
- [ ] System handles edge cases

---

## ⚠️ Risk Mitigation

### **Technical Risks**
- **Database Performance**: Index optimization, query analysis
- **Context Conflicts**: Careful integration with existing notification system
- **Memory Usage**: Efficient todo fetching with pagination

### **User Experience Risks**
- **Information Overload**: Smart filtering and prioritization
- **Notification Fatigue**: Intelligent todo generation rules
- **Layout Issues**: Responsive design testing

### **Business Risks**
- **Missed Follow-ups**: Robust reminder system with fallbacks
- **False Positives**: Careful rule calibration and user feedback
- **Adoption**: Clear benefits communication and training

---

## 🚀 Deployment Strategy

### **Development Approach**
1. **Feature Flags**: Enable/disable todo system per user
2. **Gradual Rollout**: Start with admin users, expand gradually
3. **A/B Testing**: Compare with/without todo system effectiveness
4. **Monitoring**: Track todo completion rates and user engagement

### **Rollback Plan**
- **Database**: Migrations designed to be reversible
- **API**: Backward compatible with existing notification system
- **UI**: Fallback to original profile tab layout
- **Feature Toggle**: Instant disable capability

---

## 📈 Future Enhancements

### **Phase 6: Advanced Features** *(Future)*
- **AI-Powered Prioritization**: Machine learning for todo importance
- **Integration with Calendar**: Schedule follow-up calls
- **Client Portal Integration**: Two-way communication tracking
- **Mobile Push Notifications**: Critical todo alerts
- **Analytics Dashboard**: Todo completion insights

### **Phase 7: Workflow Automation** *(Future)*
- **Custom Workflows**: User-defined todo generation rules
- **Third-party Integrations**: CRM, email marketing tools
- **Advanced Reporting**: Client response analytics
- **Team Collaboration**: Shared todos and assignments

---

## 👥 Team Responsibilities

### **Backend Developer**
- Database schema and migrations
- API endpoints and services
- Business logic implementation
- Cron job setup

### **Frontend Developer**  
- Profile tab redesign
- Todo components creation
- TME design system compliance
- User interaction handling

### **QA Engineer**
- Test scenarios development
- Edge case validation
- Performance testing
- User acceptance testing

### **DevOps**
- Cron job deployment
- Database migration monitoring
- Performance monitoring setup
- Rollback procedures

---

## 📅 Timeline Summary

**Total Duration**: 14-19 days (3-4 weeks)

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1 | 2-3 days | Database schema, migrations |
| Phase 2 | 3-4 days | Backend services, API endpoints |
| Phase 3 | 4-5 days | Frontend components, UI redesign |
| Phase 4 | 3-4 days | Smart automation, follow-up system |
| Phase 5 | 2-3 days | Enhanced features, polish |

**Milestone Checkpoints**: End of each phase with demo and stakeholder review.

---

*This plan provides a comprehensive roadmap for implementing the notification-to-todo integration system while maintaining TME Portal's high standards for user experience and technical excellence.*