/**
 * API Routes for Invoice Payments
 * GET /api/invoicing/invoices/[id]/payments - Get payments for invoice
 * POST /api/invoicing/invoices/[id]/payments - Record new payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query, transaction } from '@/lib/database';
import { InvoiceService } from '@/lib/invoicing/invoice-service';
import { logAuditEvent } from '@/lib/audit';
import { z } from 'zod';

// Validation schema for recording a payment
const recordPaymentSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  referenceNumber: z.string().min(1, 'Reference number is required'),
  notes: z.string().optional(),
});

/**
 * GET /api/invoicing/invoices/[id]/payments
 * Get all payments for an invoice
 */
export async function GET(
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

    // Get payments for the invoice
    const result = await query(
      `SELECT 
         ip.*,
         u.name as recorded_by_name
       FROM invoice_payments ip
       LEFT JOIN users u ON ip.recorded_by = u.id
       WHERE ip.invoice_id = $1
       ORDER BY ip.payment_date DESC, ip.created_at DESC`,
      [invoiceId]
    );

    const payments = result.rows.map(row => ({
      id: row.id,
      invoiceId: row.invoice_id,
      amount: parseFloat(row.amount),
      paymentDate: row.payment_date,
      paymentMethod: row.payment_method,
      referenceNumber: row.reference_number,
      notes: row.notes,
      recordedBy: row.recorded_by,
      recordedByName: row.recorded_by_name,
      createdAt: row.created_at
    }));

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Error fetching invoice payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invoicing/invoices/[id]/payments
 * Record a new payment for an invoice
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
    const paymentData = recordPaymentSchema.parse(body);

    // TODO: Check if user has permission to record payments
    // This should be integrated with your permission system

    const result = await transaction(async (client) => {
      // Get current invoice to validate payment
      const invoiceResult = await client.query(
        `SELECT id, invoice_number, total_amount, paid_amount, status
         FROM invoices 
         WHERE id = $1`,
        [invoiceId]
      );

      if (invoiceResult.rows.length === 0) {
        throw new Error('Invoice not found');
      }

      const invoice = invoiceResult.rows[0];
      const currentPaidAmount = parseFloat(invoice.paid_amount || 0);
      const totalAmount = parseFloat(invoice.total_amount);
      const outstandingBalance = totalAmount - currentPaidAmount;

      // Validate payment amount
      if (paymentData.amount > outstandingBalance) {
        throw new Error(`Payment amount (${paymentData.amount}) cannot exceed outstanding balance (${outstandingBalance})`);
      }

      // Record the payment
      const paymentResult = await client.query(
        `INSERT INTO invoice_payments (
           invoice_id,
           payment_date,
           amount,
           payment_method,
           reference_number,
           notes,
           recorded_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          invoiceId,
          paymentData.paymentDate,
          paymentData.amount,
          paymentData.paymentMethod,
          paymentData.referenceNumber,
          paymentData.notes || null,
          session.user.id
        ]
      );

      const payment = paymentResult.rows[0];

      // Update invoice paid amount
      const newPaidAmount = currentPaidAmount + paymentData.amount;
      const newBalanceDue = totalAmount - newPaidAmount;

      // Determine new invoice status
      let newStatus = invoice.status;
      if (newBalanceDue <= 0) {
        newStatus = 'paid';
      } else if (newPaidAmount > 0 && newStatus !== 'overdue') {
        newStatus = 'partially_paid';
      }

      // Update invoice
      await client.query(
        `UPDATE invoices 
         SET paid_amount = $1,
             balance_due = $2,
             status = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [newPaidAmount, newBalanceDue, newStatus, invoiceId]
      );

      // Return payment with additional info
      return {
        id: payment.id,
        invoiceId: payment.invoice_id,
        amount: parseFloat(payment.amount),
        paymentDate: payment.payment_date,
        paymentMethod: payment.payment_method,
        referenceNumber: payment.reference_number,
        notes: payment.notes,
        recordedBy: payment.recorded_by,
        createdAt: payment.created_at,
        invoice: {
          id: invoiceId,
          invoiceNumber: invoice.invoice_number,
          totalAmount: totalAmount,
          paidAmount: newPaidAmount,
          balanceDue: newBalanceDue,
          status: newStatus
        }
      };
    });

    // Log audit event
    await logAuditEvent({
      userId: parseInt(session.userId),
      action: 'payment_recorded',
      resource: 'invoices',
      resourceId: invoiceId.toString(),
      details: {
        paymentId: result.id,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        referenceNumber: paymentData.referenceNumber,
        invoiceNumber: result.invoice.invoiceNumber
      },
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error recording payment:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid payment data', details: error.errors },
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
      { error: 'Failed to record payment' },
      { status: 500 }
    );
  }
}