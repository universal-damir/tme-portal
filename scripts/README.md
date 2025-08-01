# TME Portal Automation Scripts

This directory contains automated backup and monitoring scripts for the TME Portal Docker deployment.

## 📁 Scripts Overview

### Core Scripts
- **`backup.sh`** - Database backup script (existing)
- **`nightly-backup.sh`** - Enhanced backup with email notifications
- **`disk-monitor.sh`** - Disk space monitoring with alerts
- **`setup-cron.sh`** - Automated setup for cron jobs and systemd timers

## 🚀 Quick Setup

1. **Install on Docker Host:**
   ```bash
   # Copy TME Portal to production server
   scp -r "tme portal v5.2" user@docker-host:/opt/tme-portal
   
   # Run setup script on Docker host
   cd /opt/tme-portal/scripts
   sudo chmod +x setup-cron.sh
   sudo ./setup-cron.sh
   ```

2. **Verify Installation:**
   ```bash
   # Check cron jobs
   sudo crontab -l
   
   # Check systemd timers
   sudo systemctl list-timers tme-*
   
   # Test scripts manually
   sudo /opt/tme-portal/scripts/run-disk-monitor.sh
   ```

## 📧 Email Notifications

All scripts send HTML email alerts to `damir@tme-services.com` using Brevo SMTP:

### Backup Notifications
- ✅ **Success**: Backup completed with size and disk usage info
- ❌ **Failure**: Backup failed with error details

### Disk Space Alerts
- ⚠️ **Warning (80%+)**: Preventive cleanup recommendations
- 🚨 **Critical (90%+)**: Immediate action required with detailed metrics

## ⏰ Schedule

| Task | Frequency | Time | Description |
|------|-----------|------|-------------|
| Database Backup | Daily | 2:00 AM | Full PostgreSQL + Redis backup |
| Disk Monitoring | Every 4 hours | 00,04,08,12,16,20:00 | Check disk space |
| Docker Cleanup | Weekly | Sunday 3:00 AM | Remove unused images/containers |

## 📊 Monitoring Thresholds

- **Warning**: 80% disk usage
- **Critical**: 90% disk usage
- **Backup Retention**: 30 days
- **Log Retention**: 30 days (rotated daily)

## 🔧 Configuration

### Environment Variables
Scripts use environment variables from `/opt/tme-portal/scripts/tme-env`:
```bash
BREVO_SMTP_USER=your-smtp-user
BREVO_SMTP_PASSWORD=your-smtp-password
POSTGRES_PASSWORD=secure_password
REDIS_PASSWORD=redis_password
```

### Directory Structure
```
/opt/tme-portal/
├── scripts/
│   ├── backup.sh              # Original backup script
│   ├── nightly-backup.sh      # Enhanced backup with notifications
│   ├── disk-monitor.sh        # Disk space monitoring
│   ├── run-nightly-backup.sh  # Cron wrapper for backup
│   ├── run-disk-monitor.sh    # Cron wrapper for monitoring
│   └── tme-env                # Environment variables
├── backups/                   # Backup storage (auto-created)
└── docker-compose.yml         # Docker configuration
```

### Log Files
```
/var/log/tme-backup.log        # Backup operation logs
/var/log/tme-disk-monitor.log  # Disk monitoring logs
/var/log/docker-cleanup.log    # Docker cleanup logs
```

## 🛠️ Manual Operations

### Test Scripts
```bash
# Test backup (will send email)
sudo /opt/tme-portal/scripts/run-nightly-backup.sh

# Test disk monitoring (will send email if thresholds exceeded)
sudo /opt/tme-portal/scripts/run-disk-monitor.sh

# Run Docker cleanup
sudo docker system prune -f
```

### Backup Operations
```bash
# List available backups
ls -la /backups/

# Restore from backup
cd /opt/tme-portal
docker-compose down
# Restore database from backup file
docker-compose up -d
```

### Troubleshooting
```bash
# Check cron service
sudo systemctl status cron

# View recent logs
sudo tail -f /var/log/tme-backup.log
sudo tail -f /var/log/tme-disk-monitor.log

# Test email configuration
curl --ssl-reqd --url "smtps://smtp-relay.brevo.com:587" \
     --user "your-user:your-password" \
     --mail-from "test@tme-services.com" \
     --mail-rcpt "damir@tme-services.com" \
     --upload-file test-email.txt
```

## 🔒 Security Notes

- Scripts run as root (required for Docker access)
- SMTP credentials stored in environment file
- Backup files contain sensitive data - secure the `/backups` directory
- Log files may contain database connection info - restrict access

## 📋 Maintenance

### Weekly Tasks
- Review backup success emails
- Check disk space alerts
- Verify backup file integrity

### Monthly Tasks
- Test backup restoration process
- Review log file sizes
- Update retention policies if needed

### Emergency Procedures
- **Disk Full**: Run `docker system prune -a` and clean old backups
- **Backup Failure**: Check Docker containers and database connectivity
- **Email Issues**: Verify SMTP credentials and network connectivity

## 🔄 Future Enhancements

- [ ] Backup to external/cloud storage
- [ ] Database replication setup
- [ ] Performance monitoring alerts
- [ ] Application health checks
- [ ] Automated security updates