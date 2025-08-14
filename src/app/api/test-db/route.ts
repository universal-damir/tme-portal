import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Test 1: Check current database
    const dbResult = await query('SELECT current_database() as db');
    
    // Test 2: Check search path
    const pathResult = await query('SHOW search_path');
    
    // Test 3: List all tables
    const tablesResult = await query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    // Test 4: Try to query applications table
    let applicationsTest = { success: false, error: null, count: 0 };
    try {
      const appResult = await query('SELECT COUNT(*) as count FROM applications');
      applicationsTest = { success: true, error: null, count: appResult.rows[0].count };
    } catch (error: any) {
      applicationsTest = { success: false, error: error.message, count: 0 };
    }
    
    // Test 5: Try to query user_todos table
    let todosTest = { success: false, error: null, count: 0 };
    try {
      const todoResult = await query('SELECT COUNT(*) as count FROM user_todos');
      todosTest = { success: true, error: null, count: todoResult.rows[0].count };
    } catch (error: any) {
      todosTest = { success: false, error: error.message, count: 0 };
    }
    
    return NextResponse.json({
      database: dbResult.rows[0].db,
      search_path: pathResult.rows[0].search_path,
      tables: tablesResult.rows.map(r => r.tablename),
      tests: {
        applications: applicationsTest,
        user_todos: todosTest
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}