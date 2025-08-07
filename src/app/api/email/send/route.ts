import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { verifySession } from '@/lib/auth';
import { logAuditEvent, getClientIP, getUserAgent } from '@/lib/audit';

// Brevo SMTP configuration
const createBrevoTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASSWORD,
    },
  });
};

export async function POST(request: NextRequest) {
  try {
    // Verify user session to get user email for REPLY-TO
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in to send emails' },
        { status: 401 }
      );
    }

    const { to, subject, htmlContent, attachments } = await request.json();

    // Validate required fields
    if (!to || !subject || !htmlContent) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, htmlContent' },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_PASSWORD) {
      return NextResponse.json(
        { error: 'SMTP credentials not configured' },
        { status: 500 }
      );
    }

    const transporter = createBrevoTransporter();

    // Process attachments to proper nodemailer format
    const processedAttachments = (attachments || []).map((attachment: any) => ({
      filename: attachment.filename,
      contentType: attachment.contentType,
      content: Buffer.from(attachment.content, 'base64'), // Convert back from base64
      encoding: 'binary' // Use binary encoding for the buffer
    }));

    // Prepare email options with contact@tme-services.com FROM and user REPLY-TO
    const mailOptions = {
      from: 'TME Services Portal <contact@tme-services.com>', // Professional company email with display name
      replyTo: session.user.email, // User's email for replies
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html: htmlContent,
      attachments: processedAttachments
    };

    // Send email
    const result = await transporter.sendMail(mailOptions);

    // Log successful email sending in audit trail
    // Use the first attachment filename as the primary filename (main PDF)
    const primaryFilename = processedAttachments.length > 0 ? processedAttachments[0].filename : null;
    
    await logAuditEvent({
      user_id: session.user.id,
      action: 'pdf_sent',
      resource: 'email_system',
      details: {
        recipient: Array.isArray(to) ? to.join(', ') : to,
        subject: subject,
        attachments_count: processedAttachments.length,
        message_id: result.messageId,
        attachment_filenames: processedAttachments.map(att => att.filename),
        // Use the primary attachment filename for proper nomenclature
        filename: primaryFilename,
        // Remove .pdf extension from filename to get form name
        form_name: primaryFilename ? primaryFilename.replace('.pdf', '') : null
      },
      ip_address: getClientIP(request),
      user_agent: getUserAgent(request)
    });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Email sending error:', error);

    // Log failed email attempt in audit trail
    if (session) {
      try {
        await logAuditEvent({
          user_id: session.user.id,
          action: 'pdf_send_failed',
          resource: 'email_system',
          details: {
            error_message: error instanceof Error ? error.message : 'Unknown error',
            recipient: to || 'unknown',
            subject: subject || 'unknown'
          },
          ip_address: getClientIP(request),
          user_agent: getUserAgent(request)
        });
      } catch (auditError) {
        console.error('Failed to log audit event:', auditError);
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}