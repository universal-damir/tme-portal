/**
 * API Routes for Invoice Approval
 * POST /api/invoicing/invoices/[id]/approve - Approve/Reject invoice
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query, transaction } from '@/lib/database';
import { logAuditEvent } from '@/lib/audit';
import { ApprovalService } from '@/lib/invoicing/approval-service';
import { z } from 'zod';

// Validation schema for approval action
const approvalActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'request_revision']),
  comments: z.string().optional(),
});

/**
 * POST /api/invoicing/invoices/[id]/approve
 * Approve, reject, or request revision for an invoice
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
    const { action, comments } = approvalActionSchema.parse(body);

    const invoiceId = parseInt(params.id);
    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      );
    }

    // Check if user has approval permissions
    const canApprove = await ApprovalService.canApproveInvoices(session.user.id);
    if (!canApprove) {
      return NextResponse.json(
        { error: 'You do not have permission to approve invoices' },
        { status: 403 }
      );
    }

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
        throw new Error('Invoice is not pending approval');
      }

      // Update approval record
      await client.query(
        `UPDATE invoice_approvals 
         SET status = $1, 
             approved_by = $2, 
             approval_date = CURRENT_TIMESTAMP,
             comments = $3
         WHERE invoice_id = $4 AND status = 'pending'`,
        [action === 'approve' ? 'approved' : action, session.user.id, comments, invoiceId]
      );

      // Update invoice status
      let newInvoiceStatus: string;
      if (action === 'approve') {
        newInvoiceStatus = 'approved';
      } else if (action === 'reject') {
        newInvoiceStatus = 'rejected';
      } else {
        newInvoiceStatus = 'revision_requested';
      }

      await client.query(
        `UPDATE invoices 
         SET status = $1, 
             approved_at = ${action === 'approve' ? 'CURRENT_TIMESTAMP' : 'NULL'},
             approved_by = ${action === 'approve' ? '$2' : 'NULL'},
             approval_notes = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [newInvoiceStatus, session.user.id, comments, invoiceId]
      );

      return {
        id: invoiceId,
        status: newInvoiceStatus,
        action,
        comments
      };
    });

    // Log audit event
    await logAuditEvent({
      userId: parseInt(session.userId),
      action: `invoice_${action}`,
      resource: 'invoices',
      resourceId: invoiceId.toString(),
      details: {
        action,
        comments: comments || null,
      },
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing approval:', error);
    
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
      { error: 'Failed to process approval' },
      { status: 500 }
    );
  }
}