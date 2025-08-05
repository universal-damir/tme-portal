# Golden Visa Review System - Complete Analysis

## Overview
This document provides a comprehensive analysis of how the Golden Visa review system works to ensure proper implementation for Cost Overview.

## 1. Form Submission Flow

### 1.1 Submit for Review Button (GoldenVisaTab.tsx:465-486)
```jsx
<motion.button
  type="button"
  onClick={() => setIsReviewModalOpen(true)}
  disabled={reviewApp.isLoading}
  className="px-8 py-3 rounded-lg font-semibold text-white"
  style={{ backgroundColor: '#F59E0B' }}  // Orange color
>
  <Send className="h-5 w-5" />
  <span>Submit for Review</span>
</motion.button>
```

### 1.2 ReviewSubmissionModal Opens
- Modal asks for:
  - Reviewer selection (dropdown)
  - Urgency level (standard/urgent)
  - Optional comments

### 1.3 Form Data Structure (Golden Visa)
```typescript
interface GoldenVisaData {
  firstName: string;
  lastName: string;
  companyName: string;
  date: string;
  visaType: 'property-investment' | 'time-deposit' | 'skilled-employee';
  // ... other fields
}
```

## 2. Application Creation & Persistence

### 2.1 Hook: useGoldenVisaApplication
- **File**: `src/hooks/useGoldenVisaApplication.ts`
- **Purpose**: Manages application state, auto-save, review submission
- **Key Functions**:
  - `saveApplication()`: Creates/updates application in database
  - `submitForReview()`: Submits to review system

### 2.2 Database Storage
- **Table**: `applications`
- **Key Fields**:
  - `type`: 'golden-visa'
  - `title`: Generated title
  - `form_data`: Complete form data as JSON
  - `status`: 'draft' → 'pending_review' → 'approved/rejected'

### 2.3 Title Generation (Lines 517-545 in GoldenVisaTab.tsx)
```typescript
const applicationTitle = (() => {
  const date = new Date(watchedData.date || new Date());
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  const formattedDate = `${yy}${mm}${dd}`;
  
  let nameForTitle = '';
  if (clientInfo.companyName) {
    nameForTitle = clientInfo.companyName;
  } else if (watchedData.lastName && watchedData.firstName) {
    nameForTitle = `${watchedData.lastName} ${watchedData.firstName}`;
  } else if (watchedData.firstName) {
    nameForTitle = watchedData.firstName;
  } else if (watchedData.lastName) {
    nameForTitle = watchedData.lastName;
  } else {
    nameForTitle = 'Client';
  }
  
  const visaTypeMap = {
    'property-investment': 'property',
    'time-deposit': 'deposit',
    'skilled-employee': 'skilled'
  };
  
  const visaTypeFormatted = visaTypeMap[watchedData.visaType] || watchedData.visaType;
  return `${formattedDate} ${nameForTitle} offer golden visa ${visaTypeFormatted}`;
})()
```

## 3. Backend Processing (review-system.ts)

### 3.1 ApplicationsService.submitForReview() (Lines 224-332)

#### Step 1: Update Application Status
```sql
UPDATE applications 
SET status = 'pending_review', 
    reviewer_id = $1, 
    urgency = $2,
    submitted_at = CURRENT_TIMESTAMP
WHERE id = $3 AND submitted_by_id = $4
```

#### Step 2: **CRITICAL** - Title Generation for Notifications (Lines 270-303)
```typescript
// **THIS IS THE PROBLEM - HARDCODED FOR GOLDEN VISA**
const formData = appResult.rows[0].form_data;

// Generate title using same PDF naming convention as GoldenVisaTab
const date = new Date(formData.date || new Date());
const yy = date.getFullYear().toString().slice(-2);
const mm = (date.getMonth() + 1).toString().padStart(2, '0');
const dd = date.getDate().toString().padStart(2, '0');
const formattedDate = `${yy}${mm}${dd}`;

let nameForTitle = '';
if (formData.companyName) {
  nameForTitle = formData.companyName;
} else if (formData.lastName && formData.firstName) {
  nameForTitle = `${formData.lastName} ${formData.firstName}`;
} else if (formData.firstName) {
  nameForTitle = formData.firstName;
} else if (formData.lastName) {
  nameForTitle = formData.lastName;
} else {
  nameForTitle = 'Client';
}

const visaTypeMap = {
  'property-investment': 'property',
  'time-deposit': 'deposit', 
  'skilled-employee': 'skilled'
};

const visaTypeFormatted = visaTypeMap[formData.visaType] || formData.visaType;
applicationTitle = `${formattedDate} ${nameForTitle} offer golden visa ${visaTypeFormatted}`;
```

#### Step 3: Create Notification for Reviewer
```typescript
await NotificationsService.create({
  user_id: submission.reviewer_id,
  type: 'review_requested',
  title: applicationTitle,  // ← This contains "golden visa"
  message: submission.comments || 'A new application has been submitted for your review.',
  application_id: submission.application_id,
  metadata: {
    submitter_name: submitterInfo?.full_name,
    submitter_employee_code: submitterInfo?.employee_code
  }
});
```

### 3.2 **SECOND PROBLEM** - Review Action Processing (Lines 370-408)
Same hardcoded Golden Visa logic in `performReviewAction()`:
```typescript
// **SAME PROBLEM HERE**
const visaTypeFormatted = visaTypeMap[formData.visaType] || formData.visaType;
applicationTitle = `${formattedDate} ${nameForTitle} offer golden visa ${visaTypeFormatted}`;
```

## 4. Notification Display

### 4.1 NotificationPanel.tsx
- Shows notifications with application titles
- Uses the title generated in backend service
- **Currently shows**: "241205 ABC Company offer golden visa property"
- **Should show for Cost Overview**: "241205 ABC Company offer IFZA"

### 4.2 ReviewModal.tsx  
- Opens when reviewer clicks notification
- Shows application details for review
- Has "Preview PDF" button
- **Currently**: Generates Golden Visa PDF always
- **Should**: Generate appropriate PDF based on application type

## 5. Form Data Differences

### 5.1 Golden Visa Form Data Structure
```typescript
{
  firstName: string;
  lastName: string;
  companyName: string;
  date: string;
  visaType: 'property-investment' | 'time-deposit' | 'skilled-employee';
  // Direct structure
}
```

### 5.2 Cost Overview Form Data Structure  
```typescript
{
  clientDetails: {
    firstName: string;
    lastName: string;
    companyName: string;
    date: string;
  },
  authorityInformation: {
    responsibleAuthority: string;  // e.g., 'IFZA', 'DET', etc.
  }
  // Nested structure
}
```

## 6. Required Changes for Cost Overview

### 6.1 Backend Service Updates (review-system.ts)

#### Problem Areas:
1. **Lines 270-303**: `submitForReview()` title generation
2. **Lines 370-408**: `performReviewAction()` title generation

#### Solution:
Need to detect application type and use appropriate title generation:

```typescript
// Get application type first
const appTypeResult = await pool.query(`
  SELECT type, title, form_data FROM applications WHERE id = $1
`, [submission.application_id]);

const applicationType = appTypeResult.rows[0]?.type;
const formData = appTypeResult.rows[0]?.form_data;

if (applicationType === 'golden-visa') {
  // Existing Golden Visa logic
  applicationTitle = generateGoldenVisaTitle(formData);
} else if (applicationType === 'cost-overview') {
  // New Cost Overview logic
  applicationTitle = generateCostOverviewTitle(formData);
}
```

### 6.2 Title Generation Functions Needed

#### For Golden Visa:
```typescript
function generateGoldenVisaTitle(formData: any): string {
  // Existing logic...
  return `${formattedDate} ${nameForTitle} offer golden visa ${visaTypeFormatted}`;
}
```

#### For Cost Overview:
```typescript
function generateCostOverviewTitle(formData: any): string {
  const date = new Date(formData.clientDetails?.date || new Date());
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  const formattedDate = `${yy}${mm}${dd}`;
  
  let nameForTitle = '';
  if (formData.clientDetails?.companyName) {
    nameForTitle = formData.clientDetails.companyName;
  } else if (formData.clientDetails?.lastName && formData.clientDetails?.firstName) {
    nameForTitle = `${formData.clientDetails.lastName} ${formData.clientDetails.firstName}`;
  } else if (formData.clientDetails?.firstName) {
    nameForTitle = formData.clientDetails.firstName;
  } else if (formData.clientDetails?.lastName) {
    nameForTitle = formData.clientDetails.lastName;
  } else {
    nameForTitle = 'Client';
  }
  
  const authority = formData.authorityInformation?.responsibleAuthority || 'setup';
  return `${formattedDate} ${nameForTitle} offer ${authority}`;
}
```

## 7. Critical Issues Summary

### 7.1 Backend Service Issues
- **File**: `src/lib/services/review-system.ts`
- **Lines**: 270-303, 370-408
- **Problem**: Hardcoded Golden Visa title generation
- **Impact**: All notifications show "golden visa" regardless of application type

### 7.2 Frontend Modal Issues  
- **Files**: ReviewModal.tsx, FeedbackModal.tsx
- **Problem**: PDF generation hardcoded for Golden Visa
- **Impact**: Wrong PDF type generated for Cost Overview applications

### 7.3 Missing Application Type Detection
- Backend service doesn't check application type before processing
- Notification titles always use Golden Visa format
- PDF generation doesn't switch based on application type

## 8. Implementation Priority

### High Priority (Must Fix):
1. Backend notification title generation
2. PDF generation type switching
3. Application type detection

### Medium Priority:
1. Modal header updates
2. Notification display improvements

### Low Priority:
1. Additional application types support
2. System architecture improvements

## Conclusion

The core issue is in the backend service (`review-system.ts`) where notification titles are hardcoded for Golden Visa format. This affects the entire notification flow and user experience. The fix requires:

1. Application type detection
2. Type-specific title generation functions  
3. Proper PDF generation switching
4. Complete testing of the flow

Every notification, modal, and PDF generation must be updated to handle multiple application types correctly.