import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth-middleware';
import { query } from '@/lib/database';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const authority = searchParams.get('authority');
    const city = searchParams.get('city');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build dynamic query
    const whereConditions = [];
    const queryParams = [];
    let paramIndex = 1;

    if (authority && authority !== 'all') {
      whereConditions.push(`registered_authority = $${paramIndex++}`);
      queryParams.push(authority);
    }

    if (city && city !== 'all') {
      whereConditions.push(`city = $${paramIndex++}`);
      queryParams.push(city);
    }

    if (status && status !== 'all') {
      whereConditions.push(`status = $${paramIndex++}`);
      queryParams.push(status);
    }

    if (search) {
      whereConditions.push(`(
        company_name ILIKE $${paramIndex} OR 
        company_name_short ILIKE $${paramIndex} OR 
        company_code ILIKE $${paramIndex} OR
        management_name ILIKE $${paramIndex} OR
        management_email ILIKE $${paramIndex++}
      )`);
      queryParams.push(`%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const clientsResult = await query(
      `SELECT 
        id, company_code, company_name, company_name_short, registered_authority,
        management_name, management_email, city, po_box, vat_trn, status, notes,
        created_at AT TIME ZONE 'UTC' as created_at, 
        updated_at AT TIME ZONE 'UTC' as updated_at,
        created_by, updated_by
      FROM clients 
      ${whereClause}
      ORDER BY company_code ASC`,
      queryParams
    );

    const clients = clientsResult.rows;

    // Get unique cities and authorities for filters
    const authoritiesResult = await query(
      'SELECT DISTINCT registered_authority FROM clients ORDER BY registered_authority'
    );
    const citiesResult = await query(
      'SELECT DISTINCT city FROM clients ORDER BY city'
    );

    return NextResponse.json({ 
      clients,
      authorities: authoritiesResult.rows.map(row => row.registered_authority),
      cities: citiesResult.rows.map(row => row.city)
    });
  } catch (error) {
    console.error('Admin clients list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
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

    // Validate required fields
    if (!company_code || !company_name || !company_name_short || !registered_authority || 
        !management_name || !management_email || !city) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(management_email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if client already exists
    const existingClient = await query(
      'SELECT id FROM clients WHERE company_code = $1',
      [company_code]
    );

    if (existingClient.rows.length > 0) {
      return NextResponse.json(
        { error: 'Client with this company code already exists' },
        { status: 400 }
      );
    }

    // Create client
    const result = await query(
      `INSERT INTO clients (
        company_code, company_name, company_name_short, registered_authority,
        management_name, management_email, city, po_box, vat_trn, status, notes,
        created_by, updated_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12, NOW(), NOW()) 
      RETURNING *`,
      [
        company_code,
        company_name,
        company_name_short,
        registered_authority,
        management_name,
        management_email,
        city,
        po_box || null,
        vat_trn || null,
        status || 'active',
        notes || null,
        authResult.user.id
      ]
    );

    const newClient = result.rows[0];

    // Log audit event
    await logAuditEvent({
      user_id: authResult.user.id,
      action: 'admin_create_client',
      resource: 'client',
      resource_id: newClient.id.toString(),
      details: {
        company_code: newClient.company_code,
        company_name: newClient.company_name,
        registered_authority: newClient.registered_authority
      },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({ 
      message: 'Client created successfully',
      client: newClient 
    });
  } catch (error) {
    console.error('Admin create client error:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}