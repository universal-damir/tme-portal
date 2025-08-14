#!/bin/bash
# Generate secure passwords for production deployment

echo "🔐 TME Portal Production Password Generator"
echo "=========================================="
echo ""
echo "Copy these values to your .env.production file:"
echo ""

# Database Password
DB_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
echo "# PostgreSQL Password"
echo "POSTGRES_PASSWORD=$DB_PASS"
echo "DATABASE_URL=postgresql://tme_user:$DB_PASS@postgres:5432/tme_portal"
echo ""

# Redis Password
REDIS_PASS=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-24)
echo "# Redis Password"
echo "REDIS_PASSWORD=$REDIS_PASS"
echo "REDIS_URL=redis://:$REDIS_PASS@redis:6379"
echo ""

# NextAuth Secret
NEXTAUTH=$(openssl rand -base64 64 | tr -d '\n')
echo "# NextAuth Secret"
echo "NEXTAUTH_SECRET=$NEXTAUTH"
echo ""

# Cron Secret
CRON=$(openssl rand -hex 32)
echo "# Cron Secret"
echo "CRON_SECRET=$CRON"
echo ""

# Backup Encryption Key
BACKUP_KEY=$(openssl rand -base64 32 | tr -d '\n')
echo "# Backup Encryption Key"
echo "BACKUP_ENCRYPTION_KEY=$BACKUP_KEY"
echo ""

echo "⚠️  IMPORTANT: Save these passwords securely!"
echo "⚠️  You won't be able to recover them if lost!"