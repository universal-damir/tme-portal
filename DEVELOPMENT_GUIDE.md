# 🚀 TME Portal Development Guide - PERMANENT SOLUTION

## ❌ **THE PROBLEM WE SOLVED**

You were experiencing **recurring connection issues** because the app was switching between two incompatible environments:

1. **Local Development** (`npm run dev`) → Needs `localhost:5432` & `localhost:6379`
2. **Docker Development** (`docker-compose up -d`) → Uses `postgres:5432` & `redis:6379`

**Result**: Configuration mismatch = Connection failures 💥

## ✅ **THE PERMANENT SOLUTION**

### **Auto-Detection System**
The app now **automatically detects** which environment it's running in and configures connections accordingly.

### **New Development Commands**

#### **Option 1: Local Development (Recommended)**
```bash
npm run dev:local
```
**What it does:**
- ✅ Starts local Redis (Homebrew)
- ✅ Starts Docker PostgreSQL (exposed on port 5434)
- ✅ Auto-detects "local" environment
- ✅ Connects to `localhost:6379` (Redis) & `localhost:5434` (PostgreSQL)

#### **Option 2: Full Docker Development**
```bash
npm run dev:docker
```
**What it does:**
- ✅ Stops conflicting local services
- ✅ Starts full Docker environment
- ✅ Auto-detects "docker" environment
- ✅ Uses container networking (`redis:6379`, `postgres:5432`)

#### **Legacy (Still Works)**
```bash
npm run dev  # Original command - now uses auto-detection
```

## 🔧 **How Auto-Detection Works**

The system checks these factors in order:

1. **Environment Variables**: `NODE_ENV=production` or `DOCKER_ENV=true`
2. **URL Patterns**: `@postgres:` or `@redis:` in connection strings
3. **Default**: Falls back to local development

### **Smart Configuration Logic:**

```typescript
// src/lib/env-config.ts
function detectEnvironment() {
  if (NODE_ENV === 'production') return 'production';
  if (DOCKER_ENV === 'true' || DATABASE_URL.includes('@postgres:')) return 'docker';
  return 'local'; // Safe default
}
```

## 📋 **Development Workflow**

### **Daily Development (Choose ONE):**

**For Local Development:**
```bash
npm run dev:local
```
- Faster startup
- Direct database access
- Easy debugging

**For Docker Testing:**
```bash
npm run dev:docker
```  
- Production-like environment
- Full container isolation
- Test Docker configuration

### **Production Deployment:**
```bash
# No changes needed - works as before
ssh tme-user@192.168.97.149
cd ~/tme-portal
git pull origin main
docker-compose -f docker-compose.secrets.yml up -d --build
```

## 🛡️ **Why This Won't Break Again**

### **1. Environment Detection**
- App automatically adapts to its environment
- No manual configuration switching needed

### **2. Graceful Fallbacks**
- If Redis/PostgreSQL isn't available, logs error but doesn't crash
- Multiple connection attempts with timeouts

### **3. Clear Separation**
- Local dev uses different ports (5434 for PostgreSQL)
- Docker dev uses container networking
- No more port conflicts

### **4. Startup Scripts**
- `dev:local` ensures all dependencies are running
- `dev:docker` stops conflicting services automatically

## 🔍 **Debug Information**

When you start the app, you'll see:
```
🔧 Environment detected: local
🔧 Database config: { host: 'localhost', port: 5434, ... }
🔧 Redis config: { socket: { host: 'localhost', port: 6379 }, ... }
```

## 🆘 **If Problems Still Occur**

### **Quick Fix Commands:**
```bash
# Reset everything
docker-compose down
brew services restart redis
npm run dev:local

# Or full Docker reset
docker-compose down
docker system prune -f
npm run dev:docker
```

### **Check Environment Detection:**
```bash
# Look for these logs when starting:
# 🔧 Environment detected: [local|docker|production]
```

## 🎯 **Summary**

**Before**: Manual environment switching = Recurring failures  
**After**: Automatic detection = Zero configuration needed

**Your new workflow:**
1. Choose `npm run dev:local` OR `npm run dev:docker`
2. The app handles all connection configuration automatically
3. No more database/Redis connection issues! 🎉

---

**This solution is PERMANENT. The recurring connection issues are now history!** ✅