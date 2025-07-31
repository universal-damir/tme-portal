# TME Portal Outlook Add-in - Developer Guide

## Overview
This guide is for developers to build and integrate the TME Portal Outlook Add-in with existing codebase.

## Your Responsibilities as Developer

### 1. Create Add-in Files
- Build the Outlook Add-in interface
- Integrate existing PDF generation logic
- Create email templates with proper formatting
- Test functionality locally

### 2. Provide IT Admin with Production Files
- Production-ready manifest.xml
- Built add-in files for SharePoint hosting
- Clear deployment instructions

### 3. Support and Maintenance
- Fix bugs and add features
- Update add-in when needed
- Provide technical support to IT Admin

## Development Setup

### Add Files to Your Existing Project

Add this structure to your current TME Portal project:

```
src/
├── components/           # Your existing components
├── lib/                 # Your existing libraries  
├── outlook-addon/       # NEW: Add-in files
│   ├── manifest-dev.xml       # Development manifest
│   ├── manifest-prod.xml      # Production manifest (template)
│   ├── taskpane.html          # Add-in UI
│   ├── taskpane.js           # Business logic
│   ├── taskpane.css          # Styling
│   └── assets/               # Icons
│       ├── icon-16.png
│       ├── icon-32.png
│       └── icon-80.png
└── ...
```

### Development Server Configuration

Your existing server `http://192.168.97.149:3000/` will serve add-in files:

```
http://192.168.97.149:3000/outlook-addon/taskpane.html
http://192.168.97.149:3000/outlook-addon/taskpane.js
http://192.168.97.149:3000/outlook-addon/taskpane.css
```

### Local Testing Setup

#### 1. Enable Outlook Developer Mode

**Outlook Desktop:**
1. File → Options → Trust Center → Trust Center Settings
2. Add-ins → Check "Enable Outlook add-in logging"
3. Check "Allow web add-ins to load"
4. Restart Outlook

**Outlook Web:**
- No setup needed

#### 2. Sideload Add-in for Testing

**Outlook Desktop:**
1. Home → Get Add-ins → My add-ins
2. "Add a custom add-in" → "Add from file"
3. Select `manifest-dev.xml`

**Outlook Web:**
1. Settings → View all Outlook settings
2. Mail → Customize actions → Add-ins  
3. "Add from file" → Upload `manifest-dev.xml`

## Integration with Existing Code

### Reuse Your PDF Generation

Replace placeholder PDF generation with your existing logic:

```javascript
// In taskpane.js - replace the generatePDF function
async function generatePDF(formData, documentType) {
    // Import your existing PDF generators
    switch (documentType) {
        case 'cost-overview':
            // Use your existing generatePDFWithFilename from @/lib/pdf-generator
            const { generatePDFWithFilename } = await import('/lib/pdf-generator');
            return await generatePDFWithFilename(formData);
            
        case 'golden-visa':
            const { generateGoldenVisaPDFWithFilename } = await import('/lib/pdf-generator');
            return await generateGoldenVisaPDFWithFilename(formData);
            
        case 'company-services':
            const { generateCompanyServicesPDFWithFilename } = await import('/lib/pdf-generator');
            return await generateCompanyServicesPDFWithFilename(formData);
            
        case 'taxation':
            const { generateTaxationPDFWithFilename } = await import('/lib/pdf-generator');
            return await generateTaxationPDFWithFilename(formData);
    }
}
```

### Reuse Your Email Templates

Update email templates to match your existing `EMAIL_TEMPLATES` from `EmailDraftGenerator.tsx`:

```javascript
// In taskpane.js - update the templates object
const templates = {
    'cost-overview': {
        subject: '', // Will be set from PDF filename
        greeting: 'Dear {firstName}, this is an offer as we discussed.',
        body: [
            '<span style="color: green;">Text example green</span>',
            '<span style="color: red;">Text example red</span>',
            '<span style="color: #DAA520;">Text example yellow</span> THIS WILL BE CHANGED LATER.'
        ],
        fontFamily: 'Arial, sans-serif',
        fontSize: '10pt'
    },
    'golden-visa': {
        subject: '',
        greeting: 'Dear {firstName}, please find your Golden Visa application details.',
        body: [
            'We have prepared your Golden Visa documentation as discussed.',
            'Please review the attached documents and let us know if you need any clarification.'
        ],
        fontFamily: 'Arial, sans-serif',
        fontSize: '10pt'
    },
    // Add other templates...
};
```

### Reuse Your Form Components

Convert your existing React components to vanilla HTML/JS for the add-in:

```javascript
// Example: Convert your ClientDetailsSection to HTML
function renderClientDetailsForm(documentType) {
    return `
        <div class="form-group">
            <label class="form-label">Client First Name</label>
            <input type="text" class="form-input" id="${documentType}-firstName" placeholder="Enter first name">
        </div>
        <div class="form-group">
            <label class="form-label">Client Last Name</label>
            <input type="text" class="form-input" id="${documentType}-lastName" placeholder="Enter last name">
        </div>
        <!-- Add other fields from your existing forms -->
    `;
}
```

## Development Workflow

### 1. Development Phase
```bash
# Your normal workflow:
1. Code changes on 192.168.97.149:3000
2. Test in browser as usual
3. Test in Outlook add-in (sideloaded)
4. Git commit when ready
```

### 2. Outlook Add-in Testing
```bash
# Additional testing steps:
1. Open Outlook (desktop or web)
2. TME Portal add-in should be loaded
3. Test each form type
4. Verify PDF generation and email creation
5. Fix any issues and refresh add-in
```

### 3. Production Build
```bash
# When ready for deployment:
1. Build optimized files for SharePoint
2. Update manifest-prod.xml with SharePoint URLs
3. Package files for IT Admin
4. Provide deployment instructions
```

## Files You Need to Create

### 1. manifest-dev.xml
```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<OfficeApp xmlns="http://schemas.microsoft.com/office/appforoffice/1.1" 
           xsi:type="MailApp">
  <Id>12345678-1234-1234-1234-123456789abc</Id>
  <Version>1.0.0.0</Version>
  <ProviderName>TME Services</ProviderName>
  <DefaultLocale>en-US</DefaultLocale>
  <DisplayName DefaultValue="TME Portal"/>
  <Description DefaultValue="Generate TME business documents and send emails"/>
  
  <!-- Development URLs -->
  <IconUrl DefaultValue="http://192.168.97.149:3000/outlook-addon/assets/icon-32.png"/>
  <SourceLocation DefaultValue="http://192.168.97.149:3000/outlook-addon/taskpane.html"/>
  
  <Permissions>ReadWriteMailbox</Permissions>
  <!-- Rest of manifest... -->
</OfficeApp>
```

### 2. taskpane.html
- Full HTML interface with all TME Portal forms
- Clean, professional styling matching TME design
- Responsive layout for different screen sizes

### 3. taskpane.js  
- Form handling and validation
- PDF generation integration
- Outlook API calls for email creation
- Error handling and user feedback

### 4. taskpane.css
- TME branding and colors (#243F7B, #D2BC99)
- Professional form styling
- Responsive design rules

### 5. Icon Assets
- icon-16.png (16x16px)
- icon-32.png (32x32px)  
- icon-80.png (80x80px)
- TME-branded icons for Outlook ribbon

## Production Deployment Process

### Step 1: Build Production Files
Create build script to prepare SharePoint-ready files:

```javascript
// build-outlook-addon.js
const fs = require('fs');
const path = require('path');

// Minify and optimize files
// Replace development URLs with SharePoint URLs
// Create production manifest
```

### Step 2: Package for IT Admin
Create deployment package:

```
TME-Outlook-Addon-Production/
├── manifest.xml              # Production manifest
├── DEPLOYMENT-GUIDE.pdf      # Instructions for IT
└── addon-files/              # SharePoint files
    ├── taskpane.html
    ├── taskpane.js
    ├── taskpane.css
    └── assets/
```

### Step 3: Update Production URLs
Replace all development URLs in manifest with SharePoint URLs:

```xml
<!-- Replace this: -->
<SourceLocation DefaultValue="http://192.168.97.149:3000/outlook-addon/taskpane.html"/>

<!-- With this: -->
<SourceLocation DefaultValue="https://tmeservices.sharepoint.com/sites/apps/tme-portal/taskpane.html"/>
```

## Technical Requirements

### Outlook API Usage
```javascript
// Create email with attachment
Office.context.mailbox.displayNewMessageForm({
    toRecipients: [{ displayName: clientName, emailAddress: email }],
    subject: emailSubject,
    htmlBody: formattedEmailBody,
    attachments: [{
        type: 'file',
        name: filename,
        content: base64PdfData
    }]
});
```

### Security Requirements
- All resources must use HTTPS in production
- Content Security Policy compliance
- No external dependencies (bundle everything)
- Outlook API permissions only

### Browser Compatibility
- Works in Outlook Desktop (Windows/Mac)
- Works in Outlook Web (all browsers)
- Works in Outlook Mobile (iOS/Android)

## Testing Checklist

### Development Testing
- [ ] Add-in loads in Outlook
- [ ] All forms display correctly
- [ ] Form validation works
- [ ] PDF generation works
- [ ] Email creation works with attachments
- [ ] Email formatting is correct (Arial 10pt)
- [ ] No console errors

### Integration Testing
- [ ] Uses existing PDF generation logic
- [ ] Matches existing email templates
- [ ] Maintains TME branding
- [ ] Works with all document types
- [ ] Handles errors gracefully

### User Experience Testing
- [ ] Single click downloads and creates email
- [ ] Email is pre-filled and ready to send
- [ ] PDF attaches automatically
- [ ] No manual formatting needed
- [ ] Intuitive interface

## Troubleshooting During Development

### Common Issues
1. **Add-in won't load**: Check HTTPS/CORS issues
2. **PDF won't generate**: Verify existing PDF logic integration  
3. **Email won't create**: Check Outlook API permissions
4. **Styling issues**: CSS conflicts with Outlook

### Debug Tools
- F12 Developer Tools work in add-in
- Console.log for debugging
- Outlook add-in logging (when enabled)

## Handoff to IT Admin

When development is complete, provide:

1. **Production files package**
2. **Updated OUTLOOK-ADDON-IT-ADMIN-GUIDE.md**
3. **SharePoint URL template** for manifest updates
4. **Testing instructions**
5. **Support contact information**

The IT Admin should be able to deploy without any technical knowledge beyond following the guide.