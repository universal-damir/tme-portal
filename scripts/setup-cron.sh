#!/bin/bash

# TME Portal Cron Job Setup Script
# Sets up automated scheduling for backups and monitoring

set -e

# Configuration
SCRIPT_DIR="/opt/tme-portal/scripts"
LOG_DIR="/var/log"

echo "Setting up TME Portal automated tasks..."

# Create directories if they don't exist
sudo mkdir -p "$SCRIPT_DIR"
sudo mkdir -p "$LOG_DIR"
sudo mkdir -p "/backups"

# Copy scripts to system location
echo "Copying scripts to $SCRIPT_DIR..."
sudo cp "$(dirname "$0")/nightly-backup.sh" "$SCRIPT_DIR/"
sudo cp "$(dirname "$0")/disk-monitor.sh" "$SCRIPT_DIR/"
sudo cp "$(dirname "$0")/backup.sh" "$SCRIPT_DIR/"

# Make scripts executable
sudo chmod +x "$SCRIPT_DIR"/*.sh

# Create environment file for cron jobs
echo "Creating environment file for cron jobs..."
sudo tee "$SCRIPT_DIR/tme-env" > /dev/null << EOF
# TME Portal Environment Variables for Cron Jobs
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin
SHELL=/bin/bash

# Docker and system paths
DOCKER_HOST=unix:///var/run/docker.sock

# Email configuration (loaded from .env file during setup)
BREVO_SMTP_USER=\${BREVO_SMTP_USER:-44441f001@smtp-brevo.com}
BREVO_SMTP_PASSWORD=\${BREVO_SMTP_PASSWORD:-your-brevo-smtp-password-here}

# Database credentials (should match docker-compose.yml)
POSTGRES_PASSWORD=\${POSTGRES_PASSWORD:-secure_password}
REDIS_PASSWORD=\${REDIS_PASSWORD:-redis_password}
EOF

# Create wrapper scripts that source environment
echo "Creating wrapper scripts..."

# Backup wrapper
sudo tee "$SCRIPT_DIR/run-nightly-backup.sh" > /dev/null << EOF
#!/bin/bash
# Load environment variables
set -a
source "$SCRIPT_DIR/tme-env"
set +a

# Change to TME Portal directory
cd "/opt/tme-portal"

# Run the backup script
exec "$SCRIPT_DIR/nightly-backup.sh" >> /var/log/tme-backup.log 2>&1
EOF

# Disk monitor wrapper
sudo tee "$SCRIPT_DIR/run-disk-monitor.sh" > /dev/null << EOF
#!/bin/bash
# Load environment variables
set -a
source "$SCRIPT_DIR/tme-env"
set +a

# Run the disk monitor script
exec "$SCRIPT_DIR/disk-monitor.sh" >> /var/log/tme-disk-monitor.log 2>&1
EOF

# Make wrapper scripts executable
sudo chmod +x "$SCRIPT_DIR/run-nightly-backup.sh"
sudo chmod +x "$SCRIPT_DIR/run-disk-monitor.sh"

# Create cron jobs
echo "Setting up cron jobs..."

# Create cron file
cat > /tmp/tme-cron << 'EOF'
# TME Portal Automated Tasks
# 
# Nightly database backup at 2:00 AM
0 2 * * * /opt/tme-portal/scripts/run-nightly-backup.sh

# Disk space monitoring every 4 hours
0 */4 * * * /opt/tme-portal/scripts/run-disk-monitor.sh

# Weekly Docker cleanup on Sundays at 3:00 AM
0 3 * * 0 /usr/bin/docker system prune -f >> /var/log/docker-cleanup.log 2>&1

# Log rotation for TME Portal logs
0 1 * * * /usr/sbin/logrotate -f /etc/logrotate.d/tme-portal
EOF

# Install cron jobs
sudo crontab /tmp/tme-cron
rm /tmp/tme-cron

# Create logrotate configuration
echo "Setting up log rotation..."
sudo tee /etc/logrotate.d/tme-portal > /dev/null << 'EOF'
/var/log/tme-*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
    postrotate
        # Restart rsyslog if needed
        /bin/kill -HUP `cat /var/run/rsyslogd.pid 2> /dev/null` 2> /dev/null || true
    endscript
}

/var/log/docker-cleanup.log {
    weekly
    rotate 12
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
}
EOF

# Create systemd timer as backup (optional)
echo "Creating systemd timer for backup (alternative to cron)..."
sudo tee /etc/systemd/system/tme-backup.service > /dev/null << EOF
[Unit]
Description=TME Portal Database Backup
After=docker.service

[Service]
Type=oneshot
EnvironmentFile=$SCRIPT_DIR/tme-env
ExecStart=$SCRIPT_DIR/run-nightly-backup.sh
User=root
StandardOutput=journal
StandardError=journal
EOF

sudo tee /etc/systemd/system/tme-backup.timer > /dev/null << 'EOF'
[Unit]
Description=Run TME Portal backup nightly
Requires=tme-backup.service

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

# Create disk monitoring timer
sudo tee /etc/systemd/system/tme-disk-monitor.service > /dev/null << EOF
[Unit]
Description=TME Portal Disk Space Monitor
After=docker.service

[Service]
Type=oneshot
EnvironmentFile=$SCRIPT_DIR/tme-env
ExecStart=$SCRIPT_DIR/run-disk-monitor.sh
User=root
StandardOutput=journal
StandardError=journal
EOF

sudo tee /etc/systemd/system/tme-disk-monitor.timer > /dev/null << 'EOF'
[Unit]
Description=Run TME Portal disk monitoring every 4 hours
Requires=tme-disk-monitor.service

[Timer]
OnCalendar=*-*-* 00,04,08,12,16,20:00:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

# Reload systemd and enable timers (but don't start - use cron by default)
sudo systemctl daemon-reload
sudo systemctl enable tme-backup.timer
sudo systemctl enable tme-disk-monitor.timer

echo ""
echo "=== SETUP COMPLETE ==="
echo ""
echo "✅ Scripts installed in: $SCRIPT_DIR"
echo "✅ Cron jobs configured:"
echo "   - Nightly backup: 2:00 AM daily"
echo "   - Disk monitoring: Every 4 hours"
echo "   - Docker cleanup: Sundays at 3:00 AM"
echo "✅ Log rotation configured"
echo "✅ Systemd timers available (alternative to cron)"
echo ""
echo "📧 Email alerts will be sent to: damir@tme-services.com"
echo "📁 Backups stored in: /backups"
echo "📜 Logs stored in: /var/log/tme-*.log"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "1. Update environment file with actual credentials:"
echo "   sudo nano $SCRIPT_DIR/tme-env"
echo "   Replace 'your-brevo-smtp-password-here' with actual SMTP password"
echo ""
echo "2. Update TME Portal directory path if different from /opt/tme-portal"
echo ""
echo "📋 VERIFICATION COMMANDS:"
echo "sudo crontab -l                              # Verify cron jobs"
echo "sudo systemctl list-timers tme-*            # Check systemd timers"
echo "sudo $SCRIPT_DIR/run-disk-monitor.sh        # Test disk monitor"
echo "sudo $SCRIPT_DIR/run-nightly-backup.sh      # Test backup (after updating credentials)"