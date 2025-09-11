// Test email queue processing
// Run with: node scripts/test-email-queue.js

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const QUEUE_PROCESSOR_SECRET = process.env.EMAIL_QUEUE_SECRET || 'default-secret-change-in-production';

async function testEmailQueue() {
  try {
    console.log('Testing email queue processing...');
    console.log('BREVO_SMTP_USER:', process.env.BREVO_SMTP_USER ? 'Configured' : 'NOT CONFIGURED');
    console.log('BREVO_SMTP_PASSWORD:', process.env.BREVO_SMTP_PASSWORD ? 'Configured' : 'NOT CONFIGURED');
    
    const response = await fetch('http://localhost:3000/api/notifications/email-queue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-queue-secret': QUEUE_PROCESSOR_SECRET
      },
      body: JSON.stringify({ limit: 10 })
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testEmailQueue();