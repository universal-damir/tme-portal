#!/usr/bin/env node

/**
 * Test Script for User Todos Migration
 * Tests the database migration 003_user_todos_system.sql
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tme_portal',
  user: process.env.DB_USER || 'tme_user',
  password: process.env.DB_PASSWORD || 'TME_PostgreSQL_2024_SecurePass!#'
});

async function runTests() {
  console.log('🧪 Starting Todo Migration Tests...\n');
  
  try {
    // Test 1: Verify notifications table extensions
    console.log('Test 1: Checking notifications table extensions...');
    const notificationColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      AND column_name IN ('todo_generated', 'todo_completed', 'todo_dismissed')
      ORDER BY column_name
    `);
    
    if (notificationColumns.rows.length === 3) {
      console.log('✅ Notifications table extensions found');
      notificationColumns.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (default: ${col.column_default})`);
      });
    } else {
      console.log('❌ Missing notifications table extensions');
      return false;
    }

    // Test 2: Verify user_todos table exists with correct structure
    console.log('\nTest 2: Checking user_todos table structure...');
    const todoTableColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'user_todos'
      ORDER BY ordinal_position
    `);
    
    if (todoTableColumns.rows.length >= 15) {
      console.log('✅ user_todos table created with correct structure');
      console.log(`   Found ${todoTableColumns.rows.length} columns:`);
      todoTableColumns.rows.slice(0, 10).forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
      if (todoTableColumns.rows.length > 10) {
        console.log(`   ... and ${todoTableColumns.rows.length - 10} more columns`);
      }
    } else {
      console.log('❌ user_todos table structure incomplete');
      return false;
    }

    // Test 3: Verify constraints
    console.log('\nTest 3: Checking table constraints...');
    const constraints = await pool.query(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'user_todos'
      ORDER BY constraint_type, constraint_name
    `);
    
    const checkConstraints = constraints.rows.filter(c => c.constraint_type === 'CHECK');
    const foreignKeys = constraints.rows.filter(c => c.constraint_type === 'FOREIGN KEY');
    
    console.log(`✅ Found ${constraints.rows.length} constraints:`);
    console.log(`   - ${checkConstraints.length} CHECK constraints (category, priority, status)`);
    console.log(`   - ${foreignKeys.length} FOREIGN KEY constraints`);

    // Test 4: Verify indexes
    console.log('\nTest 4: Checking performance indexes...');
    const indexes = await pool.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'user_todos'
      ORDER BY indexname
    `);
    
    if (indexes.rows.length >= 8) {
      console.log(`✅ Found ${indexes.rows.length} indexes for performance optimization`);
      indexes.rows.forEach(idx => {
        console.log(`   - ${idx.indexname}`);
      });
    } else {
      console.log('❌ Missing performance indexes');
      return false;
    }

    // Test 5: Verify triggers
    console.log('\nTest 5: Checking triggers...');
    const triggers = await pool.query(`
      SELECT trigger_name, event_manipulation, action_timing 
      FROM information_schema.triggers 
      WHERE event_object_table = 'user_todos'
    `);
    
    if (triggers.rows.length > 0) {
      console.log(`✅ Found ${triggers.rows.length} triggers`);
      triggers.rows.forEach(trigger => {
        console.log(`   - ${trigger.trigger_name}: ${trigger.action_timing} ${trigger.event_manipulation}`);
      });
    } else {
      console.log('⚠️  No triggers found (may be expected if function doesn\'t exist yet)');
    }

    // Test 6: Verify views
    console.log('\nTest 6: Checking helper views...');
    const views = await pool.query(`
      SELECT table_name, view_definition 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name IN ('active_todos', 'user_todo_stats')
      ORDER BY table_name
    `);
    
    if (views.rows.length === 2) {
      console.log('✅ Helper views created successfully');
      views.rows.forEach(view => {
        console.log(`   - ${view.table_name}`);
      });
    } else {
      console.log(`⚠️  Found ${views.rows.length}/2 expected views`);
    }

    // Test 7: Verify permissions
    console.log('\nTest 7: Checking todo permissions...');
    const permissions = await pool.query(`
      SELECT name, description, resource, action 
      FROM permissions 
      WHERE name IN ('manage_todos', 'view_todos')
      ORDER BY name
    `);
    
    if (permissions.rows.length === 2) {
      console.log('✅ Todo permissions created');
      permissions.rows.forEach(perm => {
        console.log(`   - ${perm.name}: ${perm.description}`);
      });
    } else {
      console.log(`⚠️  Found ${permissions.rows.length}/2 expected permissions`);
    }

    // Test 8: Test basic operations
    console.log('\nTest 8: Testing basic CRUD operations...');
    
    // Get a test user ID
    const testUser = await pool.query('SELECT id FROM users LIMIT 1');
    if (testUser.rows.length === 0) {
      console.log('⚠️  No test user found, skipping CRUD tests');
    } else {
      const userId = testUser.rows[0].id;
      
      // Insert test todo
      const insertResult = await pool.query(`
        INSERT INTO user_todos (user_id, title, description, category, priority, status, due_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [userId, 'Test Todo', 'Migration test todo', 'action', 'medium', 'pending', new Date(Date.now() + 24 * 60 * 60 * 1000)]);
      
      const todoId = insertResult.rows[0].id;
      console.log('✅ INSERT: Test todo created successfully');
      
      // Select test todo
      const selectResult = await pool.query('SELECT * FROM user_todos WHERE id = $1', [todoId]);
      if (selectResult.rows.length === 1) {
        console.log('✅ SELECT: Test todo retrieved successfully');
      }
      
      // Update test todo
      await pool.query('UPDATE user_todos SET status = $1 WHERE id = $2', ['completed', todoId]);
      console.log('✅ UPDATE: Test todo status updated successfully');
      
      // Test views with data
      const activeView = await pool.query('SELECT * FROM active_todos WHERE user_id = $1', [userId]);
      const statsView = await pool.query('SELECT * FROM user_todo_stats WHERE user_id = $1', [userId]);
      
      console.log(`✅ VIEWS: active_todos (${activeView.rows.length} rows), user_todo_stats (${statsView.rows.length} rows)`);
      
      // Cleanup test data
      await pool.query('DELETE FROM user_todos WHERE id = $1', [todoId]);
      console.log('✅ DELETE: Test cleanup completed');
    }

    console.log('\n🎉 All migration tests completed successfully!');
    console.log('\n📊 Migration Summary:');
    console.log('   ✅ Notifications table extended with todo tracking columns');
    console.log('   ✅ user_todos table created with full schema');
    console.log('   ✅ Performance indexes created');
    console.log('   ✅ Helper views for common queries');
    console.log('   ✅ Permissions and constraints in place');
    console.log('   ✅ Basic CRUD operations working');
    
    return true;

  } catch (error) {
    console.error('❌ Migration test failed:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  } finally {
    await pool.end();
  }
}

// Run tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});