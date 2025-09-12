#!/usr/bin/env node

/**
 * Comprehensive Email Follow-up Testing and Debugging Script
 * Tests the entire follow-up email flow in development mode
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

// Utility functions
const log = {
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.blue}${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}${colors.reset}`)
};

async function checkEnvironment() {
  log.header('1. ENVIRONMENT CHECK');
  
  const checks = {
    'DATABASE_URL': !!process.env.DATABASE_URL,
    'BREVO_SMTP_USER': !!process.env.BREVO_SMTP_USER,
    'BREVO_SMTP_PASSWORD': !!process.env.BREVO_SMTP_PASSWORD,
    'NEXT_PUBLIC_PORTAL_URL': !!process.env.NEXT_PUBLIC_PORTAL_URL,
    'NODE_ENV': process.env.NODE_ENV || 'not set'
  };

  let allPassed = true;
  for (const [key, value] of Object.entries(checks)) {
    if (key === 'NODE_ENV') {
      log.info(`${key}: ${value}`);
    } else if (value) {
      log.success(`${key} is set`);
    } else {
      log.error(`${key} is NOT set`);
      allPassed = false;
    }
  }

  // Check if in development mode
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                        process.env.NEXT_PUBLIC_PORTAL_URL?.includes('localhost');
  
  if (isDevelopment) {
    log.success('Running in DEVELOPMENT mode (minutes instead of days)');
  } else {
    log.warning('Running in PRODUCTION mode (days timing)');
  }

  return allPassed;
}

async function checkDatabase() {
  log.header('2. DATABASE TABLES CHECK');
  
  try {
    // Check if tables exist
    const tables = [
      'email_follow_ups',
      'email_follow_up_history',
      'email_templates',
      'notification_preferences',
      'notifications',
      'email_queue'
    ];

    for (const table of tables) {
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [table]
      );
      
      if (result.rows[0].exists) {
        log.success(`Table '${table}' exists`);
      } else {
        log.error(`Table '${table}' does NOT exist`);
      }
    }

    // Check email templates
    const templates = await pool.query(
      `SELECT name, is_active FROM email_templates 
       WHERE name IN ('follow_up_reminder', 'follow_up_escalation')`
    );
    
    if (templates.rows.length === 2) {
      log.success('Email templates are installed');
      templates.rows.forEach(t => {
        log.info(`  - ${t.name}: ${t.is_active ? 'active' : 'inactive'}`);
      });
    } else {
      log.error('Email templates are missing! Run migration 019');
    }

  } catch (error) {
    log.error(`Database error: ${error.message}`);
    return false;
  }
  
  return true;
}

async function getOrCreateTestUser() {
  log.header('3. TEST USER SETUP');
  
  try {
    // First, try to find an existing user
    let result = await pool.query(
      `SELECT id, full_name, email FROM users LIMIT 1`
    );
    
    if (result.rows.length === 0) {
      log.error('No users found in database');
      return null;
    }
    
    const user = result.rows[0];
    log.success(`Using user: ${user.full_name} (ID: ${user.id}, Email: ${user.email})`);
    
    // Check user's notification preferences
    const prefResult = await pool.query(
      `SELECT * FROM notification_preferences WHERE user_id = $1`,
      [user.id]
    );
    
    if (prefResult.rows.length === 0) {
      // Create default preferences
      await pool.query(
        `INSERT INTO notification_preferences (user_id, email_enabled, email_follow_up_reminders) 
         VALUES ($1, true, true)
         ON CONFLICT (user_id) DO UPDATE 
         SET email_enabled = true, email_follow_up_reminders = true`,
        [user.id]
      );
      log.success('Created notification preferences with email enabled');
    } else {
      const prefs = prefResult.rows[0];
      if (!prefs.email_enabled || !prefs.email_follow_up_reminders) {
        // Enable email notifications
        await pool.query(
          `UPDATE notification_preferences 
           SET email_enabled = true, email_follow_up_reminders = true 
           WHERE user_id = $1`,
          [user.id]
        );
        log.success('Enabled email notifications for user');
      } else {
        log.success('Email notifications already enabled');
      }
    }
    
    return user;
  } catch (error) {
    log.error(`User setup error: ${error.message}`);
    return null;
  }
}

async function createTestFollowUp(user, minutesFromNow = 0) {
  log.header('4. CREATE TEST FOLLOW-UP');
  
  try {
    const sentDate = new Date();
    const dueDate = new Date();
    dueDate.setMinutes(dueDate.getMinutes() + minutesFromNow);
    
    const result = await pool.query(
      `INSERT INTO email_follow_ups (
        user_id, email_subject, client_name, client_email,
        follow_up_number, sent_date, due_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        user.id,
        `Test Email Subject - ${new Date().toISOString()}`,
        `Test Client ${Math.floor(Math.random() * 1000)}`,
        'test.client@example.com',
        1,
        sentDate,
        dueDate,
        'pending'
      ]
    );
    
    const followUp = result.rows[0];
    log.success(`Created follow-up ID: ${followUp.id}`);
    log.info(`  Subject: ${followUp.email_subject}`);
    log.info(`  Client: ${followUp.client_name}`);
    log.info(`  Due: ${followUp.due_date} (${minutesFromNow === 0 ? 'now' : `in ${minutesFromNow} minutes`})`);
    
    // Log in history
    await pool.query(
      `INSERT INTO email_follow_up_history (
        follow_up_id, user_id, action, new_status, notes
      ) VALUES ($1, $2, $3, $4, $5)`,
      [followUp.id, user.id, 'created', 'pending', 'Test follow-up created']
    );
    
    return followUp;
  } catch (error) {
    log.error(`Follow-up creation error: ${error.message}`);
    return null;
  }
}

async function checkDueFollowUps() {
  log.header('5. CHECK DUE FOLLOW-UPS');
  
  try {
    const result = await pool.query(
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
    
    if (result.rows.length === 0) {
      log.warning('No follow-ups are due for reminders');
    } else {
      log.success(`Found ${result.rows.length} follow-ups needing reminders:`);
      result.rows.forEach(f => {
        const overdue = new Date(f.due_date) < new Date();
        log.info(`  - ${f.client_name}: ${f.follow_up_number}${f.follow_up_number === 1 ? 'st' : f.follow_up_number === 2 ? 'nd' : 'rd'} attempt ${overdue ? '(OVERDUE)' : ''}`);
        log.info(`    User: ${f.full_name} (${f.email})`);
      });
    }
    
    return result.rows;
  } catch (error) {
    log.error(`Error checking due follow-ups: ${error.message}`);
    return [];
  }
}

async function triggerReminders() {
  log.header('6. TRIGGER EMAIL REMINDERS');
  
  try {
    const url = process.env.NEXT_PUBLIC_PORTAL_URL || 'http://localhost:3000';
    const cronUrl = `${url}/api/cron/send-follow-up-reminders`;
    
    log.info(`Calling: ${cronUrl}`);
    
    const response = await fetch(cronUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET || ''}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      log.success('Reminder cron job executed successfully');
      if (data.results) {
        log.info(`  Total follow-ups: ${data.results.total_follow_ups}`);
        log.info(`  Reminders sent: ${data.results.reminders_sent}`);
        log.info(`  Reminders skipped: ${data.results.reminders_skipped}`);
        if (data.results.clients_reminded?.length > 0) {
          log.info(`  Clients reminded: ${data.results.clients_reminded.join(', ')}`);
        }
        if (data.results.errors?.length > 0) {
          data.results.errors.forEach(err => log.error(`  Error: ${err}`));
        }
      }
    } else {
      log.error(`Cron job failed: ${data.error}`);
    }
    
    return data.success;
  } catch (error) {
    log.error(`Error triggering reminders: ${error.message}`);
    return false;
  }
}

async function checkEmailQueue() {
  log.header('7. CHECK EMAIL QUEUE');
  
  try {
    const result = await pool.query(
      `SELECT eq.*, u.full_name
       FROM email_queue eq
       JOIN users u ON eq.user_id = u.id
       WHERE eq.created_at > NOW() - INTERVAL '10 minutes'
       ORDER BY eq.created_at DESC
       LIMIT 10`
    );
    
    if (result.rows.length === 0) {
      log.warning('No emails in queue from last 10 minutes');
    } else {
      log.success(`Found ${result.rows.length} emails in queue:`);
      result.rows.forEach(email => {
        const statusColor = email.status === 'sent' ? colors.green : 
                           email.status === 'failed' ? colors.red : 
                           colors.yellow;
        log.info(`  ${statusColor}[${email.status}]${colors.reset} ${email.subject}`);
        log.info(`    To: ${email.to_email} (${email.full_name})`);
        if (email.last_error) {
          log.error(`    Error: ${email.last_error}`);
        }
      });
    }
    
    return result.rows;
  } catch (error) {
    log.error(`Error checking email queue: ${error.message}`);
    return [];
  }
}

async function processEmailQueue() {
  log.header('8. PROCESS EMAIL QUEUE');
  
  try {
    // Import the notification email service
    const { NotificationEmailService } = require('../src/lib/services/notification-email');
    
    log.info('Processing pending emails...');
    await NotificationEmailService.processQueue(10);
    
    // Check queue status after processing
    const result = await pool.query(
      `SELECT status, COUNT(*) as count
       FROM email_queue
       WHERE created_at > NOW() - INTERVAL '10 minutes'
       GROUP BY status`
    );
    
    log.success('Email queue processed. Current status:');
    result.rows.forEach(row => {
      log.info(`  ${row.status}: ${row.count}`);
    });
    
    return true;
  } catch (error) {
    log.error(`Error processing email queue: ${error.message}`);
    log.warning('Make sure the Next.js server is running');
    return false;
  }
}

async function checkHistory() {
  log.header('9. CHECK FOLLOW-UP HISTORY');
  
  try {
    const result = await pool.query(
      `SELECT h.*, ef.client_name
       FROM email_follow_up_history h
       JOIN email_follow_ups ef ON h.follow_up_id = ef.id
       WHERE h.created_at > NOW() - INTERVAL '10 minutes'
       ORDER BY h.created_at DESC
       LIMIT 20`
    );
    
    if (result.rows.length === 0) {
      log.warning('No recent history entries');
    } else {
      log.success(`Recent history (last 10 minutes):`);
      result.rows.forEach(h => {
        log.info(`  [${h.action}] ${h.client_name}: ${h.notes || 'No notes'}`);
      });
    }
  } catch (error) {
    log.error(`Error checking history: ${error.message}`);
  }
}

async function runFullTest() {
  console.log(`
${colors.magenta}
╔════════════════════════════════════════════════════════════╗
║     EMAIL FOLLOW-UP SYSTEM - COMPREHENSIVE DEBUG TEST     ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}`);

  // Step 1: Check environment
  const envOk = await checkEnvironment();
  if (!envOk) {
    log.error('\nPlease set all required environment variables in .env file');
    process.exit(1);
  }

  // Step 2: Check database
  const dbOk = await checkDatabase();
  if (!dbOk) {
    log.error('\nDatabase setup incomplete. Run migrations first.');
    process.exit(1);
  }

  // Step 3: Get or create test user
  const user = await getOrCreateTestUser();
  if (!user) {
    log.error('\nCould not set up test user');
    process.exit(1);
  }

  // Step 4: Create test follow-up (due now)
  const followUp = await createTestFollowUp(user, 0);
  if (!followUp) {
    log.error('\nCould not create test follow-up');
    process.exit(1);
  }

  // Step 5: Check due follow-ups
  const dueFollowUps = await checkDueFollowUps();

  // Step 6: Trigger reminder emails
  log.info('\nWaiting 2 seconds before triggering reminders...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const remindersSent = await triggerReminders();

  // Step 7: Check email queue
  await checkEmailQueue();

  // Step 8: Process email queue (if SMTP is configured)
  if (process.env.BREVO_SMTP_USER && process.env.BREVO_SMTP_PASSWORD) {
    await processEmailQueue();
    
    // Check queue again after processing
    log.info('\nChecking queue status after processing...');
    await checkEmailQueue();
  } else {
    log.warning('\nSMTP not configured - emails will remain in queue');
  }

  // Step 9: Check history
  await checkHistory();

  // Final summary
  log.header('TEST COMPLETE');
  
  log.info(`
${colors.yellow}Next Steps:${colors.reset}
1. Check your email inbox for the reminder email
2. To test snoozing: Update the follow-up in the UI or run:
   UPDATE email_follow_ups SET follow_up_number = 2, due_date = NOW() + INTERVAL '2 minutes' WHERE id = '${followUp.id}';
3. To test escalation: Set follow-up to 3rd attempt and make it overdue:
   UPDATE email_follow_ups SET follow_up_number = 3, due_date = NOW() - INTERVAL '2 minutes' WHERE id = '${followUp.id}';
   Then run: curl ${process.env.NEXT_PUBLIC_PORTAL_URL || 'http://localhost:3000'}/api/cron/escalate-follow-ups
4. Monitor the email_queue table:
   SELECT * FROM email_queue ORDER BY created_at DESC LIMIT 10;
`);

  pool.end();
}

// Command line argument handling
const args = process.argv.slice(2);

if (args.includes('--help')) {
  console.log(`
${colors.cyan}Email Follow-up Debug Script${colors.reset}

Usage:
  node test-email-follow-up-debug.js         Run full test
  node test-email-follow-up-debug.js --queue Process email queue only
  node test-email-follow-up-debug.js --check Check system status only
  node test-email-follow-up-debug.js --help  Show this help
`);
  process.exit(0);
}

if (args.includes('--queue')) {
  processEmailQueue().then(() => pool.end());
} else if (args.includes('--check')) {
  (async () => {
    await checkEnvironment();
    await checkDatabase();
    await checkDueFollowUps();
    await checkEmailQueue();
    await checkHistory();
    pool.end();
  })();
} else {
  runFullTest();
}