#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function debugReminder() {
  console.log('🔍 Debugging reminder issue for Johan Sebastian\n');
  
  // 1. Get the follow-up
  const followUpResult = await pool.query(
    `SELECT * FROM email_follow_ups WHERE client_name = 'Johan Sebastian' AND status = 'pending'`
  );
  
  if (followUpResult.rows.length === 0) {
    console.log('❌ No pending follow-up found');
    return;
  }
  
  const followUp = followUpResult.rows[0];
  console.log('✅ Found follow-up:', {
    id: followUp.id,
    user_id: followUp.user_id,
    follow_up_number: followUp.follow_up_number,
    due_date: followUp.due_date,
    is_overdue: new Date(followUp.due_date) < new Date()
  });
  
  // 2. Check user preferences
  const prefResult = await pool.query(
    `SELECT * FROM notification_preferences WHERE user_id = $1`,
    [followUp.user_id]
  );
  
  console.log('\n📧 User preferences:', prefResult.rows[0] || 'No preferences found');
  
  // 3. Try to create a notification
  try {
    const notificationResult = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [
        followUp.user_id,
        'follow_up_reminder',
        `Follow-up Reminder: ${followUp.client_name}`,
        `Follow-up reminder for ${followUp.client_name} - 2nd attempt`
      ]
    );
    
    console.log('\n✅ Notification created:', notificationResult.rows[0].id);
    
    // 4. Try to queue email
    const emailResult = await pool.query(
      `INSERT INTO email_queue (
        notification_id, user_id, to_email, subject, html_content, status, scheduled_for
      ) VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
      RETURNING id`,
      [
        notificationResult.rows[0].id,
        followUp.user_id,
        'damir@TME-Services.com',
        'Test Follow-up Reminder',
        '<html><body><p>This is a test reminder email for Johan Sebastian.</p></body></html>'
      ]
    );
    
    console.log('✅ Email queued:', emailResult.rows[0].id);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
  
  pool.end();
}

debugReminder();