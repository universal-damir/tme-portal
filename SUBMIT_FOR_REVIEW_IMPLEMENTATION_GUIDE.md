# Submit for Review Button Implementation Guide

This guide explains how to implement the "Submit for Review" functionality in new tabs, following the established patterns from Golden Visa and Cost Overview implementations.

## 🚨 CRITICAL BUG WARNING

**Before implementing, read the "CRITICAL Issue" section in Common Issues below.** A critical bug was discovered where the application `type` field was missing from UPDATE requests, causing wrong notification titles (e.g., "250805 Client offer setup" instead of proper format). **Always include the `type` field in both CREATE and UPDATE requests.**

## Overview

The Submit for Review system allows users to submit their forms for approval before generating final PDFs. It includes:
- Review submission modal
- Notification system
- Edit form functionality for rejected applications
- Send panel functionality for approved applications

## Prerequisites

Before implementing in a new tab, ensure you have:
- Form validation schema (using Zod)
- PDF generation functionality 
- Form data type definitions
- React Hook Form setup

## Step-by-Step Implementation

### 1. Import Required Components and Hooks

Add these imports to your tab component:

```tsx
// Review System components
import { ReviewSubmissionModal } from '@/components/review-system/modals/ReviewSubmissionModal';

// Custom hooks for review functionality
import { useYourAppTypeApplication } from '@/hooks/useYourAppTypeApplication'; // Create this hook
```

### 2. Create Application Hook

Create a new hook following the pattern (e.g., `useCompanyServicesApplication.ts`):

```tsx
// Company Services Application State Management Hook
// Based on Golden Visa pattern for consistent review system integration

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { YourFormDataType } from '@/types/your-form-type'; // Replace with your type
import { Application, ApplicationStatus, UrgencyLevel } from '@/types/review-system';
import { useReviewSystemConfig } from '@/lib/config/review-system';

interface UseYourAppTypeApplicationProps {
  formData: YourFormDataType;
  clientName: string;
}

interface UseYourAppTypeApplicationReturn {
  // Application state
  application: Application | null;
  applicationStatus: ApplicationStatus;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  saveApplication: () => Promise<boolean>;
  submitForReview: (submission: {
    reviewer_id: number;
    urgency: UrgencyLevel;
    comments?: string;
  }) => Promise<boolean>;
  
  // Status helpers
  canDownloadPDF: boolean;
  needsApproval: boolean;
  statusMessage: string;
}

export const useYourAppTypeApplication = ({
  formData,
  clientName
}: UseYourAppTypeApplicationProps): UseYourAppTypeApplicationReturn => {
  // Copy implementation from useCostOverviewApplication.ts
  // Replace 'cost-overview' with your application type
  // Replace form data types accordingly
  
  // CRITICAL: Always include type field in both CREATE and UPDATE requests
  // This prevents the application type from being lost during auto-save
};

// IMPORTANT: Application Type Preservation Fix
// When implementing the saveApplication function, ensure BOTH create and update
// requests include the application type:

const saveApplication = useCallback(async (): Promise<boolean> => {
  // ... other code ...
  
  if (application) {
    // UPDATE existing application
    const response = await fetch(\`/api/applications/\${application.id}\`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'your-app-type', // 🚨 CRITICAL: Always include type in updates
        title,
        form_data: formData,
      }),
    });
  } else {
    // CREATE new application  
    const response = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'your-app-type', // ✅ Already included in create
        title,
        form_data: formData,
      }),
    });
  }
}, [formData, application]);
```

### 3. Add State Management to Tab Component

Add these state variables to your tab component:

```tsx
const YourTabComponent: React.FC = () => {
  // ... existing form setup

  // Review system state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  
  // Form data watching
  const watchedData = watch(); // Get all form data
  
  // Review system integration
  const reviewApp = useYourAppTypeApplication({
    formData: watchedData,
    clientName: watchedData.clientDetails?.firstName || 'Client'
  });

  // ... rest of component
};
```

### 4. Add Submit for Review Button

Add the button to your button section (usually near PDF generation buttons):

```tsx
{/* Submit for Review Button */}
<button
  type="button"
  onClick={() => setIsReviewModalOpen(true)}
  disabled={reviewApp.isLoading}
  className="px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-3"
  style={{ backgroundColor: '#F59E0B' }} // Orange color for review
>
  {reviewApp.isLoading ? (
    <>
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
      <span>Saving...</span>
    </>
  ) : (
    <>
      <Send className="h-5 w-5" />
      <span>Submit for Review</span>
    </>
  )}
</button>
```

### 5. Add Review Submission Modal

Add the modal component before the closing div of your tab:

```tsx
{/* Review Submission Modal */}
<ReviewSubmissionModal
  isOpen={isReviewModalOpen}
  onClose={() => setIsReviewModalOpen(false)}
  applicationId={reviewApp.application?.id?.toString() || 'new'}
  applicationTitle={(() => {
    // Use the same filename generation as PDF export for consistency
    try {
      const filename = generateYourPDFFilename(watchedData); // Replace with your PDF filename function
      return filename.replace('.pdf', '');
    } catch (error) {
      // Fallback to basic format if generation fails
      const date = new Date(watchedData.clientDetails?.date || new Date());
      const yy = date.getFullYear().toString().slice(-2);
      const mm = (date.getMonth() + 1).toString().padStart(2, '0');
      const dd = date.getDate().toString().padStart(2, '0');
      const formattedDate = `${yy}${mm}${dd}`;
      
      let nameForTitle = '';
      if (watchedData.clientDetails?.companyName) {
        nameForTitle = watchedData.clientDetails.companyName;
      } else if (watchedData.clientDetails?.lastName && watchedData.clientDetails?.firstName) {
        nameForTitle = `${watchedData.clientDetails.lastName} ${watchedData.clientDetails.firstName}`;
      } else if (watchedData.clientDetails?.firstName) {
        nameForTitle = watchedData.clientDetails.firstName;
      } else if (watchedData.clientDetails?.lastName) {
        nameForTitle = watchedData.clientDetails.lastName;
      } else {
        nameForTitle = 'Client';
      }
      
      return `${formattedDate} ${nameForTitle} your-service-type`; // Replace with your service type
    }
  })()}
  onSubmit={reviewApp.submitForReview}
/>
```

### 6. Add Event Listeners for Edit and Send Functionality

Add these event listeners in a useEffect:

```tsx
// Listen for edit application events from review modal or notifications
React.useEffect(() => {
  const handleEditApplication = (event: any) => {
    const { applicationId, formData } = event.detail;
    console.log('🔧 Pre-filling Your App Type form with application data:', applicationId);
    
    // Pre-fill the form with the application data
    Object.keys(formData).forEach((key) => {
      if (key in watchedData) {
        setValue(key as any, formData[key]);
      }
    });
    
    // Special handling for specific fields if needed (like client emails)
    if (formData.clientDetails?.clientEmails) {
      const emailUpdateEvent = new CustomEvent('update-client-emails', {
        detail: { emails: formData.clientDetails.clientEmails }
      });
      window.dispatchEvent(emailUpdateEvent);
    }
    
    // Show a toast notification to inform the user
    toast.success('Form loaded with your previous data. You can now make changes and resubmit.', {
      duration: 4000,
      position: 'top-center'
    });
  };

  const handleSendApprovedApplication = (event: any) => {
    const { applicationId, formData } = event.detail;
    console.log('🔧 Sending approved Your App Type application:', applicationId);
    
    // Generate PDF and show email modal using the saved form data
    handleGeneratePDF(formData); // Replace with your PDF generation function
  };

  window.addEventListener('edit-your-app-type-application', handleEditApplication); // Replace 'your-app-type'
  window.addEventListener('send-approved-application', handleSendApprovedApplication);

  return () => {
    window.removeEventListener('edit-your-app-type-application', handleEditApplication);
    window.removeEventListener('send-approved-application', handleSendApprovedApplication);
  };
}, [setValue]);
```

### 7. Update Review System Service

Add your application type to the title generation in `src/lib/services/review-system.ts`:

```tsx
// Add case in generateApplicationTitle function
function generateApplicationTitle(applicationType: string, formData: any): string {
  console.log('🔧 generateApplicationTitle called with:', { applicationType, formData });
  
  if (applicationType === 'golden-visa') {
    const title = generateGoldenVisaTitle(formData);
    console.log('🔧 Generated Golden Visa title:', title);
    return title;
  } else if (applicationType === 'cost-overview') {
    const title = generateCostOverviewTitle(formData);
    console.log('🔧 Generated Cost Overview title:', title);
    return title;
  } else if (applicationType === 'your-app-type') { // Add your type here
    const title = generateYourAppTypeTitle(formData);
    console.log('🔧 Generated Your App Type title:', title);
    return title;
  }
  
  console.log('🔧 No matching type, using fallback');
  return 'Application';
}

// Add title generation function for your app type
function generateYourAppTypeTitle(formData: any): string {
  // Use the same detailed filename generation as PDF export for consistency
  try {
    const { generateYourPDFFilename } = require('@/lib/pdf-generator/utils/your-filename-utils');
    const filename = generateYourPDFFilename(formData);
    return filename.replace('.pdf', '');
  } catch (error) {
    console.warn('Failed to generate detailed title, using fallback:', error);
    
    // Fallback to basic format - customize for your needs
    const date = new Date(formData.clientDetails?.date || new Date());
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const formattedDate = `${yy}${mm}${dd}`;
    
    const firstName = formData.clientDetails?.firstName || '';
    const lastName = formData.clientDetails?.lastName || '';
    const companyName = formData.clientDetails?.companyName || '';
    
    const nameForTitle = companyName || 
      (firstName && lastName ? `${lastName} ${firstName}` : firstName || lastName || 'CLIENT');
    
    return `${formattedDate} ${nameForTitle} your-service-type`; // Replace with your service type
  }
}
```

### 8. Update TMEPortalHeader Tab Mapping

Add your tab to the tab mapping in `src/components/portal/TMEPortalHeader.tsx`:

```tsx
// In handleEditForm function, update tabMapping
const tabMapping: Record<string, string> = {
  'golden-visa': 'golden-visa',
  'cost-overview': 'cost-overview', 
  'company-services': 'company-services',
  'taxation': 'taxation',
  'corporate-changes': 'corporate-changes',
  'your-app-type': 'your-tab-name' // Add your mapping here
};
```

### 9. Update Tab Navigation Hook

Add your tab to the valid tabs list in `src/hooks/useTabNavigation.tsx`:

```tsx
const validTabs: TabId[] = [
  'profile',
  'cost-overview',
  'golden-visa', 
  'company-services',
  'corporate-changes',
  'taxation',
  'your-tab-name' // Add your tab here
];
```

### 10. Update Type Definitions

Add your tab type to `src/types/portal.ts`:

```tsx
export type TabId = 
  | 'profile'
  | 'cost-overview' 
  | 'golden-visa'
  | 'company-services'  
  | 'corporate-changes'
  | 'taxation'
  | 'your-tab-name'; // Add your tab here
```

## API Endpoint Requirements

Your tab will need these API endpoints (follow existing patterns):

1. **POST `/api/applications`** - Create/update applications
2. **GET `/api/applications/[id]`** - Get application details  
3. **POST `/api/applications/[id]/submit-review`** - Submit for review

## Testing Checklist

After implementation, test these scenarios:

### Basic Functionality
- [ ] Submit for Review button appears and is clickable
- [ ] Review submission modal opens with correct title
- [ ] Can select reviewer and urgency level
- [ ] Can add comments
- [ ] Submission creates notification for reviewer
- [ ] **🚨 CRITICAL:** Reviewer notification shows correct title format (not generic "setup" text)

### Rejected Application Flow
- [ ] Reviewer can reject application with feedback
- [ ] Submitter receives rejection notification
- [ ] Clicking notification opens feedback modal
- [ ] "Go to Form Editor" button navigates to correct tab
- [ ] Form pre-fills with previous data
- [ ] User can edit and resubmit

### Approved Application Flow
- [ ] Reviewer can approve application
- [ ] Submitter receives approval notification  
- [ ] Clicking notification opens feedback modal
- [ ] "Send" button generates PDF and opens email modal
- [ ] Email contains correct PDF attachment

### Edge Cases
- [ ] Handle missing form data gracefully
- [ ] Show appropriate error messages
- [ ] Validate required fields before submission
- [ ] Handle network errors during submission

## Common Issues and Solutions

### 🚨 CRITICAL Issue: Wrong notification titles (e.g., "250805 Client offer setup" instead of proper format)
**Root Cause:** Application type field missing from UPDATE requests, causing type corruption during auto-save.

**Symptoms:**
- Submit for review modal shows correct title
- But reviewer receives generic/wrong title in notifications
- Console logs show `generateCostOverviewTitle()` being called for non-cost-overview applications

**Solution:** 
1. **Always include `type` field in both CREATE and UPDATE requests**
2. **Never omit the type field from PUT requests** - this was the bug that caused Golden Visa to show as "setup" instead of "golden visa property"

```typescript
// ❌ WRONG - Missing type in update
body: JSON.stringify({
  title,
  form_data: formData,
})

// ✅ CORRECT - Always include type
body: JSON.stringify({
  type: 'your-app-type', // CRITICAL: Required for proper notification titles
  title,
  form_data: formData,
})
```

**Prevention:** Use the code example in Step 2 above which includes the type field in both create and update operations.

### Issue: Event listeners not working
**Solution:** Ensure event names match exactly between dispatcher and listener. Use browser dev tools to verify events are being fired.

### Issue: Form not pre-filling correctly
**Solution:** Check that form field names match the stored form data structure. Use `console.log` to debug data structure.

### Issue: PDF filename doesn't match title
**Solution:** Ensure both the ReviewSubmissionModal title and notification title use the same filename generation function.

### Issue: Tab navigation not working
**Solution:** Verify tab name is added to all required configuration files (useTabNavigation, TMEPortalHeader, type definitions).

## File Locations Reference

Key files you'll need to modify:

```
src/
├── components/portal/tabs/YourTab.tsx           # Main tab component
├── hooks/useYourAppTypeApplication.ts           # Application state hook
├── lib/services/review-system.ts               # Title generation
├── components/portal/TMEPortalHeader.tsx       # Tab mapping
├── hooks/useTabNavigation.tsx                  # Valid tabs
├── types/portal.ts                             # Type definitions
└── types/your-form-type.ts                     # Form data types
```

## Support

For questions or issues with implementation, refer to the existing Golden Visa and Cost Overview implementations as reference examples.