# EmailDraftGenerator Component

A reusable component for creating formatted Outlook email drafts with PDF attachments using Microsoft Graph API.

## Features

- ✅ Microsoft Graph API integration with Azure AD authentication
- ✅ Customizable email templates for different tabs
- ✅ Automatic PDF attachment handling
- ✅ HTML formatting with Arial 10pt font and colored text
- ✅ Fallback to mailto if Graph API unavailable
- ✅ Template variable replacement (firstName, lastName, companyName)
- ✅ TypeScript support with full type definitions

## Quick Usage

### Option 1: Using the Hook (Recommended)

```typescript
import { useEmailDraftGenerator, createEmailDataFromFormData } from '@/components/shared/EmailDraftGenerator';

const MyComponent = () => {
  const { generateEmailDraft } = useEmailDraftGenerator();

  const handleCreateEmailDraft = async (formData: any, pdfBlob: Blob, pdfFilename: string) => {
    const emailProps = createEmailDataFromFormData(formData, pdfBlob, pdfFilename, 'COST_OVERVIEW');
    
    await generateEmailDraft({
      ...emailProps,
      onSuccess: (draftId) => console.log('Success:', draftId),
      onError: (error) => console.error('Error:', error)
    });
  };

  return (
    <button onClick={() => handleCreateEmailDraft(data, blob, filename)}>
      Generate Email Draft
    </button>
  );
};
```

### Option 2: Manual Configuration

```typescript
import { useEmailDraftGenerator } from '@/components/shared/EmailDraftGenerator';

const MyComponent = () => {
  const { generateEmailDraft } = useEmailDraftGenerator();

  const handleCreateCustomEmail = async () => {
    await generateEmailDraft({
      recipients: {
        emails: ['client@example.com'],
        firstName: 'John',
        lastName: 'Doe',
        companyName: 'Acme Corp'
      },
      template: {
        subject: 'Your Custom Proposal',
        greeting: 'Dear {firstName}, here is your custom proposal.',
        bodyContent: [
          'Thank you for your interest in our services.',
          'Please find the attached proposal for review.'
        ],
        fontFamily: 'Arial, sans-serif',
        fontSize: '10pt'
      },
      attachments: [{
        blob: myPdfBlob,
        filename: 'proposal.pdf',
        contentType: 'application/pdf'
      }]
    });
  };

  return <button onClick={handleCreateCustomEmail}>Send Custom Email</button>;
};
```

## Pre-built Templates

The component includes pre-built templates for different tabs:

- `COST_OVERVIEW` - With colored test text
- `GOLDEN_VISA` - Professional golden visa template
- `COMPANY_SERVICES` - Company services proposal template
- `TAXATION` - Taxation services template

## Usage in Different Tabs

### Golden Visa Tab

```typescript
// In GoldenVisaTab.tsx
const handleEmailDraft = async (data: GoldenVisaData, pdfBlob: Blob, filename: string) => {
  const { useEmailDraftGenerator, createEmailDataFromFormData } = await import('@/components/shared/EmailDraftGenerator');
  const { generateEmailDraft } = useEmailDraftGenerator();
  
  const emailProps = createEmailDataFromFormData(data, pdfBlob, filename, 'GOLDEN_VISA');
  await generateEmailDraft(emailProps);
};
```

### Company Services Tab

```typescript
// In CompanyServicesTab.tsx
const handleEmailDraft = async (data: CompanyServicesData, pdfBlob: Blob, filename: string) => {
  const { useEmailDraftGenerator, createEmailDataFromFormData } = await import('@/components/shared/EmailDraftGenerator');
  const { generateEmailDraft } = useEmailDraftGenerator();
  
  const emailProps = createEmailDataFromFormData(data, pdfBlob, filename, 'COMPANY_SERVICES');
  await generateEmailDraft(emailProps);
};
```

### Taxation Tab

```typescript
// In TaxationTab.tsx
const handleEmailDraft = async (data: TaxationData, pdfBlob: Blob, filename: string) => {
  const { useEmailDraftGenerator, createEmailDataFromFormData } = await import('@/components/shared/EmailDraftGenerator');
  const { generateEmailDraft } = useEmailDraftGenerator();
  
  const emailProps = createEmailDataFromFormData(data, pdfBlob, filename, 'TAXATION');
  await generateEmailDraft(emailProps);
};
```

## Custom Templates

You can create custom templates for specific use cases:

```typescript
const customTemplate = {
  subject: 'Custom Subject - {companyName}',
  greeting: 'Dear {firstName} from {companyName},',
  bodyContent: [
    'We have prepared your custom documentation.',
    '<span style="color: blue;">Important note in blue</span>',
    'Please review and let us know if you have questions.'
  ],
  signature: 'Best regards,\nTME Services Team',
  fontFamily: 'Arial, sans-serif',
  fontSize: '11pt'
};

await generateEmailDraft({
  recipients: { emails: ['client@example.com'], firstName: 'John', companyName: 'Acme' },
  template: customTemplate,
  attachments: [{ blob: pdfBlob, filename: 'document.pdf' }]
});
```

## Error Handling

The component includes automatic fallback to mailto if Graph API fails:

```typescript
await generateEmailDraft({
  // ... your config
  fallbackToMailto: true, // Default: true
  onError: (error) => {
    console.error('Email creation failed:', error);
    // Handle error (show notification, etc.)
  }
});
```

## TypeScript Interfaces

```typescript
interface EmailRecipientData {
  emails: string[];
  firstName?: string;
  lastName?: string;
  companyName?: string;
}

interface EmailTemplate {
  subject: string;
  greeting: string;
  bodyContent: string[];
  signature?: string;
  includeColoredText?: boolean;
  fontFamily?: string;
  fontSize?: string;
}

interface EmailAttachment {
  blob: Blob;
  filename: string;
  contentType?: string;
}
```

## Requirements

1. **Azure App Registration** - Requires client ID, secret, and tenant ID
2. **Environment Variables** - Set in `.env.local`:
   ```
   NEXT_PUBLIC_AZURE_CLIENT_ID=your_client_id
   AZURE_CLIENT_SECRET=your_client_secret
   AZURE_TENANT_ID=your_tenant_id
   ```
3. **Microsoft Graph Permissions**:
   - `User.Read`
   - `Mail.ReadWrite` 
   - `Mail.Send`

## Security

- Uses delegated permissions (user context only)
- Tokens expire after 1 hour
- Only accesses authenticated user's mailbox
- Suitable for local network deployment
- Includes audit logging through Azure AD