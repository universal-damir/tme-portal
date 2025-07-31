# SMTP Email Implementation Guide

## Overview
This guide shows how to implement the new SMTP email system in other tabs (Cost Overview, Company Services, Taxation) following the Golden Visa implementation.

## Prerequisites
- ✅ Brevo SMTP credentials configured in `.env.local`
- ✅ Golden Visa tab working as reference implementation
- ✅ New email components available (`EmailPreviewModal`, `useEmailSender`)

## Implementation Steps

### 1. Import Required Components

Add these imports to your tab component:

```typescript
import { EmailDraftGenerator, EmailDraftGeneratorProps } from '@/components/shared/EmailDraftGenerator';
```

### 2. Add State Management

Add email state to your tab component:

```typescript
const [emailDraftProps, setEmailDraftProps] = useState<EmailDraftGeneratorProps | null>(null);
```

### 3. Update PDF Generation Function

Replace the old email creation logic with the new SMTP preview system:

```typescript
// OLD: Remove this
// await createOutlookEmailDraft(data, blob, filename);

// NEW: Add this
// Show email preview modal after successful PDF generation
const { createEmailDataFromFormData } = await import('@/components/shared/EmailDraftGenerator');
const emailProps = createEmailDataFromFormData(data, blob, filename, 'YOUR_TEMPLATE_TYPE');

// Set email props to trigger the EmailDraftGenerator component
setEmailDraftProps({
  ...emailProps,
  onSuccess: () => {
    // Clean up when email is sent successfully
    setEmailDraftProps(null);
  },
  onError: (error: string) => {
    console.error('Email sending failed:', error);
    toast.error('Failed to send email: ' + error);
    setEmailDraftProps(null);
  },
  onClose: () => {
    // Clean up when modal is closed/canceled
    setEmailDraftProps(null);
  }
});
```

### 4. Add EmailDraftGenerator Component

Add this to your JSX return statement (before closing `</div>`):

```typescript
{/* Email Draft Generator with Preview Modal */}
{emailDraftProps && (
  <EmailDraftGenerator {...emailDraftProps} />
)}
```

### 5. Update Email Template (Optional)

If you want custom email content, update the template in `EmailDraftGenerator.tsx`:

```typescript
COST_OVERVIEW: {
  subject: '', // Will be set from PDF filename
  greeting: 'Dear {firstName}, this is an offer as we discussed.',
  previewText: 'Your UAE business setup offer is ready - detailed pricing and services included',
  bodyContent: [
    // Add your custom email content here
  ],
  includeColoredText: true,
  fontFamily: 'Arial, sans-serif',
  fontSize: '10pt'
},
```

## Complete Example: Cost Overview Tab

```typescript
// 1. Add import
import { EmailDraftGenerator, EmailDraftGeneratorProps } from '@/components/shared/EmailDraftGenerator';

const CostOverviewTab: React.FC = () => {
  // 2. Add state
  const [emailDraftProps, setEmailDraftProps] = useState<EmailDraftGeneratorProps | null>(null);
  
  // 3. Update PDF generation function
  const handleGeneratePDF = async (data: CostOverviewData) => {
    // ... existing PDF generation code ...
    
    try {
      const { blob, filename } = await generateCostOverviewPDFWithFilename(data, clientInfo);
      
      // Download PDF
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // NEW: Show email preview modal
      const { createEmailDataFromFormData } = await import('@/components/shared/EmailDraftGenerator');
      const emailProps = createEmailDataFromFormData(data, blob, filename, 'COST_OVERVIEW');
      
      setEmailDraftProps({
        ...emailProps,
        onSuccess: () => setEmailDraftProps(null),
        onError: (error: string) => {
          console.error('Email sending failed:', error);
          toast.error('Failed to send email: ' + error);
          setEmailDraftProps(null);
        },
        onClose: () => setEmailDraftProps(null)
      });

    } catch (error) {
      // ... error handling ...
    }
  };

  return (
    <div className="space-y-8">
      {/* ... existing form components ... */}
      
      {/* 4. Add EmailDraftGenerator component */}
      {emailDraftProps && (
        <EmailDraftGenerator {...emailDraftProps} />
      )}
    </div>
  );
};
```

## Template Types Available

Use these template types in `createEmailDataFromFormData()`:

- `'COST_OVERVIEW'` - UAE business setup offers
- `'GOLDEN_VISA'` - Golden Visa applications  
- `'COMPANY_SERVICES'` - Company services proposals
- `'TAXATION'` - Taxation services proposals

## What You Get

After implementation, your tab will have:

✅ **Professional email preview modal**
✅ **Editable email content with color formatting**
✅ **Automatic PDF attachment**
✅ **Multi-user FROM/REPLY-TO headers**
✅ **Clean UX without loading modals**
✅ **Consistent error handling**

## Testing Checklist

- [ ] PDF downloads when clicking "Download and Send"
- [ ] Email preview modal opens after PDF download
- [ ] User can edit subject, recipients, and email body
- [ ] Color formatting preserved in edit mode (emojis show)
- [ ] Email sends successfully via SMTP
- [ ] Modal closes after sending
- [ ] Modal can reopen after canceling
- [ ] Email appears from `TME Services Portal <contact@tme-services.com>`
- [ ] Replies go to the logged-in user's email

## Troubleshooting

**Modal doesn't open:** Check that `emailDraftProps` state is being set and `EmailDraftGenerator` component is rendered.

**Email not sending:** Verify Brevo SMTP credentials in `.env.local` and check console for API errors.

**Colors lost in edit mode:** Ensure you're using the latest `EmailPreviewModal` component with emoji indicators.

**Modal won't reopen:** Make sure `onClose` callback is clearing the `emailDraftProps` state.

---

**Need help?** Reference the Golden Visa tab implementation in `src/components/portal/tabs/GoldenVisaTab.tsx` as a working example.