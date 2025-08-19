/**
 * API Routes for Individual Invoice Client
 * GET /api/invoicing/clients/[id] - Get client by ID
 * PUT /api/invoicing/clients/[id] - Update client
 * DELETE /api/invoicing/clients/[id] - Delete client (soft delete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { ClientService } from '@/lib/invoicing/client-service';
import { z } from 'zod';
import { logAuditEvent } from '@/lib/audit';

// Validation schema for updating a client
const updateClientSchema = z.object({
  clientName: z.string().min(1).max(255).optional(),
  clientAddress: z.string().min(1).optional(),
  managerName: z.string().min(1).max(255).optional(),
  managerEmail: z.string().email().optional().nullable(),
  vatNumber: z.string().optional().nullable(),
  issuingCompany: z.enum(['DET', 'FZCO', 'DMCC']).optional(),
  isActive: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
  defaultServices: z.array(z.object({
    serviceCatalogId: z.number(),
    quantity: z.number(),
    unitPrice: z.number(),
    unit: z.string()
  })).optional()
});

/**
 * GET /api/invoicing/clients/[id]
 * Get a specific client by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Check permissions when implemented
    // if (!hasPermission(session.user, 'invoice_read')) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const clientId = parseInt(params.id);
    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: 'Invalid client ID' },
        { status: 400 }
      );
    }

    const client = await ClientService.getClientById(clientId);
    
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/invoicing/clients/[id]
 * Update a client
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Check permissions when implemented
    // if (!hasPermission(session.user, 'client_manage')) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const clientId = parseInt(params.id);
    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: 'Invalid client ID' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateClientSchema.parse(body);

    // Update client
    const updatedClient = await ClientService.updateClient(clientId, validatedData);
    
    if (!updatedClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      action: 'client_updated',
      resource: 'invoice_clients',
      resourceId: clientId.toString(),
      details: {
        updates: validatedData
      },
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined
    });

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/invoicing/clients/[id]
 * Soft delete a client (set is_active = false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Check permissions when implemented
    // if (!hasPermission(session.user, 'client_manage')) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const clientId = parseInt(params.id);
    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: 'Invalid client ID' },
        { status: 400 }
      );
    }

    // Get client details before deletion for audit log
    const client = await ClientService.getClientById(clientId);
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Soft delete the client
    const success = await ClientService.deleteClient(clientId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete client' },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      action: 'client_deleted',
      resource: 'invoice_clients',
      resourceId: clientId.toString(),
      details: {
        clientName: client.clientName,
        clientCode: client.clientCode
      },
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }
}