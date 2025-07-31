# SMTP Email Setup Guide

## Overview
The application now uses Brevo SMTP for sending emails with PDF attachments via a preview modal, replacing the previous Microsoft Graph API integration. 

**Multi-User Email Setup:**
- **FROM**: Your verified Brevo account email (professional company address)
- **REPLY-TO**: Automatically set to logged-in user's email address  
- **Body**: Fully editable in preview modal
- **Authentication**: Uses session-based user identification

## Setup Instructions

### 1. Get Brevo SMTP Credentials
1. Login to your Brevo account at https://app.brevo.com
2. Go to **SMTP & API** → **SMTP**
3. Copy your SMTP credentials:
   - **Login**: Your Brevo account email
   - **Password**: Your SMTP key (not your account password)

### 2. Use Your Verified Brevo Account Email
**IMPORTANT**: Use the email address that's actually verified in your Brevo account:
- This should be your Brevo account login email
- Must be verified and have sending permissions
- Will appear as the FROM address in emails

### 3. Configure Environment Variables
Add to your `.env.local` file:

```bash
# Brevo SMTP Configuration
# Use your ACTUAL Brevo account login email (the verified one)
BREVO_SMTP_USER="your-verified-brevo-account@yourdomain.com"  
BREVO_SMTP_PASSWORD="your-smtp-key-from-brevo-dashboard"
```

### 3. SMTP Settings
The application is configured with these Brevo SMTP settings:
- **Host**: smtp-relay.brevo.com
- **Port**: 587
- **Security**: STARTTLS

## New Email Flow

### User Experience
1. User clicks **"Download and Send"** button
2. PDF downloads automatically ✅
3. **Email Preview Modal** opens showing:
   - Pre-filled recipient(s) (editable)
   - Subject line (fully editable)
   - **Email body (fully editable with preview/edit toggle)** ✅
   - PDF attachment indicator
4. User can edit all content: recipients, subject, and full email body
5. User clicks **"Send Email"**
6. Email sends via Brevo SMTP with:
   - FROM: Your verified Brevo account email ✅
   - REPLY-TO: User's actual email address ✅  
   - PDF attachment ✅

### Technical Implementation
- **API Endpoint**: `/api/email/send` handles SMTP delivery with session-based user identification
- **Preview Modal**: `EmailPreviewModal` component with full editing capabilities
- **Email Hook**: `useEmailSender` manages SMTP operations
- **Authentication**: Automatically gets user email from session for REPLY-TO
- **Integration**: Works with all tabs (Golden Visa, Cost Overview, Company Services, Taxation)

## Features

### ✅ What Works
- **Multi-user email handling** (50+ users supported)
- **Professional FROM address**: `contact@TME-Services.com`
- **Individual REPLY-TO**: Each user's actual email address
- **Fully editable email content** with preview/edit toggle
- PDF attachment handling
- Error handling and loading states
- Session-based user authentication
- Reusable across all form tabs
- Arial 10pt font formatting as requested

### 🚫 What's Removed
- Microsoft Graph API dependency
- Azure authentication requirement
- Outlook desktop integration
- Complex Graph API permissions

## Testing

### Golden Visa Tab (Ready for Testing)
1. Fill out Golden Visa form with client details
2. Click **"Download and Send"**
3. Verify PDF downloads
4. Verify email preview modal appears
5. Make minor text edits if needed
6. Click **"Send Email"**
7. Check recipient's inbox for properly formatted email with PDF

## Troubleshooting

### Common Issues
1. **SMTP Authentication Failed**
   - Verify BREVO_SMTP_USER and BREVO_SMTP_PASSWORD in .env.local
   - Ensure using SMTP key, not account password

2. **Email Preview Not Opening**
   - Check browser console for errors
   - Verify PDF generation completed successfully

3. **Email Not Received**
   - Check spam folder
   - Verify recipient email address
   - Check Brevo account sending limits

## Environment Variables Summary

```bash
# Required for SMTP email functionality
BREVO_SMTP_USER="your-brevo-email@example.com"
BREVO_SMTP_PASSWORD="your-brevo-smtp-key"

# Optional: OpenAI for AI assistant
OPENAI_API_KEY="your-openai-key"

# Deprecated: Azure Graph API (no longer needed)
# NEXT_PUBLIC_AZURE_CLIENT_ID=""
# AZURE_CLIENT_SECRET=""
# AZURE_TENANT_ID=""
```

This new implementation provides a much cleaner, more reliable email experience without external authentication dependencies.