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

    const { to, cc, subject, htmlContent, attachments, metadata } = await request.json();

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
    const processedAttachments = (attachments || []).map((attachment: any) => {
      const attachmentObj: any = {
        filename: attachment.filename,
        contentType: attachment.contentType,
        content: Buffer.from(attachment.content, 'base64'), // Convert back from base64
        encoding: 'binary' // Use binary encoding for the buffer
      };
      
      // Add CID if present (for inline images)
      if (attachment.cid) {
        attachmentObj.cid = attachment.cid;
        console.log('📎 Processing CID attachment:', attachment.cid, 'filename:', attachment.filename);
      }
      
      return attachmentObj;
    });

    // Prepare email options with portal@TME-Services.com FROM and user REPLY-TO
    const mailOptions = {
      from: 'TME Services Portal <portal@TME-Services.com>', // Professional company email with display name
      replyTo: session.user.email, // User's email for replies
      to: Array.isArray(to) ? to.join(', ') : to,
      cc: cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
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

    // Create email follow-up entry after successful email send
    if (primaryFilename && attachments && attachments.length > 0) {
      try {
        const recipientEmail = Array.isArray(to) ? to[0] : to;
        
        // Extract client name from metadata or fallback to extraction
        let clientName = '';
        const formName = primaryFilename.replace('.pdf', '');
        
        // First priority: Use metadata if available
        if (metadata?.clientName) {
          clientName = metadata.clientName;
        } else if (metadata?.clientFirstName || metadata?.clientLastName) {
          clientName = `${metadata.clientFirstName || ''} ${metadata.clientLastName || ''}`.trim();
        } else {
          // Fallback: Try to extract from filename
          let clientFirstName = '';
          let clientLastName = '';
          
          // Try to parse additional form context from the PDF filename
          // Format is typically: YYMMDD ClientName offer/service type
          const filenameParts = primaryFilename.replace('.pdf', '').split(' ');
          if (filenameParts.length >= 3) {
            // Look for client name patterns in filename
            const potentialName = filenameParts.slice(1, 3).join(' '); // Take parts after date
            if (potentialName && potentialName !== 'offer' && potentialName !== 'TME') {
              const nameParts = potentialName.split(' ');
              clientFirstName = nameParts[1] || '';
              clientLastName = nameParts[0] || '';
            }
          }
          
          // Last fallback: email extraction
          if (!clientFirstName && !clientLastName) {
            const emailName = recipientEmail.split('@')[0].replace(/[._]/g, ' ');
            const emailNameParts = emailName.split(' ');
            clientFirstName = emailNameParts[0] || '';
            clientLastName = emailNameParts[1] || '';
          }
          
          clientName = `${clientFirstName} ${clientLastName}`.trim() || 'client';
        }
        
        // Import FollowUpService and create email follow-up
        const { FollowUpService } = await import('@/lib/services/follow-up-service');
        
        // Check if follow-ups table exists before trying to create entry
        const tableExists = await FollowUpService.tableExists();
        let followUpId = null;
        
        if (tableExists) {
          const followUp = await FollowUpService.create({
            user_id: session.user.id,
            email_subject: subject,
            client_name: clientName,
            client_email: recipientEmail,
            document_type: formName,
            original_email_id: result.messageId,
            sent_date: new Date()
          });
          
          followUpId = followUp.id;
          console.log('✅ Email follow-up created:', followUp.id);
        } else {
          console.log('⚠️ Follow-ups table not initialized - skipping follow-up creation');
        }
        
        // Also create a legacy todo for backward compatibility (can be removed later)
        const { TodoService } = await import('@/lib/services/todo-service');
        const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const formattedDueDate = `${dueDate.getDate().toString().padStart(2, '0')}.${(dueDate.getMonth() + 1).toString().padStart(2, '0')}.${dueDate.getFullYear()}`;
        
        await TodoService.create({
          user_id: session.user.id,
          title: `Follow up with ${clientName} regarding ${formName}`,
          description: `Document "${formName}" has been sent to ${clientName} (${recipientEmail}) on ${new Date().toLocaleDateString('en-GB')}. Follow up to ensure they received it and answer any questions. Due: ${formattedDueDate}`,
          category: 'to_follow_up',
          priority: 'standard',
          due_date: dueDate,
          client_name: clientName,
          document_type: formName,
          auto_generated: true,
          action_type: 'contact_client',
          action_data: {
            client_first_name: clientFirstName,
            client_last_name: clientLastName,
            client_full_name: clientName,
            document_type: formName,
            filename: primaryFilename,
            recipient_email: recipientEmail,
            sent_date: new Date(),
            due_date_formatted: formattedDueDate,
            follow_up_reason: 'document_sent',
            follow_up_id: followUpId // Link to new follow-up system (if created)
          }
        });
      } catch (error) {
        console.error('❌ Failed to create follow-up:', error);
        // Don't fail the email send if follow-up creation fails
      }
    }

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