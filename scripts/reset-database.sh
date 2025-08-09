#!/bin/bash

# TME Portal Database Reset Script
# This script reinitializes the database with the new schema

set -e

echo "🚀 Starting TME Portal database reset..."

# Use database connection from .env
export DATABASE_URL="postgresql://tme_user:secure_password@localhost:5434/tme_portal"

echo "📦 Database URL: $DATABASE_URL"

# Drop existing database and recreate (be careful!)
echo "🗑️  Dropping existing database..."
psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" 2>/dev/null || true

echo "🏗️  Initializing database with new schema..."
psql "$DATABASE_URL" -f database/init.sql

echo "📋 Applying database migrations..."
psql "$DATABASE_URL" -f database/migrations/001_review_system.sql
psql "$DATABASE_URL" -f database/migrations/002_add_notification_metadata.sql
psql "$DATABASE_URL" -f database/migrations/002_add_submitter_message.sql
psql "$DATABASE_URL" -f database/migrations/002_update_urgency_levels.sql
psql "$DATABASE_URL" -f database/migrations/003_user_todos_system.sql
psql "$DATABASE_URL" -f database/migrations/003_user_todos_system_patch.sql

echo "👥 Populating users from team.json..."
node scripts/populate-users-from-team.js

echo "✅ Database reset complete!"
echo "🔐 Default password for all users: TME2025!Change"
echo "👑 Admin users: Uwe Hohmann, Damir Novalic"