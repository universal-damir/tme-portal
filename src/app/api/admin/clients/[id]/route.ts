import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth-middleware';
import { query } from '@/lib/database';
import { logAuditEvent } from '@/lib/audit';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const clientId = parseInt(params.id);
    if (isNaN(clientId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const result = await query(
      `SELECT 
        id, company_code, company_name, company_name_short, registered_authority,
        management_name, management_email, city, po_box, vat_trn, status, notes,
        created_at AT TIME ZONE 'UTC' as created_at, 
        updated_at AT TIME ZONE 'UTC' as updated_at,
        created_by, updated_by
      FROM clients WHERE id = $1`,
      [clientId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ client: result.rows[0] });
  } catch (error) {
    console.error('Get client error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const clientId = parseInt(params.id);
    if (isNaN(clientId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const body = await req.json();
    const {
      company_code,
      company_name,
      company_name_short,
      registered_authority,
      management_name,
      management_email,
      city,
      po_box,
      vat_trn,
      status,
      notes
    } = body;

    // Check if client exists
    const existingClient = await query(
      'SELECT * FROM clients WHERE id = $1',
      [clientId]
    );

    if (existingClient.rows.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const currentClient = existingClient.rows[0];

    // Check if company code is being changed and if new code already exists
    if (company_code && company_code !== currentClient.company_code) {
      const duplicateResult = await query(
        'SELECT id FROM clients WHERE company_code = $1 AND id != $2',
        [company_code, clientId]
      );

      if (duplicateResult.rows.length > 0) {
        return NextResponse.json(
          { error: 'Client with this company code already exists' },
          { status: 400 }
        );
      }
    }

    // Validate email format if provided
    if (management_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(management_email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (company_code !== undefined) {
      updates.push(`company_code = $${paramIndex++}`);
      values.push(company_code);
    }
    if (company_name !== undefined) {
      updates.push(`company_name = $${paramIndex++}`);
      values.push(company_name);
    }
    if (company_name_short !== undefined) {
      updates.push(`company_name_short = $${paramIndex++}`);
      values.push(company_name_short);
    }
    if (registered_authority !== undefined) {
      updates.push(`registered_authority = $${paramIndex++}`);
      values.push(registered_authority);
    }
    if (management_name !== undefined) {
      updates.push(`management_name = $${paramIndex++}`);
      values.push(management_name);
    }
    if (management_email !== undefined) {
      updates.push(`management_email = $${paramIndex++}`);
      values.push(management_email);
    }
    if (city !== undefined) {
      updates.push(`city = $${paramIndex++}`);
      values.push(city);
    }
    if (po_box !== undefined) {
      updates.push(`po_box = $${paramIndex++}`);
      values.push(po_box || null);
    }
    if (vat_trn !== undefined) {
      updates.push(`vat_trn = $${paramIndex++}`);
      values.push(vat_trn || null);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(notes || null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Add updated_by and updated_at
    updates.push(`updated_by = $${paramIndex++}`, `updated_at = NOW()`);
    values.push(authResult.user.id);
    
    // Add client ID for WHERE clause
    values.push(clientId);

    const updateQuery = `
      UPDATE clients 
      SET ${updates.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(updateQuery, values);
    const updatedClient = result.rows[0];

    // Log audit event
    await logAuditEvent({
      user_id: authResult.user.id,
      action: 'admin_update_client',
      resource: 'client',
      resource_id: clientId.toString(),
      details: {
        company_code: updatedClient.company_code,
        company_name: updatedClient.company_name,
        changes: Object.keys(body)
      },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({
      message: 'Client updated successfully',
      client: updatedClient
    });
  } catch (error) {
    console.error('Update client error:', error);
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const clientId = parseInt(params.id);
    if (isNaN(clientId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    // Get client details before deletion for audit
    const clientResult = await query(
      'SELECT company_code, company_name FROM clients WHERE id = $1',
      [clientId]
    );

    if (clientResult.rows.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const client = clientResult.rows[0];

    // Delete client
    await query('DELETE FROM clients WHERE id = $1', [clientId]);

    // Log audit event
    await logAuditEvent({
      user_id: authResult.user.id,
      action: 'admin_delete_client',
      resource: 'client',
      resource_id: clientId.toString(),
      details: {
        company_code: client.company_code,
        company_name: client.company_name
      },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({
      message: 'Client deleted successfully'
    });
  } catch (error) {
    console.error('Delete client error:', error);
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }
}