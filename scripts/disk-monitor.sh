#!/bin/bash

# TME Portal Disk Space Monitoring Script
# Monitors Docker host disk space and sends alerts when low

set -e

# Configuration
EMAIL_TO="damir@tme-services.com"
EMAIL_FROM="noreply@tme-services.com"
LOG_FILE="/var/log/tme-disk-monitor.log"

# Thresholds (percentage)
WARNING_THRESHOLD=80
CRITICAL_THRESHOLD=90

# SMTP Configuration
SMTP_HOST="smtp-relay.brevo.com"
SMTP_PORT="587"
SMTP_USER="${BREVO_SMTP_USER}"
SMTP_PASS="${BREVO_SMTP_PASSWORD}"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Email function
send_alert() {
    local subject="$1"
    local body="$2"
    local alert_level="$3"
    
    # Determine color based on alert level
    local color="#3b82f6"
    case "$alert_level" in
        "warning") color="#f59e0b" ;;
        "critical") color="#ef4444" ;;
    esac
    
    cat > /tmp/disk_alert.txt << EOF
From: TME Portal System <$EMAIL_FROM>
To: $EMAIL_TO
Subject: $subject
Content-Type: text/html; charset=UTF-8

<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: $color; color: white; padding: 15px; border-radius: 5px; }
        .content { margin: 20px 0; }
        .alert { border-left: 4px solid $color; padding-left: 15px; background-color: #f8f9fa; padding: 15px; border-radius: 5px; }
        .metrics { background-color: #f1f5f9; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; }
    </style>
</head>
<body>
    <div class="header">
        <h2>TME Portal - Disk Space Alert</h2>
    </div>
    
    <div class="content">
        <div class="alert">
            $body
        </div>
    </div>
    
    <div class="footer">
        <p>This is an automated alert from TME Portal disk monitoring system.<br>
        Server: $(hostname)<br>
        Time: $(date)<br>
        Monitoring Script: $0</p>
    </div>
</body>
</html>
EOF

    curl --ssl-reqd \
        --url "smtps://$SMTP_HOST:$SMTP_PORT" \
        --user "$SMTP_USER:$SMTP_PASS" \
        --mail-from "$EMAIL_FROM" \
        --mail-rcpt "$EMAIL_TO" \
        --upload-file /tmp/disk_alert.txt \
        --silent || log "Failed to send disk alert email"
    
    rm -f /tmp/disk_alert.txt
}

# Get disk information
get_disk_info() {
    # Docker data root directory
    DOCKER_ROOT="/var/lib/docker"
    
    # Get disk usage for Docker directory
    DISK_INFO=$(df -h "$DOCKER_ROOT" | tail -1)
    FILESYSTEM=$(echo "$DISK_INFO" | awk '{print $1}')
    SIZE=$(echo "$DISK_INFO" | awk '{print $2}')
    USED=$(echo "$DISK_INFO" | awk '{print $3}')
    AVAILABLE=$(echo "$DISK_INFO" | awk '{print $4}')
    USAGE_PERCENT=$(echo "$DISK_INFO" | awk '{print $5}' | sed 's/%//')
    MOUNT_POINT=$(echo "$DISK_INFO" | awk '{print $6}')
    
    log "Disk usage check: ${USAGE_PERCENT}% used (${AVAILABLE} available)"
}

# Get Docker volume sizes
get_docker_volumes() {
    # Get TME Portal volume sizes
    TME_POSTGRES_SIZE=$(docker system df -v | grep "tme-portal-1_postgres_data" | awk '{print $3}' || echo "Unknown")
    TME_REDIS_SIZE=$(docker system df -v | grep "tme-portal-1_redis_data" | awk '{print $3}' || echo "Unknown")
    TME_UPLOADS_SIZE=$(docker system df -v | grep "tme-portal-1_app_uploads" | awk '{print $3}' || echo "Unknown")
    
    # Get backup directory size if it exists
    BACKUP_SIZE="Unknown"
    if [ -d "/backups" ]; then
        BACKUP_SIZE=$(du -sh /backups 2>/dev/null | cut -f1 || echo "Unknown")
    fi
}

# Get recent backup info
get_backup_info() {
    LAST_BACKUP="No backups found"
    BACKUP_COUNT=0
    
    if [ -d "/backups" ]; then
        LATEST_BACKUP=$(ls -t /backups/*.tar.gz 2>/dev/null | head -1 || echo "")
        if [ -n "$LATEST_BACKUP" ]; then
            LAST_BACKUP="$(basename "$LATEST_BACKUP") ($(date -r "$LATEST_BACKUP" '+%Y-%m-%d %H:%M'))"
            BACKUP_COUNT=$(ls -1 /backups/*.tar.gz 2>/dev/null | wc -l)
        fi
    fi
}

# Main monitoring logic
log "Starting disk space monitoring check"

# Get current disk information
get_disk_info
get_docker_volumes
get_backup_info

# Check thresholds and send alerts
if [ "$USAGE_PERCENT" -ge "$CRITICAL_THRESHOLD" ]; then
    log "CRITICAL: Disk usage at ${USAGE_PERCENT}% (threshold: ${CRITICAL_THRESHOLD}%)"
    
    send_alert "🚨 CRITICAL: TME Portal Disk Space Alert" "
        <h3>Critical Disk Space Warning</h3>
        <p><strong>Current Usage:</strong> ${USAGE_PERCENT}% (Critical threshold: ${CRITICAL_THRESHOLD}%)</p>
        <p><strong>⚠️ IMMEDIATE ACTION REQUIRED ⚠️</strong></p>
        
        <div class='metrics'>
            <h4>Disk Usage Details:</h4>
            <table>
                <tr><th>Filesystem</th><td>$FILESYSTEM</td></tr>
                <tr><th>Total Size</th><td>$SIZE</td></tr>
                <tr><th>Used Space</th><td>$USED</td></tr>
                <tr><th>Available</th><td>$AVAILABLE</td></tr>
                <tr><th>Mount Point</th><td>$MOUNT_POINT</td></tr>
            </table>
            
            <h4>Docker Volume Sizes:</h4>
            <table>
                <tr><th>PostgreSQL Data</th><td>$TME_POSTGRES_SIZE</td></tr>
                <tr><th>Redis Data</th><td>$TME_REDIS_SIZE</td></tr>
                <tr><th>App Uploads</th><td>$TME_UPLOADS_SIZE</td></tr>
                <tr><th>Backup Directory</th><td>$BACKUP_SIZE</td></tr>
            </table>
            
            <h4>Backup Information:</h4>
            <table>
                <tr><th>Latest Backup</th><td>$LAST_BACKUP</td></tr>
                <tr><th>Total Backups</th><td>$BACKUP_COUNT</td></tr>
            </table>
        </div>
        
        <h4>Recommended Actions:</h4>
        <ul>
            <li>🗂️ Clean up old Docker images: <code>docker system prune -a</code></li>
            <li>🗄️ Remove old backups beyond retention period</li>
            <li>📊 Check application logs and clear if necessary</li>
            <li>💾 Consider expanding disk space</li>
            <li>🔍 Investigate large files: <code>du -sh /var/lib/docker/*</code></li>
        </ul>
    " "critical"
    
elif [ "$USAGE_PERCENT" -ge "$WARNING_THRESHOLD" ]; then
    log "WARNING: Disk usage at ${USAGE_PERCENT}% (threshold: ${WARNING_THRESHOLD}%)"
    
    send_alert "⚠️ WARNING: TME Portal Disk Space Alert" "
        <h3>Disk Space Warning</h3>
        <p><strong>Current Usage:</strong> ${USAGE_PERCENT}% (Warning threshold: ${WARNING_THRESHOLD}%)</p>
        <p>Disk space is getting low. Consider cleanup actions soon.</p>
        
        <div class='metrics'>
            <h4>Current Status:</h4>
            <table>
                <tr><th>Available Space</th><td>$AVAILABLE</td></tr>
                <tr><th>Used Space</th><td>$USED of $SIZE</td></tr>
                <tr><th>PostgreSQL Data</th><td>$TME_POSTGRES_SIZE</td></tr>
                <tr><th>Backup Directory</th><td>$BACKUP_SIZE ($BACKUP_COUNT backups)</td></tr>
            </table>
        </div>
        
        <h4>Preventive Actions:</h4>
        <ul>
            <li>🧹 Run: <code>docker system prune</code></li>
            <li>📦 Review old backups for cleanup</li>
            <li>📈 Monitor growth trends</li>
        </ul>
    " "warning"
    
else
    log "OK: Disk usage at ${USAGE_PERCENT}% (within normal limits)"
fi

log "Disk monitoring check completed"