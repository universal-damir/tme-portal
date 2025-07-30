import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth-middleware';
import { query } from '@/lib/database';
import bcrypt from 'bcryptjs';
import { logAuditEvent } from '@/lib/audit';
import { generateRandomPassword } from '@/lib/password-utils';

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const { userIds, action, role } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'User IDs are required' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    // Validate user IDs are numbers
    const validUserIds = userIds.filter(id => Number.isInteger(id));
    if (validUserIds.length !== userIds.length) {
      return NextResponse.json(
        { error: 'All user IDs must be valid integers' },
        { status: 400 }
      );
    }

    // Get affected users for audit logging
    const usersResult = await query(
      `SELECT id, employee_code, full_name FROM users WHERE id = ANY($1)`,
      [validUserIds]
    );
    const affectedUsers = usersResult.rows;

    let queryText = '';
    let queryParams: any[] = [];
    const auditDetails: any = { action, affected_user_ids: validUserIds };

    switch (action) {
      case 'activate':
        queryText = `
          UPDATE users 
          SET status = 'active', locked_until = NULL, failed_login_attempts = 0, updated_at = NOW()
          WHERE id = ANY($1)
        `;
        queryParams = [validUserIds];
        break;

      case 'deactivate':
        queryText = `
          UPDATE users 
          SET status = 'inactive', updated_at = NOW()
          WHERE id = ANY($1)
        `;
        queryParams = [validUserIds];
        break;

      case 'unlock':
        queryText = `
          UPDATE users 
          SET locked_until = NULL, failed_login_attempts = 0, updated_at = NOW()
          WHERE id = ANY($1)
        `;
        queryParams = [validUserIds];
        break;

      case 'reset_password':
        // For bulk password reset, we'll set a common temporary password
        const tempPassword = 'TME2024_TEMP';
        const hashedPassword = await bcrypt.hash(tempPassword, 12);
        
        queryText = `
          UPDATE users 
          SET hashed_password = $2, must_change_password = TRUE, 
              last_password_change = NOW(), updated_at = NOW()
          WHERE id = ANY($1)
        `;
        queryParams = [validUserIds, hashedPassword];
        auditDetails.temp_password_set = true;
        break;

      case 'change_role':
        if (!role || !['admin', 'manager', 'employee'].includes(role)) {
          return NextResponse.json(
            { error: 'Valid role is required for role change' },
            { status: 400 }
          );
        }
        
        queryText = `
          UPDATE users 
          SET role = $2, updated_at = NOW()
          WHERE id = ANY($1)
        `;
        queryParams = [validUserIds, role];
        auditDetails.new_role = role;
        break;

      case 'delete':
        // First, delete related sessions
        await query(
          'DELETE FROM sessions WHERE user_id = ANY($1)',
          [validUserIds]
        );
        
        // Then delete users (audit logs will remain due to foreign key constraint)
        queryText = `
          DELETE FROM users WHERE id = ANY($1) AND role != 'admin'
        `;
        queryParams = [validUserIds];
        auditDetails.warning = 'Admin users were not deleted';
        break;

      default:
        return NextResponse.json(
          { error: 'Unknown bulk action' },
          { status: 400 }
        );
    }

    // Execute the bulk operation
    const result = await query(queryText, queryParams);
    const affectedRowCount = result.rowCount || 0;

    // Log audit event
    await logAuditEvent({
      user_id: authResult.user.id,
      action: `admin_bulk_${action}`,
      resource: 'users',
      details: {
        ...auditDetails,
        affected_count: affectedRowCount,
        affected_users: affectedUsers.map(u => ({
          id: u.id,
          employee_code: u.employee_code,
          name: u.full_name
        }))
      },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown'
    });

    let message = `Bulk ${action} completed`;
    if (action === 'delete') {
      message += `. ${affectedRowCount} user(s) deleted (admin users were skipped)`;
    } else {
      message += `. ${affectedRowCount} user(s) affected`;
    }

    return NextResponse.json({
      message,
      affectedCount: affectedRowCount,
      ...(action === 'reset_password' && { 
        tempPassword: 'TME2024_TEMP',
        note: 'Users will be required to change password on next login'
      })
    });
  } catch (error) {
    console.error('Bulk user operation error:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}