import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth-middleware';
import { query } from '@/lib/database';
import bcrypt from 'bcryptjs';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build dynamic query
    const whereConditions = [];
    const queryParams = [];
    let paramIndex = 1;

    if (department) {
      whereConditions.push(`department = $${paramIndex++}`);
      queryParams.push(department);
    }

    if (role) {
      whereConditions.push(`role = $${paramIndex++}`);
      queryParams.push(role);
    }

    if (status) {
      whereConditions.push(`status = $${paramIndex++}`);
      queryParams.push(status);
    }

    if (search) {
      whereConditions.push(`(full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR employee_code ILIKE $${paramIndex++})`);
      queryParams.push(`%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const usersResult = await query(
      `SELECT 
        id, employee_code, email, full_name, department, designation, 
        role, status, created_at AT TIME ZONE 'UTC' as created_at, 
        last_login AT TIME ZONE 'UTC' as last_login, failed_login_attempts, 
        locked_until AT TIME ZONE 'UTC' as locked_until, must_change_password
      FROM users 
      ${whereClause}
      ORDER BY full_name ASC`,
      queryParams
    );

    const users = usersResult.rows;

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Admin users list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const {
      employee_code,
      email,
      full_name,
      department,
      designation,
      role,
      status,
      password,
      must_change_password = true
    } = body;

    // Validate required fields
    if (!employee_code || !email || !full_name || !department || !designation || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 OR employee_code = $2',
      [email, employee_code]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'User with this email or employee code already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const result = await query(
      `INSERT INTO users (
        employee_code, email, full_name, department, designation, 
        role, status, hashed_password, must_change_password, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) 
      RETURNING id, employee_code, email, full_name, department, designation, role, status`,
      [
        employee_code,
        email,
        full_name,
        department,
        designation,
        role || 'employee',
        status || 'active',
        hashedPassword,
        must_change_password
      ]
    );

    const newUser = result.rows[0];

    // Log audit event
    await logAuditEvent({
      user_id: authResult.user.id,
      action: 'admin_create_user',
      resource: 'user',
      details: {
        created_user_id: newUser.id,
        employee_code: newUser.employee_code,
        email: newUser.email
      },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({ 
      message: 'User created successfully',
      user: newUser 
    });
  } catch (error) {
    console.error('Admin create user error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}