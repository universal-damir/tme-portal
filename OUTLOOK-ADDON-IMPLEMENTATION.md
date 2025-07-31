# TME Portal Outlook Add-in Implementation Guide

## Overview

This guide provides complete implementation of the TME Portal as an Outlook Add-in, enabling seamless "Download and Send" functionality directly within Outlook.

## User Experience Flow

1. **User clicks "TME Portal" button** in Outlook ribbon
2. **Side panel opens** with TME Portal forms (Cost Overview, Golden Visa, etc.)
3. **User fills out form** and clicks "Download and Send"
4. **Automatic actions happen:**
   - PDF generates and downloads
   - New email compose window opens
   - PDF automatically attaches to email
   - Email body fills with formatted content
   - Subject line auto-populated
   - Ready to send - user just clicks "Send"

## Project Structure

```
src/outlook-addon/
├── manifest-dev.xml          # Development manifest (localhost)
├── manifest-prod.xml         # Production manifest (SharePoint)
├── taskpane.html            # Main add-in UI
├── taskpane.js              # Business logic
├── taskpane.css             # Styling
├── components/              # TME Portal components
│   ├── cost-overview.js     # Cost Overview form
│   ├── golden-visa.js       # Golden Visa form
│   ├── company-services.js  # Company Services form
│   └── taxation.js          # Taxation form
├── lib/                     # Shared libraries
│   ├── pdf-generator.js     # PDF generation logic
│   ├── email-templates.js   # Email templates
│   └── outlook-api.js       # Outlook integration
└── assets/
    ├── icon-16.png          # Add-in icon (16x16)
    ├── icon-32.png          # Add-in icon (32x32)
    └── icon-80.png          # Add-in icon (80x80)
```

## Development Setup

### Step 1: Add Files to Your Project

Add the `outlook-addon` folder to your existing TME Portal project:

```bash
# Your current structure:
src/
├── components/              # Your existing components
├── lib/                     # Your existing libraries
└── outlook-addon/           # NEW: Add-in files (I'll provide)
    ├── manifest-dev.xml
    ├── taskpane.html
    └── ...
```

### Step 2: Development Server

Your existing development server `http://192.168.97.149:3000/` will serve the add-in files:

```
http://192.168.97.149:3000/outlook-addon/taskpane.html
http://192.168.97.149:3000/outlook-addon/taskpane.js
http://192.168.97.149:3000/outlook-addon/taskpane.css
```

### Step 3: Enable Outlook Developer Mode

**For Outlook Desktop:**
1. File → Options → Trust Center → Trust Center Settings
2. Add-ins → Check "Enable Outlook add-in logging"
3. Check "Allow web add-ins to load"
4. Restart Outlook

**For Outlook Web:**
- No setup needed

### Step 4: Sideload Add-in for Testing

**Outlook Desktop:**
1. Home tab → Get Add-ins → My add-ins
2. "Add a custom add-in" → "Add from file"
3. Select `manifest-dev.xml`

**Outlook Web:**
1. Settings → View all Outlook settings
2. Mail → Customize actions → Add-ins
3. "Add from file" → Upload `manifest-dev.xml`

## File Contents

### manifest-dev.xml (Development)

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<OfficeApp xmlns="http://schemas.microsoft.com/office/appforoffice/1.1"
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           xmlns:bt="http://schemas.microsoft.com/office/officeappbasictypes/1.0"
           xmlns:mailappor="http://schemas.microsoft.com/office/mailappversionoverrides/1.0"
           xsi:type="MailApp">

  <!-- Basic Settings -->
  <Id>12345678-1234-1234-1234-123456789abc</Id>
  <Version>1.0.0.0</Version>
  <ProviderName>TME Services</ProviderName>
  <DefaultLocale>en-US</DefaultLocale>
  <DisplayName DefaultValue="TME Portal"/>
  <Description DefaultValue="Generate TME business documents and send emails directly from Outlook"/>
  <IconUrl DefaultValue="http://192.168.97.149:3000/outlook-addon/assets/icon-32.png"/>
  <HighResolutionIconUrl DefaultValue="http://192.168.97.149:3000/outlook-addon/assets/icon-80.png"/>
  <SupportUrl DefaultValue="https://tmeservices.com/support"/>

  <!-- Hosts and Requirements -->
  <Hosts>
    <Host Name="Mailbox"/>
  </Hosts>
  <Requirements>
    <Sets>
      <Set Name="Mailbox" MinVersion="1.1"/>
    </Sets>
  </Requirements>
  <FormSettings>
    <Form xsi:type="ItemRead">
      <DesktopSettings>
        <SourceLocation DefaultValue="http://192.168.97.149:3000/outlook-addon/taskpane.html"/>
        <RequestedHeight>450</RequestedHeight>
      </DesktopSettings>
    </Form>
  </FormSettings>

  <Permissions>ReadWriteMailbox</Permissions>
  <Rule xsi:type="RuleCollection" Mode="Or">
    <Rule xsi:type="ItemIs" ItemType="Message" FormType="Edit"/>
    <Rule xsi:type="ItemIs" ItemType="Message" FormType="Read"/>
  </Rule>

  <DisableEntityHighlighting>false</DisableEntityHighlighting>

  <!-- Version Overrides -->
  <VersionOverrides xmlns="http://schemas.microsoft.com/office/mailappversionoverrides" xsi:type="VersionOverridesV1_0">
    <Requirements>
      <bt:Sets DefaultMinVersion="1.3">
        <bt:Set Name="Mailbox"/>
      </bt:Sets>
    </Requirements>
    <Hosts>
      <Host xsi:type="MailHost">
        <DesktopFormFactor>
          <!-- Function File -->
          <FunctionFile resid="Commands.Url"/>

          <!-- PrimaryCommandSurface -->
          <ExtensionPoint xsi:type="MessageComposeCommandSurface">
            <OfficeTab id="TabDefault">
              <Group id="msgComposeGroup">
                <Label resid="GroupLabel"/>
                <Control xsi:type="Button" id="msgComposeOpenTaskpane">
                  <Label resid="TaskpaneButton.Label"/>
                  <Supertip>
                    <Title resid="TaskpaneButton.Label"/>
                    <Description resid="TaskpaneButton.Tooltip"/>
                  </Supertip>
                  <Icon>
                    <bt:Image size="16" resid="Icon.16x16"/>
                    <bt:Image size="32" resid="Icon.32x32"/>
                    <bt:Image size="80" resid="Icon.80x80"/>
                  </Icon>
                  <Action xsi:type="ShowTaskpane">
                    <TaskpaneId>ButtonId1</TaskpaneId>
                    <SourceLocation resid="Taskpane.Url"/>
                  </Action>
                </Control>
              </Group>
            </OfficeTab>
          </ExtensionPoint>
        </DesktopFormFactor>
      </Host>
    </Hosts>

    <Resources>
      <bt:Images>
        <bt:Image id="Icon.16x16" DefaultValue="http://192.168.97.149:3000/outlook-addon/assets/icon-16.png"/>
        <bt:Image id="Icon.32x32" DefaultValue="http://192.168.97.149:3000/outlook-addon/assets/icon-32.png"/>
        <bt:Image id="Icon.80x80" DefaultValue="http://192.168.97.149:3000/outlook-addon/assets/icon-80.png"/>
      </bt:Images>
      <bt:Urls>
        <bt:Url id="Commands.Url" DefaultValue="http://192.168.97.149:3000/outlook-addon/taskpane.js"/>
        <bt:Url id="Taskpane.Url" DefaultValue="http://192.168.97.149:3000/outlook-addon/taskpane.html"/>
      </bt:Urls>
      <bt:ShortStrings>
        <bt:String id="GroupLabel" DefaultValue="TME Portal"/>
        <bt:String id="TaskpaneButton.Label" DefaultValue="TME Portal"/>
      </bt:ShortStrings>
      <bt:LongStrings>
        <bt:String id="TaskpaneButton.Tooltip" DefaultValue="Generate TME business documents and send emails"/>
      </bt:LongStrings>
    </Resources>
  </VersionOverrides>
</OfficeApp>
```

### taskpane.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TME Portal</title>
    <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js"></script>
    <link rel="stylesheet" href="taskpane.css">
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
            color: #243F7B;
        }
        .header {
            background: linear-gradient(135deg, #243F7B 0%, #D2BC99 100%);
            color: white;
            padding: 20px;
            margin: -20px -20px 20px -20px;
            text-align: center;
        }
        .tab-buttons {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        .tab-button {
            padding: 10px 15px;
            border: 2px solid #243F7B;
            background: white;
            color: #243F7B;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
            flex: 1;
            min-width: 120px;
        }
        .tab-button.active {
            background: #243F7B;
            color: white;
        }
        .tab-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(36, 63, 123, 0.2);
        }
        .form-container {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .form-group {
            margin-bottom: 16px;
        }
        .form-label {
            display: block;
            font-weight: 600;
            margin-bottom: 6px;
            color: #243F7B;
        }
        .form-input {
            width: 100%;
            padding: 10px 12px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.2s;
            box-sizing: border-box;
        }
        .form-input:focus {
            outline: none;
            border-color: #243F7B;
        }
        .generate-button {
            width: 100%;
            padding: 15px;
            background: #243F7B;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            margin-top: 20px;
        }
        .generate-button:hover {
            background: #1a2d5a;
            transform: translateY(-2px);
        }
        .generate-button:disabled {
            background: #9CA3AF;
            cursor: not-allowed;
            transform: none;
        }
        .loading {
            display: none;
            text-align: center;
            padding: 20px;
            color: #243F7B;
        }
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #243F7B;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .hidden {
            display: none;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>TME Portal</h1>
        <p>Generate business documents and send emails</p>
    </div>

    <div class="tab-buttons">
        <button class="tab-button active" data-tab="cost-overview">Cost Overview</button>
        <button class="tab-button" data-tab="golden-visa">Golden Visa</button>
        <button class="tab-button" data-tab="company-services">Company Services</button>
        <button class="tab-button" data-tab="taxation">Taxation</button>
    </div>

    <!-- Cost Overview Form -->
    <div id="cost-overview" class="form-container">
        <h2>Cost Overview</h2>
        <div class="form-group">
            <label class="form-label">Client First Name</label>
            <input type="text" class="form-input" id="co-firstName" placeholder="Enter first name">
        </div>
        <div class="form-group">
            <label class="form-label">Client Last Name</label>
            <input type="text" class="form-input" id="co-lastName" placeholder="Enter last name">
        </div>
        <div class="form-group">
            <label class="form-label">Company Name</label>
            <input type="text" class="form-input" id="co-companyName" placeholder="Enter company name">
        </div>
        <div class="form-group">
            <label class="form-label">Client Email</label>
            <input type="email" class="form-input" id="co-email" placeholder="Enter client email">
        </div>
        <div class="form-group">
            <label class="form-label">Authority</label>
            <select class="form-input" id="co-authority">
                <option value="">Select Authority</option>
                <option value="adgm">ADGM</option>
                <option value="ifza">IFZA</option>
                <option value="det">DET</option>
                <option value="shams">SHAMS</option>
            </select>
        </div>
        <button class="generate-button" onclick="generateDocument('cost-overview')">
            Download and Send
        </button>
    </div>

    <!-- Golden Visa Form -->
    <div id="golden-visa" class="form-container hidden">
        <h2>Golden Visa</h2>
        <div class="form-group">
            <label class="form-label">Client First Name</label>
            <input type="text" class="form-input" id="gv-firstName" placeholder="Enter first name">
        </div>
        <div class="form-group">
            <label class="form-label">Client Last Name</label>
            <input type="text" class="form-input" id="gv-lastName" placeholder="Enter last name">
        </div>
        <div class="form-group">
            <label class="form-label">Client Email</label>
            <input type="email" class="form-input" id="gv-email" placeholder="Enter client email">
        </div>
        <div class="form-group">
            <label class="form-label">Visa Type</label>
            <select class="form-input" id="gv-visaType">
                <option value="">Select Visa Type</option>
                <option value="investor">Investor Visa</option>
                <option value="entrepreneur">Entrepreneur Visa</option>
                <option value="talent">Talent Visa</option>
            </select>
        </div>
        <button class="generate-button" onclick="generateDocument('golden-visa')">
            Download and Send
        </button>
    </div>

    <!-- Company Services Form -->
    <div id="company-services" class="form-container hidden">
        <h2>Company Services</h2>
        <div class="form-group">
            <label class="form-label">Client First Name</label>
            <input type="text" class="form-input" id="cs-firstName" placeholder="Enter first name">
        </div>
        <div class="form-group">
            <label class="form-label">Client Last Name</label>
            <input type="text" class="form-input" id="cs-lastName" placeholder="Enter last name">
        </div>
        <div class="form-group">
            <label class="form-label">Company Name</label>
            <input type="text" class="form-input" id="cs-companyName" placeholder="Enter company name">
        </div>
        <div class="form-group">
            <label class="form-label">Client Email</label>
            <input type="email" class="form-input" id="cs-email" placeholder="Enter client email">
        </div>
        <div class="form-group">
            <label class="form-label">Service Type</label>
            <select class="form-input" id="cs-serviceType">
                <option value="">Select Service</option>
                <option value="accounting">Accounting Services</option>
                <option value="compliance">Compliance Services</option>
                <option value="backoffice">Back Office Services</option>
            </select>
        </div>
        <button class="generate-button" onclick="generateDocument('company-services')">
            Download and Send
        </button>
    </div>

    <!-- Taxation Form -->
    <div id="taxation" class="form-container hidden">
        <h2>Taxation</h2>
        <div class="form-group">
            <label class="form-label">Client First Name</label>
            <input type="text" class="form-input" id="tax-firstName" placeholder="Enter first name">
        </div>
        <div class="form-group">
            <label class="form-label">Client Last Name</label>
            <input type="text" class="form-input" id="tax-lastName" placeholder="Enter last name">
        </div>
        <div class="form-group">
            <label class="form-label">Company Name</label>
            <input type="text" class="form-input" id="tax-companyName" placeholder="Enter company name">
        </div>
        <div class="form-group">
            <label class="form-label">Client Email</label>
            <input type="email" class="form-input" id="tax-email" placeholder="Enter client email">
        </div>
        <div class="form-group">
            <label class="form-label">Tax Service</label>
            <select class="form-input" id="tax-serviceType">
                <option value="">Select Service</option>
                <option value="cit">Corporate Income Tax</option>
                <option value="vat">VAT Services</option>
                <option value="consultation">Tax Consultation</option>
            </select>
        </div>
        <button class="generate-button" onclick="generateDocument('taxation')">
            Download and Send
        </button>
    </div>

    <!-- Loading State -->
    <div id="loading" class="loading">
        <div class="spinner"></div>
        <p>Generating document and preparing email...</p>
    </div>

    <script src="taskpane.js"></script>
</body>
</html>
```

### taskpane.js

```javascript
// Initialize Office Add-in
Office.onReady((info) => {
    if (info.host === Office.HostType.Outlook) {
        console.log('TME Portal Outlook Add-in loaded');
        initializeAddIn();
    }
});

// Initialize the add-in
function initializeAddIn() {
    // Set up tab switching
    const tabButtons = document.querySelectorAll('.tab-button');
    const formContainers = document.querySelectorAll('.form-container');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            switchTab(tabId);
        });
    });
}

// Switch between tabs
function switchTab(tabId) {
    // Update button states
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

    // Update form visibility
    document.querySelectorAll('.form-container').forEach(container => {
        container.classList.add('hidden');
    });
    document.getElementById(tabId).classList.remove('hidden');
}

// Generate document and send email
async function generateDocument(documentType) {
    try {
        // Show loading state
        showLoading(true);

        // Collect form data
        const formData = collectFormData(documentType);

        // Validate required fields
        if (!validateFormData(formData, documentType)) {
            showLoading(false);
            return;
        }

        // Generate PDF
        const pdfBlob = await generatePDF(formData, documentType);

        // Create email with attachment
        await createEmailWithAttachment(formData, pdfBlob, documentType);

        // Hide loading state
        showLoading(false);

        // Show success message
        showMessage('Email prepared successfully! Please review and send.', 'success');

    } catch (error) {
        console.error('Error generating document:', error);
        showLoading(false);
        showMessage('Error generating document. Please try again.', 'error');
    }
}

// Collect form data based on document type
function collectFormData(documentType) {
    const prefix = getFieldPrefix(documentType);
    
    return {
        firstName: document.getElementById(`${prefix}-firstName`).value,
        lastName: document.getElementById(`${prefix}-lastName`).value,
        companyName: document.getElementById(`${prefix}-companyName`).value,
        email: document.getElementById(`${prefix}-email`).value,
        documentType: documentType,
        // Add specific fields based on document type
        ...getSpecificFields(documentType, prefix)
    };
}

// Get field prefix for each document type
function getFieldPrefix(documentType) {
    const prefixes = {
        'cost-overview': 'co',
        'golden-visa': 'gv',
        'company-services': 'cs',
        'taxation': 'tax'
    };
    return prefixes[documentType];
}

// Get specific fields for each document type
function getSpecificFields(documentType, prefix) {
    switch (documentType) {
        case 'cost-overview':
            return {
                authority: document.getElementById(`${prefix}-authority`).value
            };
        case 'golden-visa':
            return {
                visaType: document.getElementById(`${prefix}-visaType`).value
            };
        case 'company-services':
            return {
                serviceType: document.getElementById(`${prefix}-serviceType`).value
            };
        case 'taxation':
            return {
                serviceType: document.getElementById(`${prefix}-serviceType`).value
            };
        default:
            return {};
    }
}

// Validate form data
function validateFormData(formData, documentType) {
    // Check required fields
    if (!formData.firstName && !formData.lastName && !formData.companyName) {
        showMessage('Please enter client name or company name.', 'error');
        return false;
    }

    if (!formData.email) {
        showMessage('Please enter client email address.', 'error');
        return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        showMessage('Please enter a valid email address.', 'error');
        return false;
    }

    return true;
}

// Generate PDF (simplified version - you'll integrate your actual PDF generation)
async function generatePDF(formData, documentType) {
    // This is a placeholder - you'll integrate your actual PDF generation logic here
    // For now, we'll create a simple text-based "PDF" for testing
    
    const content = generatePDFContent(formData, documentType);
    const blob = new Blob([content], { type: 'application/pdf' });
    
    // Download the file
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = getFileName(formData, documentType);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return blob;
}

// Generate PDF content (placeholder)
function generatePDFContent(formData, documentType) {
    const clientName = formData.companyName || `${formData.firstName} ${formData.lastName}`.trim();
    const date = new Date().toLocaleDateString();
    
    return `TME Portal - ${documentType.toUpperCase()}

Client: ${clientName}
Email: ${formData.email}
Date: ${date}

This is a generated document from TME Portal.
Document Type: ${documentType}

[This is a placeholder. Your actual PDF generation logic will be integrated here.]
`;
}

// Get filename for the document
function getFileName(formData, documentType) {
    const clientName = formData.companyName || `${formData.firstName} ${formData.lastName}`.trim();
    const cleanName = clientName.replace(/[^a-zA-Z0-9]/g, '-');
    const typeMap = {
        'cost-overview': 'Cost-Overview',
        'golden-visa': 'Golden-Visa',
        'company-services': 'Company-Services',
        'taxation': 'Taxation'
    };
    
    return `TME-${typeMap[documentType]}-${cleanName}.pdf`;
}

// Create email with attachment using Outlook API
async function createEmailWithAttachment(formData, pdfBlob, documentType) {
    const clientName = formData.companyName || `${formData.firstName} ${formData.lastName}`.trim();
    const filename = getFileName(formData, documentType);
    
    // Convert blob to base64 for attachment
    const base64Data = await blobToBase64(pdfBlob);
    
    // Email templates
    const templates = {
        'cost-overview': {
            subject: `TME Cost Overview - ${clientName}`,
            greeting: `Dear ${formData.firstName || 'Client'},`,
            body: [
                'This is an offer as we discussed.',
                'Please find attached the detailed cost overview for your business setup requirements.',
                'We look forward to discussing this further with you.'
            ]
        },
        'golden-visa': {
            subject: `TME Golden Visa Application - ${clientName}`,
            greeting: `Dear ${formData.firstName || 'Client'},`,
            body: [
                'Please find your Golden Visa application details.',
                'We have prepared your Golden Visa documentation as discussed.',
                'Please review the attached documents and let us know if you need any clarification.'
            ]
        },
        'company-services': {
            subject: `TME Company Services Proposal - ${clientName}`,
            greeting: `Dear ${formData.firstName || 'Client'},`,
            body: [
                'Your company services proposal is ready.',
                'Please find attached the detailed proposal for your company services requirements.',
                'We look forward to discussing this further with you.'
            ]
        },
        'taxation': {
            subject: `TME Taxation Services Proposal - ${clientName}`,
            greeting: `Dear ${formData.firstName || 'Client'},`,
            body: [
                'Your taxation services proposal is attached.',
                'Please review the taxation services proposal attached to this email.',
                'Our team is available to answer any questions you may have.'
            ]
        }
    };

    const template = templates[documentType];
    const emailBody = `
        <div style="font-family: Arial, sans-serif; font-size: 10pt; color: #000;">
            <p>${template.greeting}</p>
            ${template.body.map(line => `<p>${line}</p>`).join('')}
            <br>
            <p>Best regards,<br>TME Services Team</p>
        </div>
    `;

    // Create new email using Outlook API
    Office.context.mailbox.displayNewMessageForm({
        toRecipients: [{
            displayName: clientName,
            emailAddress: formData.email
        }],
        subject: template.subject,
        htmlBody: emailBody,
        attachments: [{
            type: 'file',
            name: filename,
            content: base64Data
        }]
    });
}

// Convert blob to base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Show/hide loading state
function showLoading(show) {
    const loading = document.getElementById('loading');
    const forms = document.querySelectorAll('.form-container');
    
    if (show) {
        loading.style.display = 'block';
        forms.forEach(form => form.style.opacity = '0.5');
    } else {
        loading.style.display = 'none';
        forms.forEach(form => form.style.opacity = '1');
    }
}

// Show message to user
function showMessage(message, type) {
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        right: 20px;
        padding: 15px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 9999;
        ${type === 'success' ? 
            'background: #d1edff; color: #0066cc; border: 2px solid #0066cc;' : 
            'background: #ffe6e6; color: #cc0000; border: 2px solid #cc0000;'
        }
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);

    // Remove after 5 seconds
    setTimeout(() => {
        document.body.removeChild(messageDiv);
    }, 5000);
}
```

## Production Deployment

### Step 1: Build Production Files

Create a build script to prepare files for SharePoint:

```bash
# In your package.json, add:
"scripts": {
  "build-addon": "node scripts/build-outlook-addon.js"
}
```

### Step 2: Upload to SharePoint

1. **Go to SharePoint**: `https://tmeservices.sharepoint.com`
2. **Create site**: "Apps" (if doesn't exist)
3. **Create folder**: "tme-portal"
4. **Upload files**:
   - `taskpane.html`
   - `taskpane.js` 
   - `taskpane.css`
   - `assets/` folder with icons
5. **Copy URLs**: Note the SharePoint URLs for manifest

### Step 3: Update Production Manifest

Replace all `http://192.168.97.149:3000` URLs with SharePoint URLs:

```xml
<!-- Example SharePoint URLs -->
<SourceLocation DefaultValue="https://tmeservices.sharepoint.com/sites/apps/tme-portal/taskpane.html"/>
<bt:Url id="Taskpane.Url" DefaultValue="https://tmeservices.sharepoint.com/sites/apps/tme-portal/taskpane.html"/>
```

### Step 4: Deploy to Users

**Microsoft 365 Admin Center:**
1. Go to `admin.microsoft.com`
2. Settings → Integrated apps → Upload custom apps
3. Upload `manifest-prod.xml`
4. Deploy to all users or specific groups

## Integration with Your Existing Code

### Reuse Your PDF Generation

Replace the placeholder `generatePDF()` function with your actual PDF generation logic:

```javascript
// Import your existing PDF generators
async function generatePDF(formData, documentType) {
    switch (documentType) {
        case 'cost-overview':
            return await generateCostOverviewPDF(formData);
        case 'golden-visa':
            return await generateGoldenVisaPDF(formData);
        case 'company-services':
            return await generateCompanyServicesPDF(formData);
        case 'taxation':
            return await generateTaxationPDF(formData);
    }
}
```

### Reuse Your Email Templates

Update the email templates in `createEmailWithAttachment()` to match your existing templates from `EmailDraftGenerator.tsx`.

## Development Workflow

1. **Develop locally**: Use `http://192.168.97.149:3000/outlook-addon/`
2. **Test in Outlook**: Sideload `manifest-dev.xml`
3. **Iterate**: Make changes, refresh Outlook
4. **Build for production**: Create SharePoint-ready files
5. **Deploy**: Upload to SharePoint and update manifest

## Troubleshooting

### Common Issues:

1. **Add-in won't load**: Check console for HTTPS/CORS errors
2. **PDF won't attach**: Verify base64 conversion is working
3. **Email won't create**: Check Outlook API permissions
4. **Manifest errors**: Validate XML structure

### Debug Tools:

- **F12 Developer Tools**: Works in add-in taskpane
- **Office Add-in Debugger**: Available in Outlook developer mode
- **Console logging**: Use `console.log()` for debugging

## Security Considerations

- **HTTPS required**: Production must use HTTPS
- **Same-origin policy**: All resources must be from same domain
- **Content Security Policy**: Restrict external resources
- **Permissions**: Only request necessary Outlook permissions

## Next Steps

1. **Add these files** to your project
2. **Test locally** with sideloading
3. **Integrate your PDF generation** logic
4. **Prepare SharePoint** hosting
5. **Deploy to users**

This implementation provides the seamless "click to download and send" experience you requested, integrated directly into Outlook with minimal user effort.