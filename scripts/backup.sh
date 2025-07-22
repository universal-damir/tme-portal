#!/bin/bash

# TME Portal Database Backup Script
# This script creates daily backups of PostgreSQL and Redis

set -e

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting backup process at $(date)"

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h postgres -U tme_user -d tme_portal; do
    echo "PostgreSQL is not ready yet, waiting 5 seconds..."
    sleep 5
done

# Backup PostgreSQL database
echo "Creating PostgreSQL backup..."
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
    -h postgres \
    -U tme_user \
    -d tme_portal \
    --no-password \
    --verbose \
    --clean \
    --if-exists \
    --create \
    --format=custom \
    > "$BACKUP_DIR/tme_portal_$DATE.dump"

# Create SQL backup as well for easy inspection
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
    -h postgres \
    -U tme_user \
    -d tme_portal \
    --no-password \
    --verbose \
    --clean \
    --if-exists \
    --create \
    > "$BACKUP_DIR/tme_portal_$DATE.sql"

echo "PostgreSQL backup completed: tme_portal_$DATE.dump"

# Backup Redis data (if Redis is available)
if redis-cli -h redis -p 6379 -a "$REDIS_PASSWORD" ping > /dev/null 2>&1; then
    echo "Creating Redis backup..."
    redis-cli -h redis -p 6379 -a "$REDIS_PASSWORD" --rdb "$BACKUP_DIR/redis_$DATE.rdb"
    echo "Redis backup completed: redis_$DATE.rdb"
else
    echo "Redis not available, skipping Redis backup"
fi

# Compress backups
echo "Compressing backups..."
tar -czf "$BACKUP_DIR/tme_portal_complete_$DATE.tar.gz" \
    "$BACKUP_DIR/tme_portal_$DATE.dump" \
    "$BACKUP_DIR/tme_portal_$DATE.sql" \
    $([ -f "$BACKUP_DIR/redis_$DATE.rdb" ] && echo "$BACKUP_DIR/redis_$DATE.rdb")

# Clean up individual files (keep compressed version)
rm -f "$BACKUP_DIR/tme_portal_$DATE.dump" \
      "$BACKUP_DIR/tme_portal_$DATE.sql" \
      "$BACKUP_DIR/redis_$DATE.rdb"

# Clean up old backups (keep only last 30 days)
echo "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Create backup manifest
echo "Creating backup manifest..."
cat > "$BACKUP_DIR/backup_manifest_$DATE.txt" << EOF
TME Portal Backup Manifest
==========================
Backup Date: $(date)
Backup File: tme_portal_complete_$DATE.tar.gz
PostgreSQL Version: $(PGPASSWORD="$POSTGRES_PASSWORD" psql -h postgres -U tme_user -d tme_portal -t -c "SELECT version();" | head -1)
Database Size: $(PGPASSWORD="$POSTGRES_PASSWORD" psql -h postgres -U tme_user -d tme_portal -t -c "SELECT pg_size_pretty(pg_database_size('tme_portal'));" | tr -d ' ')
Tables Backed Up:
$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h postgres -U tme_user -d tme_portal -t -c "SELECT schemaname||'.'||tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" | sed 's/^/  - /')

Recent Activity:
$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h postgres -U tme_user -d tme_portal -t -c "SELECT COUNT(*) || ' total users' FROM users;" | tr -d ' ')
$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h postgres -U tme_user -d tme_portal -t -c "SELECT COUNT(*) || ' active sessions' FROM sessions WHERE expires_at > NOW();" | tr -d ' ')
$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h postgres -U tme_user -d tme_portal -t -c "SELECT COUNT(*) || ' audit log entries' FROM audit_logs;" | tr -d ' ')

Backup Status: SUCCESS
EOF

# Display backup summary
echo ""
echo "=== BACKUP SUMMARY ==="
echo "Backup completed successfully at $(date)"
echo "Backup file: $BACKUP_DIR/tme_portal_complete_$DATE.tar.gz"
echo "Backup size: $(du -h "$BACKUP_DIR/tme_portal_complete_$DATE.tar.gz" | cut -f1)"
echo "Available backups:"
ls -lah "$BACKUP_DIR"/*.tar.gz | tail -10

echo "Backup process completed successfully!"

# Exit successfully
exit 0