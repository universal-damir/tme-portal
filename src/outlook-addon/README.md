# TME Portal Outlook Add-in

## Overview
This Outlook Add-in integrates TME Portal directly into Outlook, enabling users to generate business documents and send emails with Arial 10pt formatting and color options (blue, red, green, yellow).

## Features
- **Seamless Integration**: Generate documents and emails with a single click
- **Professional Formatting**: Arial 10pt font with color options and formatting
- **Dynamic Templates**: Uses existing EMAIL_TEMPLATES from your web application
- **PDF Generation**: Integrates with existing PDF generation system
- **Multi-Document Support**: Cost Overview, Golden Visa, Company Services, Taxation

## User Experience
1. User clicks "TME Portal" button in Outlook ribbon
2. Fills out form in side panel
3. Clicks "Download and Send"
4. PDF automatically downloads and email opens with:
   - PDF attached
   - Professional Arial 10pt formatting
   - Pre-filled content and recipient
   - Color formatting options
5. User reviews and clicks "Send"

## Files Structure
```
src/outlook-addon/
├── manifest-dev.xml          # Development manifest
├── commands.js               # Ribbon command handler
├── taskpane.html            # Main UI interface
├── taskpane.js              # Business logic
├── taskpane.css             # TME styling
├── assets/                  # Icons
│   └── icon-placeholder.svg # Icon template
└── README.md               # This file
```

## Development Setup

### 1. Add to Your Development Server
Your existing server at `http://192.168.97.149:3000/` should serve these files:
- `http://192.168.97.149:3000/outlook-addon/taskpane.html`
- `http://192.168.97.149:3000/outlook-addon/taskpane.js`
- `http://192.168.97.149:3000/outlook-addon/taskpane.css`

### 2. Enable Outlook Developer Mode
**Outlook Desktop:**
1. File → Options → Trust Center → Trust Center Settings
2. Add-ins → Check "Enable Outlook add-in logging"
3. Restart Outlook

**Outlook Web:**
- No setup needed

### 3. Sideload Add-in
**Outlook Desktop:**
1. Home → Get Add-ins → My add-ins
2. "Add a custom add-in" → "Add from file"
3. Select `manifest-dev.xml`

**Outlook Web:**
1. Settings → View all Outlook settings
2. Mail → Customize actions → Add-ins
3. "Add from file" → Upload `manifest-dev.xml`

## API Dependencies

### Required API Endpoint
The add-in calls this endpoint you created:
- `GET /api/outlook-addon/email-templates/[documentType]`
- Returns email template with Arial 10pt formatting and color options

### PDF Generation API
The add-in expects this endpoint (integrate with your existing system):
- `POST /api/pdf/generate`
- Body: `{ documentType: string, data: FormData }`
- Returns: PDF blob

## Email Formatting Features

### Font Requirements
- **Primary Font**: Arial, sans-serif
- **Font Size**: 10pt (enforced throughout)
- **Colors Available**: Blue (#0066cc), Red (#cc0000), Green (#006600), Yellow (#DAA520)
- **Styles**: Bold, underline, italic support

### Template Integration
The add-in fetches templates from your existing `EMAIL_TEMPLATES`:
```javascript
// Uses your existing templates from EmailDraftGenerator.tsx
COST_OVERVIEW: {
  subject: '',
  greeting: 'Dear {firstName}, this is an offer as we discussed.',
  bodyContent: [
    '<span style="color: green;">Text example green</span>',
    '<span style="color: red;">Text example red</span>',
    // ... existing content
  ],
  fontFamily: 'Arial, sans-serif',
  fontSize: '10pt'
}
```

## Testing

### Development Testing
1. Sideload add-in in Outlook
2. Click "TME Portal" button
3. Fill out forms and test "Download and Send"
4. Verify PDF downloads and email creates properly
5. Check Arial 10pt formatting in email

### Form Validation
- Client name or company name required
- Valid email address required
- Document-specific fields validated

### Error Handling
- API failures fall back to default templates
- PDF generation failures create test documents
- User-friendly error messages displayed

## Production Deployment

### Step 1: Create Production Manifest
Replace all `http://192.168.97.149:3000` URLs with SharePoint URLs:
```xml
<SourceLocation DefaultValue="https://tmeservices.sharepoint.com/sites/apps/tme-portal/taskpane.html"/>
```

### Step 2: Upload to SharePoint
1. Go to `https://tmeservices.sharepoint.com`
2. Create site/folder: "apps/tme-portal"
3. Upload files: taskpane.html, taskpane.js, taskpane.css, assets/
4. Note SharePoint URLs for manifest

### Step 3: Deploy via Microsoft 365 Admin
1. `admin.microsoft.com` → Settings → Integrated apps
2. Upload production manifest.xml
3. Deploy to users

## Customization

### Adding New Document Types
1. Add new template to your existing `EMAIL_TEMPLATES`
2. Add new tab in `taskpane.html`
3. Add form handling in `taskpane.js`
4. No add-in updates needed - templates are fetched dynamically

### Changing Email Formatting
1. Update your existing `EMAIL_TEMPLATES`
2. Changes apply automatically to add-in
3. Supports HTML formatting with Arial 10pt enforcement

### Icon Customization
Replace `assets/icon-placeholder.svg` with TME logo in these sizes:
- 16x16px for ribbon
- 32x32px for standard display
- 80x80px for high resolution

## Troubleshooting

### Add-in Won't Load
- Check console for HTTPS/CORS errors
- Verify all URLs are accessible
- Check Outlook developer mode is enabled

### PDF Won't Generate
- Verify API endpoint returns blob
- Check network requests in F12 tools
- Ensure PDF generation API is working

### Email Won't Create
- Check Outlook API permissions
- Verify base64 conversion is working
- Test with simpler email first

### Formatting Issues
- Verify Arial 10pt CSS is applied
- Check HTML email content in network tab
- Test color formatting in email preview

## Support

### For Development Issues
- Check browser console (F12)
- Use Outlook add-in debugging tools
- Test API endpoints directly

### For Deployment Issues
- Verify SharePoint permissions
- Check Microsoft 365 admin rights
- Test manifest XML validation

## Future Enhancements

### Planned Features
- Bulk document generation
- Custom email signature integration
- Advanced color and formatting options
- Template preview before sending

### Scalability
- Add-in supports unlimited document types through API
- Email templates managed centrally in your application
- No add-in updates needed for new features