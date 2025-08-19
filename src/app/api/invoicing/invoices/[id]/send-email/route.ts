/**
 * API Routes for Sending Invoice Emails
 * POST /api/invoicing/invoices/[id]/send-email - Send invoice via email
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/database';
import { InvoiceService } from '@/lib/invoicing/invoice-service';
import { logAuditEvent } from '@/lib/audit';
import { z } from 'zod';

// Validation schema for email sending
const sendEmailSchema = z.object({
  to: z.array(z.string().email()),
  cc: z.array(z.string().email()).optional(),
  subject: z.string().min(1),
  htmlContent: z.string().min(1),
});

/**
 * POST /api/invoicing/invoices/[id]/send-email
 * Send invoice via email
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const sessionId = request.cookies.get('session')?.value;
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { to, cc, subject, htmlContent } = sendEmailSchema.parse(body);

    const invoiceId = parseInt(params.id);
    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      );
    }

    // Get invoice details
    const invoice = await InvoiceService.getInvoiceById(invoiceId);
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Check if invoice is approved (only approved invoices can be sent)
    if (invoice.status !== 'approved') {
      return NextResponse.json(
        { error: 'Only approved invoices can be sent' },
        { status: 400 }
      );
    }

    // TODO: Check if user has permission to send invoices
    // This should be integrated with your permission system

    // Send email using your existing email service
    // For now, we'll simulate the email sending
    // In production, replace this with your actual SMTP service
    const emailResult = await sendInvoiceEmail({
      to,
      cc,
      subject,
      htmlContent,
      invoice,
      attachments: [] // TODO: Add PDF attachment when PDF generation is implemented
    });

    // Update invoice status to 'sent'
    await InvoiceService.updateInvoiceStatus(invoiceId, 'sent', session.user.id);

    // Record email sending in database
    await query(
      `UPDATE invoices 
       SET sent_at = CURRENT_TIMESTAMP,
           sent_to_emails = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [JSON.stringify({ to, cc }), invoiceId]
    );

    // Log audit event
    await logAuditEvent({
      userId: parseInt(session.userId),
      action: 'invoice_sent',
      resource: 'invoices',
      resourceId: invoiceId.toString(),
      details: {
        invoiceNumber: invoice.invoiceNumber,
        recipients: to,
        cc: cc || [],
        subject
      },
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined
    });

    return NextResponse.json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} sent successfully`,
      sentAt: new Date().toISOString(),
      recipients: to,
      cc: cc || []
    });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send invoice email' },
      { status: 500 }
    );
  }
}

/**
 * Mock email sending function
 * TODO: Replace with your actual SMTP service implementation
 */
async function sendInvoiceEmail({
  to,
  cc,
  subject,
  htmlContent,
  invoice,
  attachments
}: {
  to: string[];
  cc?: string[];
  subject: string;
  htmlContent: string;
  invoice: any;
  attachments: any[];
}): Promise<{ success: boolean; messageId?: string }> {
  // Mock implementation - replace with actual email service
  console.log('Sending invoice email:', {
    to,
    cc,
    subject,
    invoiceNumber: invoice.invoiceNumber,
    attachmentsCount: attachments.length
  });

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock success response
  return {
    success: true,
    messageId: `invoice-${invoice.invoiceNumber}-${Date.now()}`
  };
}