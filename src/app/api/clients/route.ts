import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/database';

export async function GET(req: NextRequest) {
  try {
    // Get session ID from cookie
    const sessionId = req.cookies.get('session')?.value;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Unauthorized - No session' },
        { status: 401 }
      );
    }

    // Get session data
    const sessionData = await getSession(sessionId);
    
    if (!sessionData || !sessionData.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid session' },
        { status: 401 }
      );
    }

    // Check if user has access to CIT Return Letters or related features
    const user = sessionData.user;
    const userDepartment = user.department;
    const userRole = user.role;
    const userEmployeeCode = user.employee_code;
    
    // Check CIT Return Letters access permissions
    const allowedDepartments = ['IT', 'Management'];
    const allowedEmployeeCodes = ['19 DS', '38 TZ', '33 MK', '42 RJ', '58 YF', '80 RoJ', '86 MA', '92 CM', '112 NM'];
    
    const hasAccess = userRole === 'admin' || 
                     allowedDepartments.includes(userDepartment) || 
                     allowedEmployeeCodes.includes(userEmployeeCode);
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit') || '100';

    // Build dynamic query
    const whereConditions = [];
    const queryParams = [];
    let paramIndex = 1;

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
        management_first_name ILIKE $${paramIndex} OR
        management_last_name ILIKE $${paramIndex} OR
        management_email ILIKE $${paramIndex} OR
        city ILIKE $${paramIndex} OR
        country ILIKE $${paramIndex++}
      )`);
      queryParams.push(`%${search}%`);
    }

    // Add limit
    queryParams.push(parseInt(limit));

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const clientsResult = await query(
      `SELECT 
        id, company_code, company_name, company_name_short, registered_authority,
        management_name, management_first_name, management_last_name, management_email, 
        city, country, po_box, vat_trn, status, notes,
        created_at AT TIME ZONE 'UTC' as created_at, 
        updated_at AT TIME ZONE 'UTC' as updated_at
      FROM clients 
      ${whereClause}
      ORDER BY company_code ASC
      LIMIT $${paramIndex}`,
      queryParams
    );

    const clients = clientsResult.rows;

    return NextResponse.json({ 
      clients,
      success: true
    });
  } catch (error) {
    console.error('Clients list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}