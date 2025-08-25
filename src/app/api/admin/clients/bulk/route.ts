import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth-middleware';
import { query } from '@/lib/database';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const { clientIds, action, ...actionData } = body;

    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return NextResponse.json(
        { error: 'No client IDs provided' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: 'No action specified' },
        { status: 400 }
      );
    }

    // Get client details for audit logging
    const clientsResult = await query(
      `SELECT id, company_code, company_name FROM clients WHERE id = ANY($1)`,
      [clientIds]
    );
    
    const clients = clientsResult.rows;
    const results = { success: 0, failed: 0, errors: [] as string[] };

    switch (action) {
      case 'delete':
        try {
          await query('DELETE FROM clients WHERE id = ANY($1)', [clientIds]);
          results.success = clients.length;

          // Log audit event for each deleted client
          for (const client of clients) {
            await logAuditEvent({
              user_id: authResult.user.id,
              action: 'admin_bulk_delete_client',
              resource: 'client',
              resource_id: client.id.toString(),
              details: {
                company_code: client.company_code,
                company_name: client.company_name,
                bulk_action: true
              },
              ip_address: req.headers.get('x-forwarded-for') || 'unknown'
            });
          }
        } catch {
          results.failed = clients.length;
          results.errors.push('Failed to delete clients');
        }
        break;

      case 'activate':
      case 'deactivate':
        const newStatus = action === 'activate' ? 'active' : 'inactive';
        try {
          await query(
            'UPDATE clients SET status = $1, updated_by = $2, updated_at = NOW() WHERE id = ANY($3)',
            [newStatus, authResult.user.id, clientIds]
          );
          results.success = clients.length;

          // Log audit event for each updated client
          for (const client of clients) {
            await logAuditEvent({
              user_id: authResult.user.id,
              action: `admin_bulk_${action}_client`,
              resource: 'client',
              resource_id: client.id.toString(),
              details: {
                company_code: client.company_code,
                company_name: client.company_name,
                new_status: newStatus,
                bulk_action: true
              },
              ip_address: req.headers.get('x-forwarded-for') || 'unknown'
            });
          }
        } catch {
          results.failed = clients.length;
          results.errors.push(`Failed to ${action} clients`);
        }
        break;

      case 'update_authority':
        const { registered_authority } = actionData;
        if (!registered_authority) {
          return NextResponse.json(
            { error: 'No registered authority provided' },
            { status: 400 }
          );
        }

        try {
          await query(
            'UPDATE clients SET registered_authority = $1, updated_by = $2, updated_at = NOW() WHERE id = ANY($3)',
            [registered_authority, authResult.user.id, clientIds]
          );
          results.success = clients.length;

          // Log audit event for each updated client
          for (const client of clients) {
            await logAuditEvent({
              user_id: authResult.user.id,
              action: 'admin_bulk_update_authority_client',
              resource: 'client',
              resource_id: client.id.toString(),
              details: {
                company_code: client.company_code,
                company_name: client.company_name,
                new_authority: registered_authority,
                bulk_action: true
              },
              ip_address: req.headers.get('x-forwarded-for') || 'unknown'
            });
          }
        } catch {
          results.failed = clients.length;
          results.errors.push('Failed to update registered authority');
        }
        break;

      case 'archive':
        try {
          await query(
            'UPDATE clients SET status = $1, updated_by = $2, updated_at = NOW() WHERE id = ANY($3)',
            ['archived', authResult.user.id, clientIds]
          );
          results.success = clients.length;

          // Log audit event for each archived client
          for (const client of clients) {
            await logAuditEvent({
              user_id: authResult.user.id,
              action: 'admin_bulk_archive_client',
              resource: 'client',
              resource_id: client.id.toString(),
              details: {
                company_code: client.company_code,
                company_name: client.company_name,
                bulk_action: true
              },
              ip_address: req.headers.get('x-forwarded-for') || 'unknown'
            });
          }
        } catch {
          results.failed = clients.length;
          results.errors.push('Failed to archive clients');
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: `Bulk ${action} completed`,
      results
    });

  } catch (error) {
    console.error('Bulk action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}