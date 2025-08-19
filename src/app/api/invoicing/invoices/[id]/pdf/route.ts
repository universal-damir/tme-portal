/**
 * API Routes for Invoice PDF Generation
 * GET /api/invoicing/invoices/[id]/pdf - Generate and download invoice PDF
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { InvoiceService } from '@/lib/invoicing/invoice-service';
import { InvoicePDFGenerator } from '@/lib/invoicing/invoice-pdf-generator';
import { logAuditEvent } from '@/lib/audit';

/**
 * GET /api/invoicing/invoices/[id]/pdf
 * Generate and return invoice PDF
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

    // Get invoice with full details
    const invoice = await InvoiceService.getInvoiceById(invoiceId);
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // TODO: Check if user has permission to view this invoice
    // This should be integrated with your permission system

    // Validate invoice data for PDF generation
    const validation = InvoicePDFGenerator.validateInvoiceForPDF(invoice);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invoice data is invalid for PDF generation', details: validation.errors },
        { status: 400 }
      );
    }

    // Generate PDF
    const { blob, filename } = await InvoicePDFGenerator.generatePDFWithFilename(invoice);
    
    // Convert blob to buffer for response
    const buffer = Buffer.from(await blob.arrayBuffer());

    // Log audit event
    await logAuditEvent({
      userId: parseInt(session.userId),
      action: 'invoice_pdf_generated',
      resource: 'invoices',
      resourceId: invoiceId.toString(),
      details: {
        invoiceNumber: invoice.invoiceNumber,
        filename,
        fileSize: buffer.length
      },
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined
    });

    // Return PDF as downloadable response
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate invoice PDF' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invoicing/invoices/[id]/pdf
 * Generate PDF and return as blob data (for email attachments)
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

    // Get invoice with full details
    const invoice = await InvoiceService.getInvoiceById(invoiceId);
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Validate invoice data for PDF generation
    const validation = InvoicePDFGenerator.validateInvoiceForPDF(invoice);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invoice data is invalid for PDF generation', details: validation.errors },
        { status: 400 }
      );
    }

    // Generate PDF
    const { blob, filename } = await InvoicePDFGenerator.generatePDFWithFilename(invoice);
    
    // Convert blob to base64 for JSON response
    const buffer = Buffer.from(await blob.arrayBuffer());
    const base64Data = buffer.toString('base64');

    // Log audit event
    await logAuditEvent({
      userId: parseInt(session.userId),
      action: 'invoice_pdf_generated',
      resource: 'invoices',
      resourceId: invoiceId.toString(),
      details: {
        invoiceNumber: invoice.invoiceNumber,
        filename,
        fileSize: buffer.length,
        purpose: 'email_attachment'
      },
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined
    });

    return NextResponse.json({
      filename,
      contentType: 'application/pdf',
      size: buffer.length,
      data: base64Data
    });
  } catch (error) {
    console.error('Error generating invoice PDF for attachment:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate invoice PDF' },
      { status: 500 }
    );
  }
}