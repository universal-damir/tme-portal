#!/bin/bash

# TME Portal Nightly Backup Script with Email Notifications
# Runs database backup and sends status email

set -e

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/tme-backup.log"
EMAIL_TO="damir@tme-services.com"
EMAIL_FROM="noreply@tme-services.com"

# SMTP Configuration from environment
SMTP_HOST="smtp-relay.brevo.com"
SMTP_PORT="587"
SMTP_USER="${BREVO_SMTP_USER}"
SMTP_PASS="${BREVO_SMTP_PASSWORD}"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Email function using curl and SMTP
send_email() {
    local subject="$1"
    local body="$2"
    local status="$3"
    
    # Create email content
    cat > /tmp/email_content.txt << EOF
From: TME Portal System <$EMAIL_FROM>
To: $EMAIL_TO
Subject: $subject
Content-Type: text/html; charset=UTF-8

<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #243F7B; color: white; padding: 15px; border-radius: 5px; }
        .content { margin: 20px 0; }
        .success { border-left: 4px solid #22c55e; padding-left: 15px; }
        .error { border-left: 4px solid #ef4444; padding-left: 15px; }
        .info { border-left: 4px solid #3b82f6; padding-left: 15px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h2>TME Portal - Backup Status</h2>
    </div>
    
    <div class="content $status">
        $body
    </div>
    
    <div class="footer">
        <p>This is an automated message from TME Portal backup system.<br>
        Server: $(hostname)<br>
        Time: $(date)</p>
    </div>
</body>
</html>
EOF

    # Send email via SMTP
    curl --ssl-reqd \
        --url "smtps://$SMTP_HOST:$SMTP_PORT" \
        --user "$SMTP_USER:$SMTP_PASS" \
        --mail-from "$EMAIL_FROM" \
        --mail-rcpt "$EMAIL_TO" \
        --upload-file /tmp/email_content.txt \
        --silent || log "Failed to send email notification"
    
    rm -f /tmp/email_content.txt
}

# Main backup execution
log "Starting nightly backup process"

# Check if Docker containers are running
if ! docker ps | grep -q "postgres"; then
    log "ERROR: PostgreSQL container not running"
    send_email "TME Portal Backup FAILED" "<p><strong>Error:</strong> PostgreSQL container is not running.</p><p>Please check Docker services immediately.</p>" "error"
    exit 1
fi

# Get disk space before backup
DISK_USAGE_BEFORE=$(df -h /var/lib/docker | tail -1 | awk '{print $5}' | sed 's/%//')
DISK_AVAILABLE=$(df -h /var/lib/docker | tail -1 | awk '{print $4}')

log "Disk usage before backup: ${DISK_USAGE_BEFORE}% (${DISK_AVAILABLE} available)"

# Run the backup using docker-compose
cd "/path/to/tme-portal" # Update this path to your actual TME Portal directory

if docker-compose run --rm backup; then
    # Backup successful
    BACKUP_FILE=$(ls -t /backups/*.tar.gz | head -1)
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    BACKUP_COUNT=$(ls -1 /backups/*.tar.gz | wc -l)
    
    # Get disk space after backup
    DISK_USAGE_AFTER=$(df -h /var/lib/docker | tail -1 | awk '{print $5}' | sed 's/%//')
    
    log "Backup completed successfully: $BACKUP_FILE ($BACKUP_SIZE)"
    
    # Send success email
    send_email "TME Portal Backup SUCCESS" "
        <h3>Backup Completed Successfully</h3>
        <p><strong>Backup File:</strong> $(basename "$BACKUP_FILE")</p>
        <p><strong>Backup Size:</strong> $BACKUP_SIZE</p>
        <p><strong>Total Backups:</strong> $BACKUP_COUNT</p>
        <p><strong>Disk Usage:</strong> Before: ${DISK_USAGE_BEFORE}% → After: ${DISK_USAGE_AFTER}%</p>
        <p><strong>Available Space:</strong> $DISK_AVAILABLE</p>
        <p><strong>Backup Location:</strong> $BACKUP_DIR</p>
    " "success"
    
else
    # Backup failed
    log "ERROR: Backup process failed"
    send_email "TME Portal Backup FAILED" "
        <h3>Backup Process Failed</h3>
        <p><strong>Error:</strong> The backup process encountered an error.</p>
        <p><strong>Time:</strong> $(date)</p>
        <p><strong>Please check the system logs:</strong> $LOG_FILE</p>
        <p><strong>Action Required:</strong> Investigate and resolve the backup issue immediately.</p>
    " "error"
    exit 1
fi

log "Nightly backup process completed"