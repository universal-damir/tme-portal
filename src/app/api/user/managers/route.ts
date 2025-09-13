/**
 * API endpoint to fetch managers/supervisors in the organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { verifySession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';

    // Fetch all active users (anyone can be selected for escalation)
    // Exclude the current user to prevent self-escalation
    let queryText = `
      SELECT 
        id, 
        full_name, 
        email, 
        employee_code,
        department,
        designation,
        role,
        is_manager
       FROM users 
       WHERE id != $1
       AND status = 'active'
    `;
    
    const params: any[] = [session.user.id];
    
    // Add search filter if provided (min 2 characters)
    if (searchTerm && searchTerm.length >= 2) {
      queryText += ` AND (
        LOWER(full_name) LIKE LOWER($2) OR
        LOWER(email) LIKE LOWER($2) OR
        LOWER(employee_code) LIKE LOWER($2)
      )`;
      params.push(`%${searchTerm}%`);
      queryText += ` ORDER BY 
        CASE WHEN is_manager = true OR role = 'manager' OR role = 'admin' THEN 0 ELSE 1 END,
        full_name ASC
        LIMIT 50`;
    } else {
      // When no search term, show all users
      queryText += ` ORDER BY 
        CASE WHEN is_manager = true OR role = 'manager' OR role = 'admin' THEN 0 ELSE 1 END,
        full_name ASC`;
    }
    
    const result = await query(queryText, params);

    // Add photo URLs for each user
    const managersWithPhotos = result.rows.map((user: any) => ({
      ...user,
      photoUrl: `/api/photos/${encodeURIComponent(user.employee_code || '')}`
    }));

    return NextResponse.json({
      success: true,
      managers: managersWithPhotos
    });
  } catch (error) {
    console.error('Error fetching managers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch managers' 
      },
      { status: 500 }
    );
  }
}