# TME Portal Outlook Add-in - IT Admin Guide

## Overview
This guide is for IT administrators to deploy the TME Portal Outlook Add-in to users. Once deployed, users can generate business documents and send emails directly from Outlook with a single click.

## What This Add-in Does
- Adds a "TME Portal" button to Outlook
- Users fill out forms and click "Download and Send"
- PDF automatically generates and downloads
- Email automatically creates with PDF attached and formatted content
- User just reviews and clicks "Send"

## Prerequisites
- Microsoft 365 subscription
- Exchange Online or Exchange Server 2016+
- Admin rights to Microsoft 365 Admin Center

## Deployment Steps

### Step 1: Get Files from Developer
The developer will provide you with:
```
TME-Outlook-Addon-Production/
├── manifest.xml                  ← Upload this to deploy add-in
├── installation-instructions.pdf ← This guide
└── addon-files/                  ← Host these on SharePoint
    ├── taskpane.html
    ├── taskpane.js
    ├── taskpane.css
    └── assets/
        ├── icon-16.png
        ├── icon-32.png
        └── icon-80.png
```

### Step 2: Set Up SharePoint Hosting

#### Option A: Use Existing SharePoint Site
1. Go to `https://tmeservices.sharepoint.com`
2. Navigate to existing site or create new site called "Apps"
3. Create folder called "tme-portal"
4. Upload all files from `addon-files/` folder (drag and drop)
5. Copy the URL: `https://tmeservices.sharepoint.com/sites/[SITENAME]/tme-portal/`

#### Option B: Create New SharePoint Site
1. Go to SharePoint Admin Center: `https://tmeservices-admin.sharepoint.com`
2. Sites → Active sites → Create
3. Choose "Team site" → Name: "TME Apps"
4. Create folder "tme-portal"
5. Upload addon files
6. Note the URL for manifest update

### Step 3: Deploy Add-in to Users

#### Method 1: Microsoft 365 Admin Center (Recommended)
1. Go to `https://admin.microsoft.com`
2. Sign in with admin credentials
3. Navigate to **Settings** → **Integrated apps**
4. Click **"Upload custom apps"**
5. Click **"Upload from device"**
6. Select the `manifest.xml` file
7. Click **"Next"**
8. Choose deployment scope:
   - **"Everyone"** - All users get the add-in
   - **"Specific users/groups"** - Select who gets it
9. Click **"Deploy"**
10. Wait 5-10 minutes for deployment

#### Method 2: Exchange Admin Center (Alternative)
1. Go to `https://admin.exchange.microsoft.com`
2. Navigate to **Organization** → **Add-ins**
3. Click **"Add from file"**
4. Upload `manifest.xml`
5. Choose users to deploy to
6. Click **"Save"**

### Step 4: Verify Deployment

#### Check Deployment Status
1. In Microsoft 365 Admin Center
2. Go to **Settings** → **Integrated apps**
3. Find "TME Portal" in the list
4. Check status shows "Deployed"

#### Test User Experience
1. Ask a test user to open Outlook
2. They should see "TME Portal" button in the ribbon
3. Clicking it opens the side panel with forms
4. Test the "Download and Send" functionality

## User Communication

### Email Template for Users
```
Subject: New TME Portal Integration in Outlook

Dear Team,

We've added TME Portal directly to Outlook for easier document generation and sending.

How to use:
1. In Outlook, click the "TME Portal" button in the ribbon
2. Fill out the form (Cost Overview, Golden Visa, etc.)
3. Click "Download and Send"
4. Review the auto-generated email and click "Send"

The PDF will automatically attach and the email will be properly formatted.

No training required - it's that simple!

IT Team
```

## Management and Monitoring

### View Usage
1. Microsoft 365 Admin Center → **Reports** → **Usage**
2. Look for Office Add-ins usage statistics

### Update Add-in
1. Developer provides new `manifest.xml`
2. Upload through same process
3. Users get updates automatically

### Remove Add-in
1. Microsoft 365 Admin Center → **Settings** → **Integrated apps**
2. Find "TME Portal" → **Remove**
3. Confirm removal

## Troubleshooting

### Add-in Not Appearing
- **Solution**: Wait 24 hours for full deployment
- **Check**: User has Outlook 2016+ or Outlook Web

### Permission Errors
- **Solution**: Verify admin has rights to deploy add-ins
- **Check**: Exchange Online admin permissions

### Loading Issues
- **Solution**: Verify SharePoint URLs are accessible
- **Check**: SharePoint site permissions

### User Can't See Button
- **Solution**: Check if add-in is assigned to that user
- **Check**: User may need to restart Outlook

## Security Information

### Permissions Required
- **ReadWriteMailbox**: Allows creating emails and attachments
- **No system access**: Add-in runs in Outlook's sandbox
- **No data collection**: All processing happens locally

### Safety Features
- Microsoft-approved APIs only
- Runs in secure container
- No external network access required
- Users control all email sending

## Support Contacts

**For Deployment Issues:**
- Contact: IT Admin
- Escalate to: Microsoft 365 Support

**For Functionality Issues:**
- Contact: TME Portal Developer
- Issues with forms, PDF generation, etc.

## Rollback Plan

If issues occur:
1. **Immediate**: Disable add-in in Admin Center
2. **Remove**: Delete from Integrated apps
3. **Cleanup**: Remove SharePoint files if needed
4. **Communicate**: Notify users of temporary removal

Add-in removal is immediate and leaves no traces on user systems.

## Success Criteria

✅ Add-in appears in all users' Outlook  
✅ Users can generate PDFs successfully  
✅ Emails create with proper formatting  
✅ PDFs attach automatically  
✅ No user complaints or issues  
✅ Usage statistics show adoption  

## Timeline

- **Preparation**: 30 minutes (SharePoint setup)
- **Deployment**: 10 minutes (upload and deploy)
- **Propagation**: 5-10 minutes (appears for users)
- **Testing**: 15 minutes (verify functionality)

**Total time investment: 1 hour**