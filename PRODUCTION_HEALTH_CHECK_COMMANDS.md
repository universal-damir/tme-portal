# Production vs Development Health Check & Synchronization Guide

## CRITICAL: RUN THESE COMMANDS ON PRODUCTION SERVER FIRST

### Phase 1: Production Server Health Check Commands
Copy and run these commands on your production server (192.168.97.149):

```bash
# ============================================
# SECTION 1: SYSTEM & DOCKER STATUS
# ============================================

# 1.1 Check Docker containers and their status
echo "=== DOCKER CONTAINERS STATUS ===" > production_health_check.txt
docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" >> production_health_check.txt
echo "" >> production_health_check.txt

# 1.2 Check Docker volumes (CRITICAL - this caused data loss before)
echo "=== DOCKER VOLUMES ===" >> production_health_check.txt
docker volume ls | grep -E "tme|postgres|redis" >> production_health_check.txt
echo "" >> production_health_check.txt

# 1.3 Check specific volume details
echo "=== VOLUME INSPECT ===" >> production_health_check.txt
for vol in $(docker volume ls -q | grep -E "tme|postgres|redis"); do
    echo "Volume: $vol" >> production_health_check.txt
    docker volume inspect $vol | grep -E "Name|Mountpoint|CreatedAt" >> production_health_check.txt
    echo "" >> production_health_check.txt
done

# 1.4 Check Docker networks (to prevent conflicts)
echo "=== DOCKER NETWORKS ===" >> production_health_check.txt
docker network ls | grep -E "tme|bridge" >> production_health_check.txt
echo "" >> production_health_check.txt

# 1.5 Check Docker image versions
echo "=== DOCKER IMAGES ===" >> production_health_check.txt
docker images | grep -E "tme-portal|postgres|redis" >> production_health_check.txt
echo "" >> production_health_check.txt

# ============================================
# SECTION 2: DATABASE HEALTH CHECK
# ============================================

# 2.1 Get container names first
POSTGRES_CONTAINER=$(docker ps --format "{{.Names}}" | grep postgres | head -1)
echo "=== POSTGRES CONTAINER: $POSTGRES_CONTAINER ===" >> production_health_check.txt

# 2.2 Database connection info
echo "=== DATABASE CONNECTION INFO ===" >> production_health_check.txt
docker exec $POSTGRES_CONTAINER psql -U tme_user -d tme_portal -c "\conninfo" >> production_health_check.txt 2>&1
echo "" >> production_health_check.txt

# 2.3 Count records in all important tables
echo "=== DATABASE RECORD COUNTS ===" >> production_health_check.txt
docker exec $POSTGRES_CONTAINER psql -U tme_user -d tme_portal -c "
SELECT 'Applications:' as type, COUNT(*) as count FROM applications 
UNION SELECT 'Notifications:', COUNT(*) FROM notifications 
UNION SELECT 'Users:', COUNT(*) FROM users 
UNION SELECT 'Clients:', COUNT(*) FROM clients 
UNION SELECT 'Review Messages:', COUNT(*) FROM review_messages 
UNION SELECT 'User Todos:', COUNT(*) FROM user_todos
UNION SELECT 'Audit Logs:', COUNT(*) FROM audit_logs
UNION SELECT 'Sessions:', COUNT(*) FROM sessions
ORDER BY type;" >> production_health_check.txt 2>&1
echo "" >> production_health_check.txt

# 2.4 Check all database tables
echo "=== DATABASE TABLES ===" >> production_health_check.txt
docker exec $POSTGRES_CONTAINER psql -U tme_user -d tme_portal -c "\dt" >> production_health_check.txt 2>&1
echo "" >> production_health_check.txt

# 2.5 Check critical constraints (URGENCY ISSUE)
echo "=== APPLICATIONS TABLE CONSTRAINTS ===" >> production_health_check.txt
docker exec $POSTGRES_CONTAINER psql -U tme_user -d tme_portal -c "\d applications" | grep -A10 "Check constraints:" >> production_health_check.txt 2>&1
echo "" >> production_health_check.txt

# 2.6 Check for 'standard' urgency values (THE PROBLEM)
echo "=== URGENCY VALUES IN DATABASE ===" >> production_health_check.txt
docker exec $POSTGRES_CONTAINER psql -U tme_user -d tme_portal -c "SELECT urgency, COUNT(*) as count FROM applications GROUP BY urgency ORDER BY count DESC;" >> production_health_check.txt 2>&1
echo "" >> production_health_check.txt

# 2.7 Check database size and vacuum status
echo "=== DATABASE SIZE & MAINTENANCE ===" >> production_health_check.txt
docker exec $POSTGRES_CONTAINER psql -U tme_user -d tme_portal -c "SELECT pg_database_size('tme_portal')/1024/1024 as size_mb;" >> production_health_check.txt 2>&1
docker exec $POSTGRES_CONTAINER psql -U tme_user -d tme_portal -c "SELECT schemaname, tablename, last_vacuum, last_autovacuum FROM pg_stat_user_tables ORDER BY last_vacuum DESC LIMIT 5;" >> production_health_check.txt 2>&1
echo "" >> production_health_check.txt

# 2.8 Check active connections (connection pool issues)
echo "=== DATABASE CONNECTIONS ===" >> production_health_check.txt
docker exec $POSTGRES_CONTAINER psql -U tme_user -d tme_portal -c "SELECT count(*) as total_connections, state, count(*) as count FROM pg_stat_activity WHERE datname = 'tme_portal' GROUP BY state;" >> production_health_check.txt 2>&1
echo "" >> production_health_check.txt

# ============================================
# SECTION 3: APPLICATION STATUS
# ============================================

# 3.1 Get app container name
APP_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "app|portal" | grep -v postgres | grep -v redis | head -1)
echo "=== APP CONTAINER: $APP_CONTAINER ===" >> production_health_check.txt

# 3.2 Check application environment variables (sanitized)
echo "=== APP ENVIRONMENT VARIABLES (SANITIZED) ===" >> production_health_check.txt
docker exec $APP_CONTAINER env | grep -E "NODE_ENV|NEXTAUTH_URL|DATABASE_URL|REDIS_URL" | sed 's/password=[^@]*/password=****/g' >> production_health_check.txt 2>&1
echo "" >> production_health_check.txt

# 3.3 Check application file structure
echo "=== APP FILE STRUCTURE ===" >> production_health_check.txt
docker exec $APP_CONTAINER ls -la /app/ | head -20 >> production_health_check.txt 2>&1
echo "" >> production_health_check.txt

# 3.4 Check Next.js build info
echo "=== NEXT.JS BUILD INFO ===" >> production_health_check.txt
docker exec $APP_CONTAINER ls -la /app/.next/ 2>&1 | head -10 >> production_health_check.txt
docker exec $APP_CONTAINER cat /app/.next/BUILD_ID 2>&1 >> production_health_check.txt
echo "" >> production_health_check.txt

# 3.5 Check for turbopack issues
echo "=== TURBOPACK CHECK ===" >> production_health_check.txt
docker exec $APP_CONTAINER find /app -name "*turbopack*" -type f 2>&1 | head -5 >> production_health_check.txt
echo "" >> production_health_check.txt

# ============================================
# SECTION 4: REDIS STATUS
# ============================================

# 4.1 Get Redis container
REDIS_CONTAINER=$(docker ps --format "{{.Names}}" | grep redis | head -1)
echo "=== REDIS CONTAINER: $REDIS_CONTAINER ===" >> production_health_check.txt

# 4.2 Redis health check
echo "=== REDIS STATUS ===" >> production_health_check.txt
docker exec $REDIS_CONTAINER redis-cli ping >> production_health_check.txt 2>&1
docker exec $REDIS_CONTAINER redis-cli INFO server | grep -E "redis_version|uptime_in_days" >> production_health_check.txt 2>&1
docker exec $REDIS_CONTAINER redis-cli DBSIZE >> production_health_check.txt 2>&1
echo "" >> production_health_check.txt

# ============================================
# SECTION 5: POTENTIAL CONFLICTS CHECK
# ============================================

# 5.1 Check for duplicate or conflicting containers
echo "=== POTENTIAL CONTAINER CONFLICTS ===" >> production_health_check.txt
docker ps -a | grep -E "tme|postgres|redis" | awk '{print $NF}' | sort | uniq -d >> production_health_check.txt
echo "" >> production_health_check.txt

# 5.2 Check disk space
echo "=== DISK SPACE ===" >> production_health_check.txt
df -h | grep -E "/$|/var/lib/docker" >> production_health_check.txt
echo "" >> production_health_check.txt

# 5.3 Check system resources
echo "=== SYSTEM RESOURCES ===" >> production_health_check.txt
free -h >> production_health_check.txt
echo "" >> production_health_check.txt

# ============================================
# SECTION 6: APPLICATION LOGS (Last Errors)
# ============================================

# 6.1 Check for recent errors
echo "=== RECENT APPLICATION ERRORS ===" >> production_health_check.txt
docker logs $APP_CONTAINER 2>&1 | grep -i error | tail -10 >> production_health_check.txt
echo "" >> production_health_check.txt

# 6.2 Check for urgency-related errors
echo "=== URGENCY-RELATED ERRORS ===" >> production_health_check.txt
docker logs $APP_CONTAINER 2>&1 | grep -i "urgency\|standard" | tail -10 >> production_health_check.txt
echo "" >> production_health_check.txt

# ============================================
# SECTION 7: BACKUP CURRENT STATE
# ============================================

# 7.1 Create timestamped backup
BACKUP_TIME=$(date +%Y%m%d-%H%M%S)
echo "=== CREATING BACKUP: backup_production_${BACKUP_TIME}.sql ===" >> production_health_check.txt
docker exec $POSTGRES_CONTAINER pg_dump -U tme_user -d tme_portal > backup_production_${BACKUP_TIME}.sql
echo "Backup size: $(ls -lh backup_production_${BACKUP_TIME}.sql | awk '{print $5}')" >> production_health_check.txt
echo "" >> production_health_check.txt

# ============================================
# FINAL: Show summary
# ============================================
echo "=== HEALTH CHECK COMPLETE ===" >> production_health_check.txt
echo "Report saved to: production_health_check.txt" >> production_health_check.txt
echo "Database backup: backup_production_${BACKUP_TIME}.sql" >> production_health_check.txt
echo "" >> production_health_check.txt
echo "Please send both files back for analysis" >> production_health_check.txt

# Display the report
cat production_health_check.txt
```

## After Running on Production:

1. **Send me the `production_health_check.txt` file**
2. **Send me the backup file `backup_production_*.sql`**

---

## Phase 2: Local Development Comparison

I'll now run similar commands locally to compare:

```bash
# These commands will be run on your local development machine
# Results will be compared with production to identify discrepancies
```