#!/bin/bash

# TME Portal Encrypted Database Backup Script
# This script creates daily encrypted backups of PostgreSQL and Redis for external drive storage

set -e

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30
ENCRYPTION_PASSWORD="${BACKUP_ENCRYPTION_PASSWORD:-TME_Backup_2024_EncryptionKey!#$%}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting encrypted backup process at $(date)"

# Read database password from Docker secret if available
if [ -f "/run/secrets/postgres_password" ]; then
    POSTGRES_PASSWORD=$(cat /run/secrets/postgres_password)
fi

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

# Read Redis password from Docker secret if available
if [ -f "/run/secrets/redis_password" ]; then
    REDIS_PASSWORD=$(cat /run/secrets/redis_password)
fi

# Backup Redis data (if Redis is available)
if redis-cli -h redis -p 6379 -a "$REDIS_PASSWORD" ping > /dev/null 2>&1; then
    echo "Creating Redis backup..."
    redis-cli -h redis -p 6379 -a "$REDIS_PASSWORD" --rdb "$BACKUP_DIR/redis_$DATE.rdb"
    echo "Redis backup completed: redis_$DATE.rdb"
else
    echo "Redis not available, skipping Redis backup"
fi

# Create backup manifest
echo "Creating backup manifest..."
cat > "$BACKUP_DIR/backup_manifest_$DATE.txt" << EOF
TME Portal Encrypted Backup Manifest
====================================
Backup Date: $(date)
Backup Type: Encrypted (AES-256)
PostgreSQL Version: $(PGPASSWORD="$POSTGRES_PASSWORD" psql -h postgres -U tme_user -d tme_portal -t -c "SELECT version();" | head -1)
Database Size: $(PGPASSWORD="$POSTGRES_PASSWORD" psql -h postgres -U tme_user -d tme_portal -t -c "SELECT pg_size_pretty(pg_database_size('tme_portal'));" | tr -d ' ')
Tables Backed Up:
$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h postgres -U tme_user -d tme_portal -t -c "SELECT schemaname||'.'||tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" | sed 's/^/  - /')

Current Statistics:
$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h postgres -U tme_user -d tme_portal -t -c "SELECT COUNT(*) || ' total users' FROM users;" | tr -d ' ')
$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h postgres -U tme_user -d tme_portal -t -c "SELECT COUNT(*) || ' active sessions' FROM sessions WHERE expires_at > NOW();" | tr -d ' ')
$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h postgres -U tme_user -d tme_portal -t -c "SELECT COUNT(*) || ' audit log entries' FROM audit_logs;" | tr -d ' ')

Security Features:
- Encryption: AES-256-CBC
- Compression: gzip
- Integrity: SHA-256 checksum
- External Drive Ready: Yes

Backup Status: SUCCESS
EOF

# Compress and encrypt backups for external drive
echo "Compressing and encrypting backups for external drive storage..."

# Create compressed archive
tar -czf "$BACKUP_DIR/tme_portal_complete_$DATE.tar.gz" \
    "$BACKUP_DIR/tme_portal_$DATE.dump" \
    "$BACKUP_DIR/tme_portal_$DATE.sql" \
    "$BACKUP_DIR/backup_manifest_$DATE.txt" \
    $([ -f "$BACKUP_DIR/redis_$DATE.rdb" ] && echo "$BACKUP_DIR/redis_$DATE.rdb")

# Encrypt the backup with AES-256
echo "Encrypting backup with AES-256..."
openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 \
    -in "$BACKUP_DIR/tme_portal_complete_$DATE.tar.gz" \
    -out "$BACKUP_DIR/tme_portal_encrypted_$DATE.tar.gz.enc" \
    -pass pass:"$ENCRYPTION_PASSWORD"

# Create SHA-256 checksum for integrity verification
echo "Creating integrity checksum..."
sha256sum "$BACKUP_DIR/tme_portal_encrypted_$DATE.tar.gz.enc" > "$BACKUP_DIR/tme_portal_encrypted_$DATE.tar.gz.enc.sha256"

# Create decryption instructions
cat > "$BACKUP_DIR/DECRYPTION_INSTRUCTIONS_$DATE.txt" << EOF
TME Portal Backup Decryption Instructions
=========================================

To decrypt and restore this backup:

1. Decrypt the backup file:
   openssl enc -aes-256-cbc -d -pbkdf2 -iter 100000 \\
     -in tme_portal_encrypted_$DATE.tar.gz.enc \\
     -out tme_portal_complete_$DATE.tar.gz \\
     -pass pass:YOUR_ENCRYPTION_PASSWORD

2. Verify integrity (optional but recommended):
   sha256sum -c tme_portal_encrypted_$DATE.tar.gz.enc.sha256

3. Extract the backup:
   tar -xzf tme_portal_complete_$DATE.tar.gz

4. Restore PostgreSQL database:
   pg_restore -h localhost -U tme_user -d tme_portal_new \\
     --verbose --clean --create tme_portal_$DATE.dump

5. Restore Redis data (if applicable):
   redis-cli --rdb redis_$DATE.rdb

IMPORTANT: Keep the encryption password secure and separate from the backup files!

Backup Date: $(date)
Encryption: AES-256-CBC with PBKDF2 (100,000 iterations)
EOF

# Clean up unencrypted files (keep only encrypted version)
rm -f "$BACKUP_DIR/tme_portal_$DATE.dump" \
      "$BACKUP_DIR/tme_portal_$DATE.sql" \
      "$BACKUP_DIR/redis_$DATE.rdb" \
      "$BACKUP_DIR/tme_portal_complete_$DATE.tar.gz"

# Clean up old encrypted backups (keep only last 30 days)
echo "Cleaning up old encrypted backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "*.tar.gz.enc" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.sha256" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "DECRYPTION_INSTRUCTIONS_*.txt" -mtime +$RETENTION_DAYS -delete

# Display backup summary
echo ""
echo "=== ENCRYPTED BACKUP SUMMARY ==="
echo "Encrypted backup completed successfully at $(date)"
echo "Encrypted file: $BACKUP_DIR/tme_portal_encrypted_$DATE.tar.gz.enc"
echo "Backup size: $(du -h "$BACKUP_DIR/tme_portal_encrypted_$DATE.tar.gz.enc" | cut -f1)"
echo "Checksum file: $BACKUP_DIR/tme_portal_encrypted_$DATE.tar.gz.enc.sha256"
echo "Instructions: $BACKUP_DIR/DECRYPTION_INSTRUCTIONS_$DATE.txt"
echo ""
echo "🔒 SECURITY NOTICE:"
echo "- Backup is encrypted with AES-256-CBC"
echo "- Safe for external drive storage"
echo "- Keep encryption password secure!"
echo ""

# List recent encrypted backups
echo "Available encrypted backups:"
ls -lah "$BACKUP_DIR"/*.enc 2>/dev/null | tail -10 || echo "No previous encrypted backups found"

echo "Encrypted backup process completed successfully!"
echo "Files ready for external drive transfer."

# Exit successfully
exit 0