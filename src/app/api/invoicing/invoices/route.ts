/**
 * API Routes for Invoices
 * GET /api/invoicing/invoices - Get all invoices
 * POST /api/invoicing/invoices - Create new invoice
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { InvoiceService } from '@/lib/invoicing/invoice-service';
import { z } from 'zod';
import { logAuditEvent } from '@/lib/audit';

// Validation schema for creating an invoice
const createInvoiceSchema = z.object({
  clientId: z.number().positive(),
  invoiceDate: z.string(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  status: z.enum(['draft', 'pending_approval']).optional(),
  sections: z.array(z.object({
    name: z.string(),
    items: z.array(z.object({
      description: z.string(),
      quantity: z.number().positive(),
      unit: z.string().optional(),
      unitPrice: z.number().min(0)
    }))
  })).min(1)
});

/**
 * GET /api/invoicing/invoices
 * Get all invoices with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const params = {
      status: searchParams.get('status') as any,
      clientId: searchParams.get('clientId') ? parseInt(searchParams.get('clientId')!) : undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      searchTerm: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '50')
    };

    // Validate page parameters
    if (params.page < 1) params.page = 1;
    if (params.pageSize < 1 || params.pageSize > 100) params.pageSize = 50;

    // Get invoices from service
    const result = await InvoiceService.getInvoices(params);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invoicing/invoices
 * Create a new invoice
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createInvoiceSchema.parse(body);

    // Create invoice
    const invoice = await InvoiceService.createInvoice(
      validatedData,
      parseInt(session.userId)
    );

    // Log audit event
    await logAuditEvent({
      userId: parseInt(session.userId),
      action: 'invoice_created',
      resource: 'invoices',
      resourceId: invoice.id?.toString() || '',
      details: {
        invoiceNumber: invoice.invoiceNumber,
        clientId: invoice.clientId,
        totalAmount: invoice.totalAmount,
        status: invoice.status
      },
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}