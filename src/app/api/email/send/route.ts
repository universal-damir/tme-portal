import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { verifySession } from '@/lib/auth';

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

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}