/**
 * API Routes for Invoice Clients
 * GET /api/invoicing/clients - Get all clients
 * POST /api/invoicing/clients - Create new client
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { ClientService } from '@/lib/invoicing/client-service';
import { z } from 'zod';
import { logAuditEvent } from '@/lib/audit';

// Validation schema for creating a client
const createClientSchema = z.object({
  clientName: z.string().min(1).max(255),
  clientAddress: z.string().min(1),
  managerName: z.string().min(1).max(255),
  managerEmail: z.string().email().optional(),
  vatNumber: z.string().optional(),
  issuingCompany: z.enum(['DET', 'FZCO', 'DMCC']),
  isActive: z.boolean().default(true),
  isRecurring: z.boolean().default(false),
  defaultServices: z.array(z.object({
    serviceCatalogId: z.number(),
    quantity: z.number(),
    unitPrice: z.number(),
    unit: z.string()
  })).optional()
});

/**
 * GET /api/invoicing/clients
 * Get all invoice clients with optional filters
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

    // TODO: Check permissions when implemented
    // if (!hasPermission(session.user, 'invoice_read')) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const params = {
      isActive: searchParams.get('isActive') === 'true' ? true : 
                searchParams.get('isActive') === 'false' ? false : undefined,
      isRecurring: searchParams.get('isRecurring') === 'true' ? true :
                   searchParams.get('isRecurring') === 'false' ? false : undefined,
      issuingCompany: searchParams.get('issuingCompany') as 'DET' | 'FZCO' | 'DMCC' | undefined,
      searchTerm: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '50')
    };

    // Validate page parameters
    if (params.page < 1) params.page = 1;
    if (params.pageSize < 1 || params.pageSize > 100) params.pageSize = 50;

    // Get clients from service
    const result = await ClientService.getClients(params);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invoicing/clients
 * Create a new invoice client
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

    // TODO: Check permissions when implemented
    // if (!hasPermission(session.user, 'client_manage')) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createClientSchema.parse(body);

    // Create client
    const client = await ClientService.createClient(
      {
        clientCode: '', // Will be generated
        ...validatedData,
        annualCodeYear: new Date().getFullYear()
      },
      parseInt(session.userId)
    );

    // Log audit event
    await logAuditEvent({
      userId: parseInt(session.userId),
      action: 'client_created',
      resource: 'invoice_clients',
      resourceId: client.id?.toString() || '',
      details: {
        clientName: client.clientName,
        clientCode: client.clientCode,
        issuingCompany: client.issuingCompany
      },
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}