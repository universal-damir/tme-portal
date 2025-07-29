// Clear old notifications script
// Run this to remove old test notifications

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function clearNotifications() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🗑️  Clearing old notifications...');
    
    // Delete all notifications older than 10 minutes
    const result = await pool.query(`
      DELETE FROM notifications 
      WHERE created_at < NOW() - INTERVAL '10 minutes'
      RETURNING id, title, created_at
    `);

    console.log(`✅ Deleted ${result.rowCount} old notifications`);
    
    if (result.rows.length > 0) {
      console.log('Deleted notifications:');
      result.rows.forEach(row => {
        console.log(`  - ${row.id}: "${row.title}" (${row.created_at})`);
      });
    }

    // Show remaining notifications
    const remaining = await pool.query(`
      SELECT id, title, created_at, is_read 
      FROM notifications 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log(`\n📋 Remaining notifications: ${remaining.rowCount}`);
    if (remaining.rows.length > 0) {
      remaining.rows.forEach(row => {
        console.log(`  - ${row.title} (${row.created_at}) ${row.is_read ? '[READ]' : '[UNREAD]'}`);
      });
    }

  } catch (error) {
    console.error('❌ Error clearing notifications:', error);
  } finally {
    await pool.end();
  }
}

clearNotifications();