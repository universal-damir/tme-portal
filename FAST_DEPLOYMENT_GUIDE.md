# Fast Deployment Guide for TME Portal (Air-Gapped Environment)

## Overview
Deploy code changes in **22MB** instead of **1.1GB** Docker images. This method updates only the application code, not the entire Docker container.

---

## 📦 On Your Local Machine

### 1. Make Your Code Changes
Edit your files as needed (components, API routes, etc.)

### 2. Build the Application
```bash
npm run build
```
This compiles your code into optimized production bundles.

### 3. Create Update Package
```bash
# Create a timestamped tar file with just the compiled code
tar -czf update-$(date +%Y%m%d-%H%M%S).tar.gz \
  .next/standalone/ \
  .next/static/ \
  public/
```
This creates a file like `update-20250813-212024.tar.gz` (~22MB)

### 4. Transfer to Server
```bash
# Replace filename with your actual tar file name
scp update-20250813-212024.tar.gz tme-user@192.168.97.149:~/
```

---

## 🖥️ On the Production Server

### 1. Connect to Server
```bash
ssh tme-user@192.168.97.149
```

### 2. Extract the Update Package
```bash
# Replace with your actual filename
tar -xzf update-20250813-212024.tar.gz
```

### 3. Copy Files into Docker Container
```bash
# Copy the compiled application files
docker cp .next/standalone/. tme-user-app-1:/app/
docker cp .next/static tme-user-app-1:/app/.next/
docker cp public/. tme-user-app-1:/app/public/
```

### 4. Restart the Container
```bash
docker restart tme-user-app-1
```

### 5. Verify Deployment
```bash
# Check container is running
docker ps | grep tme-user-app-1

# Check logs if needed
docker logs --tail 50 tme-user-app-1
```

Your app should be live at http://192.168.97.149/ within 30 seconds!

---

## 🚀 Quick One-Liner Scripts

### Create Alias for Local Build & Package (add to ~/.bashrc or ~/.zshrc)
```bash
alias tme-deploy='npm run build && tar -czf update-$(date +%Y%m%d-%H%M%S).tar.gz .next/standalone/ .next/static/ public/ && echo "Package ready: $(ls -lh update-*.tar.gz | tail -1)"'
```

### Create Script on Server (save as apply-update.sh)
```bash
#!/bin/bash
# Usage: ./apply-update.sh update-20250813-212024.tar.gz

if [ -z "$1" ]; then
  echo "Usage: $0 <update-file.tar.gz>"
  exit 1
fi

echo "Applying update: $1"
tar -xzf $1
docker cp .next/standalone/. tme-user-app-1:/app/
docker cp .next/static tme-user-app-1:/app/.next/
docker cp public/. tme-user-app-1:/app/public/
docker restart tme-user-app-1
echo "✅ Update applied! Site restarting..."
```

---

## 📋 When to Use This Method

### ✅ USE Fast Deploy (22MB) for:
- Component changes (React/UI)
- API route modifications
- Bug fixes in existing code
- Style/CSS updates
- Configuration changes
- Text/content updates
- Adding new pages/routes

### ❌ USE Full Docker Rebuild (1.1GB) for:
- Adding new npm packages (package.json changes)
- Node.js version updates
- Dockerfile modifications
- System-level dependency changes
- Database schema changes (also run migrations)
- Environment variable structure changes

---

## 🔍 Troubleshooting

### If deployment fails:
```bash
# Check container logs
docker logs --tail 100 tme-user-app-1

# Verify files were copied
docker exec tme-user-app-1 ls -la /app/

# Check container status
docker ps -a | grep tme-user
```

### Rollback if needed:
Keep previous update packages to quickly rollback:
```bash
# Apply previous update
./apply-update.sh update-20250813-210000.tar.gz
```

---

## 💡 Pro Tips

1. **Name your updates**: Instead of timestamps, use descriptive names:
   ```bash
   tar -czf update-fix-login-bug.tar.gz .next/standalone/ .next/static/ public/
   ```

2. **Keep a deployment log** on the server:
   ```bash
   echo "$(date): Applied $1" >> deployment.log
   ```

3. **Test locally first**: Always run `npm run dev` to test before building

4. **Batch changes**: Group multiple small changes into one deployment

5. **Clean up old updates** on server periodically:
   ```bash
   ls -lt update-*.tar.gz | tail -n +6 | awk '{print $9}' | xargs rm -f
   ```

---

## 📊 Performance Comparison

| Method | Transfer Size | Time | Downtime |
|--------|--------------|------|----------|
| Full Docker Rebuild | 1.1GB | 15-20 min | 2-3 min |
| Fast Deploy | 22MB | 1-2 min | 10-30 sec |
| **Improvement** | **50x smaller** | **10x faster** | **6x less** |

---

## 🎯 Summary

**Every deployment only needs these 2 commands after setup:**

Local:
```bash
npm run build && tar -czf update.tar.gz .next/standalone/ .next/static/ public/
```

Server:
```bash
tar -xzf update.tar.gz && docker cp .next/standalone/. tme-user-app-1:/app/ && docker cp .next/static tme-user-app-1:/app/.next/ && docker cp public/. tme-user-app-1:/app/public/ && docker restart tme-user-app-1
```

That's it! Your changes are live in under 2 minutes! 🚀