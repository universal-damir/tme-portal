#!/usr/bin/env node

/**
 * Automatic Follow-up Reminder System for Development
 * Runs every 30 seconds to check for due follow-ups and send reminders
 */

const { exec } = require('child_process');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

let checkCount = 0;

async function checkAndSendReminders() {
  checkCount++;
  const timestamp = new Date().toLocaleTimeString();
  
  try {
    // Check for due follow-ups
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM email_follow_ups 
       WHERE status = 'pending' 
       AND due_date <= NOW()
       AND NOT EXISTS (
         SELECT 1 FROM email_follow_up_history h
         WHERE h.follow_up_id = email_follow_ups.id
         AND h.action = 'reminder_sent'
         AND DATE(h.created_at) = CURRENT_DATE
       )`
    );
    
    const dueCount = parseInt(result.rows[0].count);
    
    if (dueCount > 0) {
      console.log(`${colors.yellow}[${timestamp}] Found ${dueCount} follow-ups needing reminders${colors.reset}`);
      
      // Trigger reminders
      exec('curl -s http://localhost:3000/api/cron/send-follow-up-reminders', (error, stdout) => {
        if (error) {
          console.error(`${colors.red}Error triggering reminders: ${error}${colors.reset}`);
          return;
        }
        
        const response = JSON.parse(stdout);
        if (response.success && response.results.reminders_sent > 0) {
          console.log(`${colors.green}✅ Sent ${response.results.reminders_sent} reminders${colors.reset}`);
          
          // Process email queue
          exec('curl -s http://localhost:3000/api/cron/process-email-queue', (error2, stdout2) => {
            if (!error2) {
              const queueResponse = JSON.parse(stdout2);
              if (queueResponse.results.emails_sent > 0) {
                console.log(`${colors.green}📧 Processed ${queueResponse.results.emails_sent} emails${colors.reset}`);
              }
            }
          });
        } else if (response.results.errors && response.results.errors.length > 0) {
          console.log(`${colors.red}Failed to send reminders: ${response.results.errors[0]}${colors.reset}`);
        }
      });
    } else {
      // Only show status every 10 checks (5 minutes)
      if (checkCount % 10 === 0) {
        console.log(`${colors.cyan}[${timestamp}] No follow-ups due. Checked ${checkCount} times.${colors.reset}`);
      }
    }
    
    // Also check for escalations
    const escalationResult = await pool.query(
      `SELECT COUNT(*) as count FROM email_follow_ups 
       WHERE status = 'pending' 
       AND follow_up_number = 3
       AND due_date < NOW() - INTERVAL '1 minute'
       AND escalated_to_manager = FALSE`
    );
    
    const escalationCount = parseInt(escalationResult.rows[0].count);
    
    if (escalationCount > 0) {
      console.log(`${colors.red}[${timestamp}] Found ${escalationCount} follow-ups needing escalation${colors.reset}`);
      
      exec('curl -s http://localhost:3000/api/cron/escalate-follow-ups', (error, stdout) => {
        if (!error) {
          console.log(`${colors.red}⚠️  Escalated to manager${colors.reset}`);
        }
      });
    }
    
  } catch (error) {
    console.error(`${colors.red}Error checking follow-ups: ${error.message}${colors.reset}`);
  }
}

console.log(`
${colors.blue}╔════════════════════════════════════════════════════════════╗
║   AUTO FOLLOW-UP REMINDER SYSTEM (DEVELOPMENT MODE)       ║
╚════════════════════════════════════════════════════════════╝${colors.reset}

${colors.green}✅ Started automatic reminder checking${colors.reset}
${colors.yellow}⏰ Checking every 30 seconds for due follow-ups${colors.reset}
${colors.cyan}📧 Will automatically send reminders and process email queue${colors.reset}

Press Ctrl+C to stop
`);

// Run immediately
checkAndSendReminders();

// Then run every 30 seconds
const interval = setInterval(checkAndSendReminders, 30000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}Stopping automatic reminder system...${colors.reset}`);
  clearInterval(interval);
  pool.end();
  process.exit(0);
});