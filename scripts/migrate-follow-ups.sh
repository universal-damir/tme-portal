#!/bin/bash

# Run the email follow-ups migration
# This creates the tables for the new follow-up tracking system

echo "🚀 Running email follow-ups migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo "Please set it or create a .env.local file with DATABASE_URL"
    exit 1
fi

# Run the migration
psql $DATABASE_URL -f database/migrations/018_email_follow_ups.sql

if [ $? -eq 0 ]; then
    echo "✅ Email follow-ups migration completed successfully"
else
    echo "❌ Migration failed"
    exit 1
fi