/**
 * Development Test Script for Follow-up Reminders
 * This script helps test the 1/2/3 minute follow-up system in development
 * 
 * Usage: node scripts/test-follow-up-dev.js
 */

const { Pool } = require('pg');

async function testFollowUpDev() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  console.log('🧪 Follow-up Reminder Development Test');
  console.log('=====================================\n');
  console.log('In development mode, follow-ups are due at:');
  console.log('  • 1st follow-up: 1 minute after email sent');
  console.log('  • 2nd follow-up: 2 minutes after snooze');
  console.log('  • 3rd follow-up: 3 minutes after snooze');
  console.log('  • Manager escalation: 1 minute after 3rd follow-up is overdue\n');

  try {
    // Check current follow-ups
    const followUpsResult = await pool.query(
      `SELECT 
        ef.id,
        ef.client_name,
        ef.follow_up_number,
        ef.status,
        ef.sent_date,
        ef.due_date,
        u.full_name as user_name,
        CASE 
          WHEN ef.due_date < NOW() THEN 'OVERDUE'
          WHEN ef.due_date <= NOW() + INTERVAL '1 minute' THEN 'DUE SOON'
          ELSE 'PENDING'
        END as status_label
       FROM email_follow_ups ef
       JOIN users u ON ef.user_id = u.id
       WHERE ef.status = 'pending'
       ORDER BY ef.due_date ASC
       LIMIT 10`
    );

    if (followUpsResult.rows.length > 0) {
      console.log('📋 Current Pending Follow-ups:\n');
      followUpsResult.rows.forEach(f => {
        const dueIn = Math.round((new Date(f.due_date) - new Date()) / 1000 / 60);
        const attemptText = f.follow_up_number === 1 ? '1st' : 
                           f.follow_up_number === 2 ? '2nd' : '3rd';
        console.log(`${f.status_label === 'OVERDUE' ? '🔴' : f.status_label === 'DUE SOON' ? '🟡' : '⚪'} ${f.client_name} (${attemptText} attempt)`);
        console.log(`   User: ${f.user_name}`);
        console.log(`   Due: ${new Date(f.due_date).toLocaleString()} (${dueIn > 0 ? `in ${dueIn} min` : `${Math.abs(dueIn)} min ago`})`);
        console.log(`   ID: ${f.id}\n`);
      });
    } else {
      console.log('ℹ️ No pending follow-ups found\n');
    }

    // Show how to trigger reminders
    console.log('=====================================');
    console.log('📧 To Test Email Reminders:\n');
    console.log('1. Trigger reminder check (runs every minute in dev):');
    console.log('   curl http://localhost:3000/api/cron/send-follow-up-reminders\n');
    
    console.log('2. Trigger escalation check:');
    console.log('   curl http://localhost:3000/api/cron/escalate-follow-ups\n');
    
    console.log('3. Check email queue:');
    console.log('   psql $DATABASE_URL -c "SELECT * FROM email_queue WHERE created_at > NOW() - INTERVAL \'10 minutes\' ORDER BY created_at DESC;"\n');

    // Check if any reminders were sent recently
    const recentRemindersResult = await pool.query(
      `SELECT 
        h.follow_up_id,
        h.action,
        h.notes,
        h.created_at,
        ef.client_name
       FROM email_follow_up_history h
       JOIN email_follow_ups ef ON h.follow_up_id = ef.id
       WHERE h.action IN ('reminder_sent', 'escalated')
       AND h.created_at > NOW() - INTERVAL '10 minutes'
       ORDER BY h.created_at DESC
       LIMIT 5`
    );

    if (recentRemindersResult.rows.length > 0) {
      console.log('📨 Recent Reminder Activity (last 10 min):\n');
      recentRemindersResult.rows.forEach(r => {
        const timeAgo = Math.round((new Date() - new Date(r.created_at)) / 1000 / 60);
        console.log(`• ${r.client_name}: ${r.notes} (${timeAgo} min ago)`);
      });
      console.log('');
    }

    // Create a test follow-up if requested
    const args = process.argv.slice(2);
    if (args.includes('--create-test')) {
      console.log('=====================================');
      console.log('Creating test follow-up...\n');
      
      // Get first user
      const userResult = await pool.query(
        `SELECT id, full_name FROM users LIMIT 1`
      );
      
      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        const testClientName = `Test Client ${new Date().toLocaleTimeString()}`;
        
        await pool.query(
          `INSERT INTO email_follow_ups (
            user_id, 
            email_subject, 
            client_name, 
            client_email,
            follow_up_number,
            sent_date, 
            due_date, 
            status
          ) VALUES ($1, $2, $3, $4, 1, NOW(), NOW() + INTERVAL '1 minute', 'pending')`,
          [
            user.id,
            'Test Follow-up Email',
            testClientName,
            'test@example.com'
          ]
        );
        
        console.log(`✅ Created test follow-up for "${testClientName}"`);
        console.log(`   Assigned to: ${user.full_name}`);
        console.log(`   Due in: 1 minute`);
        console.log(`   Run the reminder cron in 1 minute to test email sending\n`);
      }
    } else {
      console.log('💡 Tip: Run with --create-test to create a test follow-up\n');
      console.log('   node scripts/test-follow-up-dev.js --create-test\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

// Run the test
testFollowUpDev();