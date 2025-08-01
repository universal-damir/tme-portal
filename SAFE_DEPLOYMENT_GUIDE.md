# 🚀 TME Portal - Safe Production Deployment Guide

**⚠️ IMPORTANT: Follow this guide step-by-step. Don't skip verification steps!**

---

## 📋 Pre-Deployment Checklist

### ✅ Before You Start
- [ ] All changes committed and pushed to GitHub
- [ ] You have SSH access to production server
- [ ] Current production is working (test at http://192.168.97.149:3000)
- [ ] Have backup access to database if needed

---

## 🔄 DEPLOYMENT PROCESS

### Step 1: Prepare Local Environment

**1.1 Check your current changes:**
```bash
# Check what files you've modified
git status

# Review your changes
git diff
```

**1.2 Commit and push changes:**
```bash
# Add all changes
git add .

# Commit with descriptive message
git commit -m "feat: Optimize PDF size and add backup automation"

# Push to GitHub
git push origin main
```

**✅ Verification:** Check GitHub to ensure your changes are pushed.

---

### Step 2: Connect to Production Server

**2.1 SSH to production server:**
```bash
ssh tme-user@192.168.97.149
```

**✅ Verification:** You should see the server prompt. Test with:
```bash
# Check current location
pwd
# Should show: /home/tme-user

# Check if TME Portal directory exists
ls -la ~/tme-portal
```

---

### Step 3: Pre-Deployment Safety Checks

**3.1 Check current application status:**
```bash
cd ~/tme-portal

# Check if containers are running
docker-compose -f docker-compose.secrets.yml ps
```

**3.2 Test current application (IMPORTANT):**
```bash
# Test if application is working
curl -I http://192.168.97.149:3000

# Should return: HTTP/1.1 200 OK or similar
```

**3.3 Create emergency backup (SAFETY NET):**
```bash
# Create manual backup before deployment
docker-compose -f docker-compose.secrets.yml run --rm backup

# Verify backup was created
ls -la ~/tme-portal/backups/
```

**✅ Verification:** Backup file should be present with today's date.

---

### Step 4: Pull Latest Changes

**4.1 Fetch latest code:**
```bash
# Make sure you're in the right directory
cd ~/tme-portal

# Check current branch
git branch

# Fetch latest changes (SAFE - doesn't change anything yet)
git fetch origin main

# See what changes will be pulled
git log HEAD..origin/main --oneline
```

**4.2 Pull the changes:**
```bash
# Pull latest changes
git pull origin main
```

**✅ Verification:** You should see your recent changes being pulled.

---

### Step 5: Pre-Build Safety Check

**5.1 Check Docker Compose file:**
```bash
# Verify docker-compose.secrets.yml exists and is correct
ls -la docker-compose.secrets.yml

# Check the file content (ensure NEXTAUTH_URL is correct)
grep "NEXTAUTH_URL" docker-compose.secrets.yml
# Should show: - NEXTAUTH_URL=http://192.168.97.149:3000
```

**5.2 Check available disk space:**
```bash
# Check disk space (should have at least 2GB free)
df -h /
```

**✅ Verification:** Ensure you have enough space for the deployment.

---

### Step 6: Gradual Deployment (SAFEST APPROACH)

**6.1 Stop current services (but keep database running):**
```bash
# Stop only the app, keep postgres and redis running
docker-compose -f docker-compose.secrets.yml stop app
```

**6.2 Build new image:**
```bash
# Build new image (this won't affect running database)
docker-compose -f docker-compose.secrets.yml build app
```

**✅ Verification:** Build should complete without errors.

**6.3 Start updated application:**
```bash
# Start the app with new image
docker-compose -f docker-compose.secrets.yml up -d app
```

**6.4 Wait and verify:**
```bash
# Wait 30 seconds for application to start
sleep 30

# Check container status
docker-compose -f docker-compose.secrets.yml ps

# All containers should show "Up" status
```

---

### Step 7: Post-Deployment Verification

**7.1 Check application health:**
```bash
# Test application response (most important check)
curl -I http://192.168.97.149:3000

# Should return HTTP/1.1 200 OK
```

**7.2 Check application logs:**
```bash
# Check recent logs for errors
docker-compose -f docker-compose.secrets.yml logs --tail=50 app

# Look for any ERROR messages
```

**7.3 Test login functionality:**
```bash
# Test login page specifically
curl -s http://192.168.97.149:3000/login | grep -i "login\|error"

# Should return login page HTML, no error messages
```

**7.4 Test database connectivity:**
```bash
# Test database connection
docker-compose -f docker-compose.secrets.yml exec postgres pg_isready -U tme_user

# Should return: accepting connections
```

---

### Step 8: Final Verification

**8.1 Complete system check:**
```bash
# Check all services are running
docker-compose -f docker-compose.secrets.yml ps

# Check system resources
docker stats --no-stream
```

**8.2 Test from your local machine:**
```bash
# On your LOCAL machine, test the production URL
curl -I http://192.168.97.149:3000
```

**✅ Success Indicators:**
- [ ] All containers show "Up" status
- [ ] Application responds with HTTP 200
- [ ] No error messages in logs
- [ ] Login page loads correctly
- [ ] Database connections working

---

## 🆘 EMERGENCY ROLLBACK (If Something Goes Wrong)

**If deployment fails, follow these steps immediately:**

### Option 1: Quick Restart
```bash
# Stop all services
docker-compose -f docker-compose.secrets.yml down

# Start services again
docker-compose -f docker-compose.secrets.yml up -d

# Wait 30 seconds and test
sleep 30
curl -I http://192.168.97.149:3000
```

### Option 2: Rollback to Previous Version
```bash
# Go back to previous git commit
git log --oneline -5
# Note the previous commit hash

# Rollback (replace COMMIT_HASH with actual hash)
git checkout COMMIT_HASH

# Rebuild and restart
docker-compose -f docker-compose.secrets.yml down
docker-compose -f docker-compose.secrets.yml up -d --build
```

### Option 3: Restore from Backup (Last Resort)
```bash
# Stop services
docker-compose -f docker-compose.secrets.yml down

# Find latest backup
ls -la ~/tme-portal/backups/

# Restore database (replace with actual backup filename)
docker-compose -f docker-compose.secrets.yml up -d postgres
# Wait for postgres to start
sleep 10

# Restore backup
docker-compose -f docker-compose.secrets.yml exec postgres psql -U tme_user -d tme_portal < backups/BACKUP_FILE.sql

# Start all services
docker-compose -f docker-compose.secrets.yml up -d
```

---

## 📱 Contact Information

**If you encounter issues:**
- Check logs: `docker-compose -f docker-compose.secrets.yml logs -f`
- Server status: `docker-compose -f docker-compose.secrets.yml ps`
- System resources: `docker stats --no-stream`

**Emergency contacts:**
- System logs: `/var/log/tme-*.log`
- Backup location: `~/tme-portal/backups/`

---

## 🎉 Success! 

**If all checks pass:**
✅ Your TME Portal is successfully deployed!
✅ Access it at: http://192.168.97.149:3000
✅ Automated backups are running nightly
✅ Disk monitoring is active

**Exit the server:**
```bash
exit
```

---

## 📝 Post-Deployment Notes

**Document this deployment:**
- Date: $(date)
- Changes deployed: [Your changes description]
- Backup created: [Backup filename]
- Status: Success ✅

**Next deployment:**
Follow this same guide for consistent, safe deployments.