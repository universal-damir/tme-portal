#!/usr/bin/env node

/**
 * Test script for Email Follow-Up Dropdown Actions
 * Tests: Complete, Snooze (Follow-up Sent), and Manual Escalation
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://tme_user:Skaylo#123@localhost:5432/tme_portal'
});

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Test user configuration
const TEST_USER_ID = 1; // Admin user
const TEST_MANAGER_ID = 2; // Another user to escalate to

async function createTestFollowUp(followUpNumber = 1, clientName = 'Test Client', status = 'pending') {
  const now = new Date();
  const sentDate = new Date(now.getTime() - (followUpNumber * 60 * 1000)); // Minutes ago
  const dueDate = new Date(now.getTime() + (60 * 1000)); // Due in 1 minute
  
  const query = `
    INSERT INTO email_follow_ups (
      user_id, email_subject, client_name, client_email,
      follow_up_number, sent_date, due_date, status,
      original_email_id, escalated_to_manager, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
    ) RETURNING *
  `;
  
  const values = [
    TEST_USER_ID,
    `Test Email - ${clientName} - Attempt ${followUpNumber}`,
    clientName,
    `${clientName.toLowerCase().replace(' ', '.')}@example.com`,
    followUpNumber,
    sentDate,
    dueDate,
    status,
    `test-email-${Date.now()}`,
    false,
    now,
    now
  ];
  
  const result = await pool.query(query, values);
  return result.rows[0];
}

async function testCompleteAction() {
  console.log(`\n${colors.cyan}=== Testing "Completed" Action ===${colors.reset}`);
  
  try {
    // Create a test follow-up
    const followUp = await createTestFollowUp(1, 'Complete Test Client');
    console.log(`${colors.green}✓${colors.reset} Created test follow-up: ${followUp.id}`);
    
    // Simulate marking as completed
    const updateQuery = `
      UPDATE email_follow_ups 
      SET status = 'completed', 
          completed_at = NOW(),
          completed_reason = 'client_responded',
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, [followUp.id]);
    const completed = result.rows[0];
    
    if (completed.status === 'completed') {
      console.log(`${colors.green}✓${colors.reset} Successfully marked as completed`);
      console.log(`  Status: ${completed.status}`);
      console.log(`  Reason: ${completed.completed_reason}`);
    } else {
      console.log(`${colors.red}✗${colors.reset} Failed to mark as completed`);
    }
    
    // Add to history
    await addHistory(followUp.id, 'completed', 'Marked as completed via dropdown');
    
  } catch (error) {
    console.error(`${colors.red}✗ Error:${colors.reset}`, error.message);
  }
}

async function testSnoozeAction() {
  console.log(`\n${colors.cyan}=== Testing "Follow-up Reminder Sent" (Snooze) Action ===${colors.reset}`);
  
  try {
    // Test progression: 1st → 2nd → 3rd
    for (let level = 1; level <= 3; level++) {
      const followUp = await createTestFollowUp(level, `Snooze Test Client L${level}`);
      console.log(`\n${colors.blue}Testing Level ${level} → ${level + 1}:${colors.reset}`);
      console.log(`  Created: ${followUp.email_subject}`);
      
      if (level < 3) {
        // Can snooze to next level
        const newLevel = level + 1;
        const newDueDate = new Date(Date.now() + (newLevel * 60 * 1000)); // Minutes from now
        
        const updateQuery = `
          UPDATE email_follow_ups 
          SET follow_up_number = $2,
              due_date = $3,
              status = 'snoozed',
              updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `;
        
        const result = await pool.query(updateQuery, [followUp.id, newLevel, newDueDate]);
        const snoozed = result.rows[0];
        
        console.log(`  ${colors.green}✓${colors.reset} Snoozed to level ${snoozed.follow_up_number}`);
        console.log(`  New due date: ${snoozed.due_date.toLocaleString()}`);
        
        await addHistory(followUp.id, 'snoozed', `Snoozed from level ${level} to ${newLevel}`);
        
        // Reset to pending for UI
        await pool.query(`UPDATE email_follow_ups SET status = 'pending' WHERE id = $1`, [followUp.id]);
        
      } else {
        console.log(`  ${colors.yellow}!${colors.reset} Level 3 cannot be snoozed (max level reached)`);
      }
    }
    
  } catch (error) {
    console.error(`${colors.red}✗ Error:${colors.reset}`, error.message);
  }
}

async function testManualEscalation() {
  console.log(`\n${colors.cyan}=== Testing "Client Did Not Respond" (Manual Escalation) ===${colors.reset}`);
  
  try {
    // Create a follow-up to escalate
    const followUp = await createTestFollowUp(2, 'Escalation Test Client');
    console.log(`${colors.green}✓${colors.reset} Created test follow-up: ${followUp.id}`);
    
    // Get a team member to escalate to
    const teamQuery = `
      SELECT id, full_name, email, is_manager 
      FROM users 
      WHERE id != $1 AND status = 'active' 
      LIMIT 1
    `;
    const teamResult = await pool.query(teamQuery, [TEST_USER_ID]);
    
    if (teamResult.rows.length === 0) {
      console.log(`${colors.yellow}!${colors.reset} No other team members found for escalation`);
      return;
    }
    
    const teamMember = teamResult.rows[0];
    console.log(`\n${colors.blue}Escalating to:${colors.reset}`);
    console.log(`  Name: ${teamMember.full_name}`);
    console.log(`  Email: ${teamMember.email}`);
    console.log(`  Is Manager: ${teamMember.is_manager ? 'Yes' : 'No'}`);
    
    // Simulate manual escalation
    const escalateQuery = `
      UPDATE email_follow_ups 
      SET status = 'no_response',
          escalated_to_manager = true,
          manager_id = $2,
          escalated_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(escalateQuery, [followUp.id, teamMember.id]);
    const escalated = result.rows[0];
    
    if (escalated.escalated_to_manager) {
      console.log(`\n${colors.green}✓${colors.reset} Successfully escalated`);
      console.log(`  Status: ${escalated.status}`);
      console.log(`  Escalated to ID: ${escalated.manager_id}`);
      
      // Add to history
      await addHistory(followUp.id, 'escalated', `Manually escalated to ${teamMember.full_name}`);
      
      // Simulate email notification
      console.log(`\n${colors.magenta}📧 Email Notification:${colors.reset}`);
      console.log(`  To: ${teamMember.email}`);
      console.log(`  Subject: Action Required: Follow-up Escalation - ${escalated.client_name}`);
      console.log(`  Body: Follow-up for "${escalated.email_subject}" needs attention`);
      
    } else {
      console.log(`${colors.red}✗${colors.reset} Failed to escalate`);
    }
    
  } catch (error) {
    console.error(`${colors.red}✗ Error:${colors.reset}`, error.message);
  }
}

async function addHistory(followUpId, action, details) {
  const query = `
    INSERT INTO email_follow_up_history (
      follow_up_id, action, details, created_at
    ) VALUES ($1, $2, $3, NOW())
  `;
  await pool.query(query, [followUpId, action, details]);
}

async function showCurrentFollowUps() {
  console.log(`\n${colors.cyan}=== Current Test Follow-Ups ===${colors.reset}`);
  
  const query = `
    SELECT 
      ef.id,
      ef.client_name,
      ef.follow_up_number,
      ef.status,
      ef.due_date,
      ef.escalated_to_manager,
      u.full_name as escalated_to
    FROM email_follow_ups ef
    LEFT JOIN users u ON ef.manager_id = u.id
    WHERE ef.user_id = $1 
      AND ef.client_name LIKE 'Test%'
      AND ef.created_at > NOW() - INTERVAL '1 hour'
    ORDER BY ef.created_at DESC
    LIMIT 10
  `;
  
  const result = await pool.query(query, [TEST_USER_ID]);
  
  if (result.rows.length === 0) {
    console.log('No test follow-ups found');
    return;
  }
  
  console.log(`\nFound ${result.rows.length} test follow-ups:\n`);
  
  result.rows.forEach(row => {
    let statusColor = colors.green;
    if (row.status === 'pending') statusColor = colors.yellow;
    if (row.status === 'no_response') statusColor = colors.red;
    
    console.log(`ID: ${row.id.substring(0, 8)}...`);
    console.log(`  Client: ${row.client_name}`);
    console.log(`  Attempt: ${row.follow_up_number}`);
    console.log(`  Status: ${statusColor}${row.status}${colors.reset}`);
    console.log(`  Due: ${row.due_date.toLocaleString()}`);
    if (row.escalated_to_manager) {
      console.log(`  Escalated to: ${row.escalated_to || 'Unknown'}`);
    }
    console.log('');
  });
}

async function cleanupTestData() {
  console.log(`\n${colors.cyan}=== Cleanup Test Data ===${colors.reset}`);
  
  const query = `
    DELETE FROM email_follow_ups 
    WHERE user_id = $1 
      AND client_name LIKE 'Test%'
      AND created_at > NOW() - INTERVAL '1 hour'
    RETURNING id
  `;
  
  const result = await pool.query(query, [TEST_USER_ID]);
  console.log(`${colors.green}✓${colors.reset} Removed ${result.rows.length} test follow-ups`);
}

async function main() {
  console.log(`${colors.bright}${colors.cyan}======================================`);
  console.log(`  Email Follow-Up Dropdown Actions Test`);
  console.log(`======================================${colors.reset}\n`);
  
  try {
    // Run tests
    await testCompleteAction();
    await testSnoozeAction();
    await testManualEscalation();
    
    // Show current state
    await showCurrentFollowUps();
    
    // Ask about cleanup
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question(`\n${colors.yellow}Clean up test data? (y/n): ${colors.reset}`, async (answer) => {
      if (answer.toLowerCase() === 'y') {
        await cleanupTestData();
      }
      
      console.log(`\n${colors.green}✓ Tests completed!${colors.reset}`);
      console.log('\nTo test in the UI:');
      console.log('1. Go to Profile Tab → Email Response Tracker');
      console.log('2. Look for test follow-ups in "Awaiting Response" tab');
      console.log('3. Use the dropdown menu (⋮) to test each action');
      
      readline.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run the tests
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});