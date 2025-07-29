#!/usr/bin/env node

/**
 * Test script for review system database migration
 * Run this to test the migration on your development database
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration (adjust for your Docker setup)
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'tme_portal',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: process.env.POSTGRES_PORT || 5432,
});

async function testMigration() {
  console.log('🧪 Testing Review System Migration...\n');
  
  try {
    // Read migration files
    const migrationPath = path.join(__dirname, '../database/migrations/001_review_system.sql');
    const rollbackPath = path.join(__dirname, '../database/migrations/001_review_system_rollback.sql');
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    const rollbackSQL = fs.readFileSync(rollbackPath, 'utf8');
    
    console.log('✅ Migration files loaded successfully');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Run migration
    console.log('\n📦 Running migration...');
    await pool.query(migrationSQL);
    console.log('✅ Migration executed successfully');
    
    // Test that tables were created
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('applications', 'notifications')
    `);
    
    if (tablesResult.rows.length === 2) {
      console.log('✅ Tables created: applications, notifications');
    } else {
      throw new Error('Migration did not create expected tables');
    }
    
    // Test permissions were added
    const permissionsResult = await pool.query(`
      SELECT name FROM permissions 
      WHERE name IN ('review_applications', 'view_notifications', 'manage_notifications')
    `);
    
    if (permissionsResult.rows.length === 3) {
      console.log('✅ Permissions added successfully');
    } else {
      throw new Error('Migration did not add expected permissions');
    }
    
    // Test inserting sample data
    console.log('\n🧪 Testing data insertion...');
    
    // Get a test user ID (assuming users table has data)
    const userResult = await pool.query('SELECT id FROM users LIMIT 1');
    if (userResult.rows.length === 0) {
      console.log('⚠️  No users found - skipping data insertion test');
    } else {
      const testUserId = userResult.rows[0].id;
      
      // Insert test application
      const appResult = await pool.query(`
        INSERT INTO applications (type, title, form_data, submitted_by_id)
        VALUES ('golden-visa', 'Test Golden Visa Application', '{"test": true}', $1)
        RETURNING id
      `, [testUserId]);
      
      const appId = appResult.rows[0].id;
      console.log('✅ Test application created');
      
      // Insert test notification
      await pool.query(`
        INSERT INTO notifications (user_id, type, title, message, application_id)
        VALUES ($1, 'review_requested', 'Test Notification', 'Test message', $2)
      `, [testUserId, appId]);
      
      console.log('✅ Test notification created');
      
      // Clean up test data
      await pool.query('DELETE FROM notifications WHERE application_id = $1', [appId]);
      await pool.query('DELETE FROM applications WHERE id = $1', [appId]);
      console.log('✅ Test data cleaned up');
    }
    
    // Test rollback
    console.log('\n🔄 Testing rollback...');
    await pool.query(rollbackSQL);
    console.log('✅ Rollback executed successfully');
    
    // Verify tables were dropped
    const rollbackTablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('applications', 'notifications')
    `);
    
    if (rollbackTablesResult.rows.length === 0) {
      console.log('✅ Tables removed successfully');
    } else {
      throw new Error('Rollback did not remove tables');
    }
    
    // Re-run migration for final state
    console.log('\n🏁 Re-applying migration for final state...');
    await pool.query(migrationSQL);
    console.log('✅ Migration re-applied successfully');
    
    console.log('\n🎉 All tests passed! Review system migration is ready for production.');
    console.log('\n📋 Next steps:');
    console.log('  1. Run migration on development: npm run migrate:review-system');
    console.log('  2. Proceed to Phase 2: Notification System');
    
  } catch (error) {
    console.error('\n❌ Migration test failed:', error.message);
    console.error('\n🔄 Attempting cleanup...');
    
    try {
      const rollbackPath = path.join(__dirname, '../database/migrations/001_review_system_rollback.sql');
      const rollbackSQL = fs.readFileSync(rollbackPath, 'utf8');
      await pool.query(rollbackSQL);
      console.log('✅ Cleanup completed');
    } catch (cleanupError) {
      console.error('❌ Cleanup failed:', cleanupError.message);
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await pool.end();
  process.exit(0);
});

testMigration();