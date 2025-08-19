/**
 * API Routes for Invoice Approval Submission
 * POST /api/invoicing/invoices/[id]/submit-approval - Submit invoice for approval with reviewer selection
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { InvoiceService } from '@/lib/invoicing/invoice-service';
import { logAuditEvent } from '@/lib/audit';
import { query, transaction } from '@/lib/database';
import { NotificationsService } from '@/lib/services/review-system';
import { z } from 'zod';

// Validation schema for approval submission
const approvalSubmissionSchema = z.object({
  reviewerId: z.number().positive(),
  urgency: z.enum(['standard', 'urgent']),
  comments: z.string().optional(),
});

/**
 * POST /api/invoicing/invoices/[id]/submit-approval
 * Submit an invoice for approval with reviewer selection
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

    const invoiceId = parseInt(params.id);
    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { reviewerId, urgency, comments } = approvalSubmissionSchema.parse(body);

    const result = await transaction(async (client) => {
      // Get current invoice
      const invoiceResult = await client.query(
        `SELECT id, invoice_number, status, client_id, total_amount 
         FROM invoices 
         WHERE id = $1`,
        [invoiceId]
      );

      if (invoiceResult.rows.length === 0) {
        throw new Error('Invoice not found');
      }

      const invoice = invoiceResult.rows[0];

      if (invoice.status !== 'pending_approval') {
        throw new Error('Invoice is already in the approval process or has been processed');
      }

      // Update invoice status to pending_approval
      await client.query(
        `UPDATE invoices 
         SET status = 'pending_approval',
             submitted_for_approval_at = CURRENT_TIMESTAMP,
             submitted_by = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [session.user.id, invoiceId]
      );

      // First, add the new columns if they don't exist
      try {
        await client.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice_approvals' AND column_name='reviewer_id') THEN
              ALTER TABLE invoice_approvals ADD COLUMN reviewer_id VARCHAR(100);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice_approvals' AND column_name='reviewer_type') THEN
              ALTER TABLE invoice_approvals ADD COLUMN reviewer_type VARCHAR(20) CHECK (reviewer_type IN ('individual', 'department'));
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice_approvals' AND column_name='urgency') THEN
              ALTER TABLE invoice_approvals ADD COLUMN urgency VARCHAR(20) DEFAULT 'standard' CHECK (urgency IN ('standard', 'urgent'));
            END IF;
          END
          $$;
        `);
      } catch (error) {
        console.warn('Error adding columns to invoice_approvals table:', error);
      }

      // Create approval record
      await client.query(
        `INSERT INTO invoice_approvals (
          invoice_id,
          requested_by,
          requested_at,
          assigned_to,
          urgency,
          comments,
          status
        ) VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5, 'pending')`,
        [
          invoiceId,
          session.user.id,
          reviewerId, // assigned_to is the reviewer
          urgency,
          comments || null
        ]
      );

      return {
        id: invoiceId,
        status: 'pending_approval',
        reviewerId,
        urgency
      };
    });

    // Get the updated invoice with full details
    const updatedInvoice = await InvoiceService.getInvoiceById(invoiceId);

    // Log audit event
    await logAuditEvent({
      userId: parseInt(session.userId),
      action: 'invoice_submitted_for_approval',
      resource: 'invoices',
      resourceId: invoiceId.toString(),
      details: {
        reviewerId,
        urgency,
        comments: comments || null
      },
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined
    });

    // Create notification for the actual reviewer from the database
    // The reviewer_id from the form is the actual user.id from the database
    
    if (updatedInvoice) {
      try {
        await NotificationsService.create({
          user_id: reviewerId, // Use the actual reviewer ID from database
          type: 'review_requested',
          title: `Invoice Approval: ${updatedInvoice.invoiceNumber}`,
          message: comments || `New invoice from ${updatedInvoice.client?.clientName} requires your approval (${updatedInvoice.totalAmount} AED)`,
          application_id: invoiceId.toString(),
          metadata: {
            invoice_id: invoiceId,
            invoice_number: updatedInvoice.invoiceNumber,
            client_name: updatedInvoice.client?.clientName,
            amount: updatedInvoice.totalAmount,
            urgency,
            submitter: session.user.full_name || session.user.email
          }
        });
      } catch (notificationError) {
        console.warn('Failed to create notification:', notificationError);
        // Don't fail the whole request if notification fails
      }
    }

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error('Error submitting invoice for approval:', error);
    
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
      { error: 'Failed to submit invoice for approval' },
      { status: 500 }
    );
  }
}