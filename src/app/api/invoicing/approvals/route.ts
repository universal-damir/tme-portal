/**
 * API Routes for Invoice Approvals
 * GET /api/invoicing/approvals - Get pending approvals for managers
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/database';
import { ApprovalService } from '@/lib/invoicing/approval-service';

/**
 * GET /api/invoicing/approvals
 * Get pending approvals for the current user (if they're a manager)
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    // Check if user has approval permissions
    const canApprove = await ApprovalService.canApproveInvoices(session.user.id);
    if (!canApprove) {
      return NextResponse.json(
        { error: 'You do not have permission to view approvals' },
        { status: 403 }
      );
    }

    // Get pending approvals
    const offset = (page - 1) * pageSize;
    
    const result = await query(
      `SELECT 
         ia.id as approval_id,
         ia.status as approval_status,
         ia.requested_at,
         ia.approval_date,
         ia.comments,
         i.id as invoice_id,
         i.invoice_number,
         i.invoice_date,
         i.total_amount,
         i.status as invoice_status,
         i.notes,
         i.internal_notes,
         c.client_code,
         c.client_name,
         c.issuing_company,
         u.name as requested_by_name
       FROM invoice_approvals ia
       JOIN invoices i ON ia.invoice_id = i.id
       JOIN invoice_clients c ON i.client_id = c.id
       LEFT JOIN users u ON ia.requested_by = u.id
       WHERE ia.status = $1
         AND (ia.assigned_to = $2 OR $2 = 0) -- If user ID is 0, show all (for admin)
       ORDER BY ia.requested_at DESC
       LIMIT $3 OFFSET $4`,
      [status, session.user.id, pageSize, offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM invoice_approvals ia
       WHERE ia.status = $1
         AND (ia.assigned_to = $2 OR $2 = 0)`,
      [status, session.user.id]
    );

    const approvals = result.rows.map(row => ({
      id: row.approval_id,
      invoiceId: row.invoice_id,
      invoiceNumber: row.invoice_number,
      invoiceDate: row.invoice_date,
      totalAmount: parseFloat(row.total_amount),
      status: row.approval_status,
      requestedAt: row.requested_at,
      approvalDate: row.approval_date,
      comments: row.comments,
      client: {
        code: row.client_code,
        name: row.client_name,
        issuingCompany: row.issuing_company
      },
      requestedBy: row.requested_by_name,
      invoiceStatus: row.invoice_status,
      notes: row.notes,
      internalNotes: row.internal_notes
    }));

    return NextResponse.json({
      approvals,
      total: parseInt(countResult.rows[0].total),
      page,
      pageSize
    });
  } catch (error) {
    console.error('Error fetching approvals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approvals' },
      { status: 500 }
    );
  }
}