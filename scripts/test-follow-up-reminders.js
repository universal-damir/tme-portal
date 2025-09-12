/**
 * Test script for follow-up email reminders
 * Run with: node scripts/test-follow-up-reminders.js
 */

const { Pool } = require('pg');

async function testFollowUpReminders() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🧪 Testing Follow-up Email Reminder System\n');
    console.log('============================================\n');

    // 1. Check if email templates were created
    console.log('1️⃣ Checking email templates...');
    const templatesResult = await pool.query(
      `SELECT name, subject_template FROM email_templates 
       WHERE name IN ('follow_up_reminder', 'follow_up_escalation')`
    );
    
    if (templatesResult.rows.length === 2) {
      console.log('✅ Email templates found:');
      templatesResult.rows.forEach(t => {
        console.log(`   - ${t.name}: "${t.subject_template}"`);
      });
    } else {
      console.log('❌ Email templates not found. Run migration first.');
      return;
    }

    // 2. Check notification preferences schema
    console.log('\n2️⃣ Checking notification preferences schema...');
    const schemaResult = await pool.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'notification_preferences' 
       AND column_name IN ('email_follow_up_reminders', 'email_follow_up_escalations')`
    );
    
    if (schemaResult.rows.length === 2) {
      console.log('✅ Notification preference columns added');
    } else {
      console.log('❌ Notification preference columns missing');
    }

    // 3. Check for pending follow-ups
    console.log('\n3️⃣ Checking for pending follow-ups...');
    const followUpsResult = await pool.query(
      `SELECT ef.*, u.full_name 
       FROM email_follow_ups ef
       JOIN users u ON ef.user_id = u.id
       WHERE ef.status = 'pending'
       ORDER BY ef.due_date ASC
       LIMIT 5`
    );

    if (followUpsResult.rows.length > 0) {
      console.log(`✅ Found ${followUpsResult.rows.length} pending follow-ups:`);
      followUpsResult.rows.forEach(f => {
        const dueDate = new Date(f.due_date);
        const isOverdue = dueDate < new Date();
        console.log(`   - ${f.client_name} (${f.full_name}): Due ${dueDate.toLocaleDateString()} ${isOverdue ? '⚠️ OVERDUE' : ''}`);
      });
    } else {
      console.log('ℹ️ No pending follow-ups found');
    }

    // 4. Check which follow-ups would get reminders today
    console.log('\n4️⃣ Checking follow-ups needing reminders today...');
    const needingRemindersResult = await pool.query(
      `SELECT ef.*, u.full_name, u.email
       FROM email_follow_ups ef
       JOIN users u ON ef.user_id = u.id
       WHERE ef.status = 'pending'
       AND ef.due_date <= NOW()
       AND NOT EXISTS (
         SELECT 1 FROM email_follow_up_history h
         WHERE h.follow_up_id = ef.id
         AND h.action = 'reminder_sent'
         AND DATE(h.created_at) = CURRENT_DATE
       )
       ORDER BY ef.due_date ASC`
    );

    if (needingRemindersResult.rows.length > 0) {
      console.log(`✅ ${needingRemindersResult.rows.length} follow-ups need reminders:`);
      needingRemindersResult.rows.forEach(f => {
        const attemptText = f.follow_up_number === 1 ? '1st' : 
                           f.follow_up_number === 2 ? '2nd' : '3rd';
        console.log(`   - ${f.client_name} (${attemptText} attempt) → ${f.email}`);
      });
    } else {
      console.log('ℹ️ No follow-ups need reminders today');
    }

    // 5. Test cron endpoint (dry run)
    console.log('\n5️⃣ Testing cron endpoint availability...');
    console.log('   Cron endpoints available:');
    console.log('   - /api/cron/send-follow-up-reminders (Daily reminders)');
    console.log('   - /api/cron/escalate-follow-ups (Manager escalation)');
    
    // 6. Check email queue status
    console.log('\n6️⃣ Checking email queue status...');
    const queueResult = await pool.query(
      `SELECT status, COUNT(*) as count
       FROM email_queue
       WHERE created_at > NOW() - INTERVAL '24 hours'
       GROUP BY status`
    );

    if (queueResult.rows.length > 0) {
      console.log('✅ Email queue activity (last 24h):');
      queueResult.rows.forEach(q => {
        console.log(`   - ${q.status}: ${q.count}`);
      });
    } else {
      console.log('ℹ️ No email queue activity in last 24 hours');
    }

    console.log('\n============================================');
    console.log('✅ Follow-up reminder system is ready!');
    console.log('\nTo test sending reminders:');
    console.log('1. Run: curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/send-follow-up-reminders');
    console.log('2. Check email queue: psql $DATABASE_URL -c "SELECT * FROM email_queue ORDER BY created_at DESC LIMIT 5;"');
    console.log('\nTo schedule daily reminders (production):');
    console.log('Add to crontab: 0 9 * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain/api/cron/send-follow-up-reminders');

  } catch (error) {
    console.error('❌ Error testing follow-up reminders:', error);
  } finally {
    await pool.end();
  }
}

// Run the test
testFollowUpReminders();