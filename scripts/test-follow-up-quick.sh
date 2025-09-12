#!/bin/bash

# Quick test script for follow-up email system
# This creates a test follow-up and sends the reminder email

echo "🚀 Follow-Up Email System Quick Test"
echo "===================================="

# Set the portal URL if not set
if [ -z "$NEXT_PUBLIC_PORTAL_URL" ]; then
  export NEXT_PUBLIC_PORTAL_URL="http://localhost:3000"
fi

echo "1️⃣  Creating test follow-up (due immediately)..."
node scripts/test-follow-up-dev.js --create-test

echo ""
echo "2️⃣  Waiting 2 seconds..."
sleep 2

echo ""
echo "3️⃣  Triggering reminder emails..."
curl -s $NEXT_PUBLIC_PORTAL_URL/api/cron/send-follow-up-reminders | python3 -m json.tool

echo ""
echo "4️⃣  Processing email queue..."
curl -s $NEXT_PUBLIC_PORTAL_URL/api/cron/process-email-queue | python3 -m json.tool

echo ""
echo "✅ Test complete! Check your email inbox for the reminder."
echo ""
echo "📧 To check email queue status:"
echo "   psql \$DATABASE_URL -c \"SELECT id, to_email, subject, status FROM email_queue ORDER BY created_at DESC LIMIT 5;\""
echo ""
echo "🔄 To test snoozing (upgrades to 2nd attempt, due in 2 minutes):"
echo "   - Go to the UI and snooze the follow-up"
echo "   - Wait 2 minutes"
echo "   - Run: curl $NEXT_PUBLIC_PORTAL_URL/api/cron/send-follow-up-reminders"
echo "   - Run: curl $NEXT_PUBLIC_PORTAL_URL/api/cron/process-email-queue"