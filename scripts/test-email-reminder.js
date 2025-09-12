/**
 * Direct test of email reminder functionality
 */

const { Pool } = require('pg');

async function testEmailReminder() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Testing email reminder directly...\n');
    
    // Get a test follow-up
    const result = await pool.query(
      `SELECT * FROM email_follow_ups 
       WHERE client_name LIKE 'Test Client%' 
       AND status = 'pending'
       ORDER BY created_at DESC 
       LIMIT 1`
    );
    
    if (result.rows.length === 0) {
      console.log('No test follow-up found. Create one first with:');
      console.log('node scripts/test-follow-up-dev.js --create-test');
      return;
    }
    
    const followUp = result.rows[0];
    console.log('Found test follow-up:');
    console.log(`  Client: ${followUp.client_name}`);
    console.log(`  Subject: ${followUp.email_subject}`);
    console.log(`  Follow-up #: ${followUp.follow_up_number}`);
    console.log(`  Due: ${followUp.due_date}`);
    console.log('');
    
    // Check if reminder was already sent today
    const historyResult = await pool.query(
      `SELECT * FROM email_follow_up_history 
       WHERE follow_up_id = $1 
       AND action = 'reminder_sent' 
       AND DATE(created_at) = CURRENT_DATE`,
      [followUp.id]
    );
    
    if (historyResult.rows.length > 0) {
      console.log('⚠️ Reminder already sent today. Clearing history for testing...');
      await pool.query(
        `DELETE FROM email_follow_up_history 
         WHERE follow_up_id = $1 
         AND action = 'reminder_sent' 
         AND DATE(created_at) = CURRENT_DATE`,
        [followUp.id]
      );
      console.log('History cleared.\n');
    }
    
    console.log('Attempting to queue reminder email...');
    
    // Import the service
    const { FollowUpService } = require('../.next/server/chunks/[root of the server]__f97ab3._.js');
    
    // Send the reminder
    const sent = await FollowUpService.sendReminderEmail(followUp);
    
    if (sent) {
      console.log('✅ Reminder queued successfully!');
      
      // Check email queue
      const queueResult = await pool.query(
        `SELECT * FROM email_queue 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [followUp.user_id]
      );
      
      if (queueResult.rows.length > 0) {
        const email = queueResult.rows[0];
        console.log(`\nEmail in queue:`);
        console.log(`  To: ${email.to_email}`);
        console.log(`  Subject: ${email.subject}`);
        console.log(`  Status: ${email.status}`);
      }
    } else {
      console.log('❌ Failed to queue reminder');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nNote: This test needs the Next.js server to be running.');
    console.log('The service modules are compiled by Next.js.');
  } finally {
    await pool.end();
  }
}

testEmailReminder();