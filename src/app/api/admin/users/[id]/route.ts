import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth-middleware';
import { query } from '@/lib/database';
import bcrypt from 'bcryptjs';
import { logAuditEvent } from '@/lib/audit';
import { generateRandomPassword } from '@/lib/password-utils';

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

    const userId = parseInt(params.id);
    if (!userId || isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const userResult = await query(
      `SELECT 
        id, employee_code, email, full_name, department, designation,
        role, status, created_at, last_login, failed_login_attempts,
        locked_until, must_change_password, last_password_change
      FROM users 
      WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: userResult.rows[0] });
  } catch (error) {
    console.error('Admin get user error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
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

    const userId = parseInt(params.id);
    if (!userId || isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const body = await req.json();
    const { action, ...updateData } = body;

    // Handle specific actions
    if (action) {
      return handleUserAction(userId, action, authResult.user, req);
    }

    // Handle general user update
    const {
      employee_code,
      email,
      full_name,
      department,
      designation,
      role,
      status,
      password
    } = updateData;

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (employee_code !== undefined) {
      updates.push(`employee_code = $${paramIndex++}`);
      values.push(employee_code);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (full_name !== undefined) {
      updates.push(`full_name = $${paramIndex++}`);
      values.push(full_name);
    }
    if (department !== undefined) {
      updates.push(`department = $${paramIndex++}`);
      values.push(department);
    }
    if (designation !== undefined) {
      updates.push(`designation = $${paramIndex++}`);
      values.push(designation);
    }
    if (role !== undefined) {
      updates.push(`role = $${paramIndex++}`);
      values.push(role);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      updates.push(`hashed_password = $${paramIndex++}`);
      updates.push(`last_password_change = NOW()`);
      updates.push(`must_change_password = FALSE`);
      values.push(hashedPassword);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} 
       RETURNING id, employee_code, email, full_name, department, designation, role, status`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedUser = result.rows[0];

    // Log audit event
    await logAuditEvent({
      user_id: authResult.user.id,
      action: 'admin_update_user',
      resource: 'user',
      details: {
        updated_user_id: userId,
        updated_fields: Object.keys(updateData),
        employee_code: updatedUser.employee_code
      },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Admin update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

async function handleUserAction(
  userId: number, 
  action: string, 
  adminUser: any, 
  req: NextRequest
) {
  switch (action) {
    case 'activate':
      await query(
        'UPDATE users SET status = $1, locked_until = NULL, failed_login_attempts = 0, updated_at = NOW() WHERE id = $2',
        ['active', userId]
      );
      break;

    case 'deactivate':
      await query(
        'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2',
        ['inactive', userId]
      );
      break;

    case 'unlock':
      await query(
        'UPDATE users SET locked_until = NULL, failed_login_attempts = 0, updated_at = NOW() WHERE id = $2',
        [userId]
      );
      break;

    case 'reset_password':
      const newPassword = generateRandomPassword();
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      await query(
        `UPDATE users SET 
          hashed_password = $1, 
          must_change_password = TRUE, 
          last_password_change = NOW(),
          updated_at = NOW()
        WHERE id = $2`,
        [hashedPassword, userId]
      );
      
      // TODO: In a real implementation, you might want to send this password via email
      // For now, we'll return it in the response (not secure for production)
      break;

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  // Log audit event
  await logAuditEvent({
    user_id: adminUser.id,
    action: `admin_${action}_user`,
    resource: 'user',
    details: {
      target_user_id: userId,
      action
    },
    ip_address: req.headers.get('x-forwarded-for') || 'unknown'
  });

  return NextResponse.json({
    message: `User ${action} completed successfully`
  });
}