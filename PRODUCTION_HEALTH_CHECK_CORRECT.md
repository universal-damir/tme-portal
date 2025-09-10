# Corrected Production Health Check Commands

Based on your output, here are the correct commands to run:

```bash
# Use the correct PostgreSQL container: tme-user-postgres-1
POSTGRES_CONTAINER="tme-user-postgres-1"
echo "Using PostgreSQL container: $POSTGRES_CONTAINER"

# 1. Check which database user exists
echo "=== CHECK DATABASE USERS ===" >> production_health_check_fixed.txt
docker exec $POSTGRES_CONTAINER psql -U postgres -c "\du" >> production_health_check_fixed.txt 2>&1
echo "" >> production_health_check_fixed.txt

# 2. List all databases
echo "=== LIST ALL DATABASES ===" >> production_health_check_fixed.txt
docker exec $POSTGRES_CONTAINER psql -U postgres -l >> production_health_check_fixed.txt 2>&1
echo "" >> production_health_check_fixed.txt

# 3. Now connect to tme_portal database with correct user
echo "=== DATABASE RECORD COUNTS ===" >> production_health_check_fixed.txt
docker exec $POSTGRES_CONTAINER psql -U postgres -d tme_portal -c "
SELECT 'Applications:' as type, COUNT(*) as count FROM applications 
UNION SELECT 'Notifications:', COUNT(*) FROM notifications 
UNION SELECT 'Users:', COUNT(*) FROM users 
UNION SELECT 'Clients:', COUNT(*) FROM clients 
UNION SELECT 'Review Messages:', COUNT(*) FROM review_messages 
UNION SELECT 'User Todos:', COUNT(*) FROM user_todos
UNION SELECT 'Audit Logs:', COUNT(*) FROM audit_logs
UNION SELECT 'Sessions:', COUNT(*) FROM sessions
ORDER BY type;" >> production_health_check_fixed.txt 2>&1
echo "" >> production_health_check_fixed.txt

# 4. Check all tables
echo "=== ALL DATABASE TABLES ===" >> production_health_check_fixed.txt
docker exec $POSTGRES_CONTAINER psql -U postgres -d tme_portal -c "\dt" >> production_health_check_fixed.txt 2>&1
echo "" >> production_health_check_fixed.txt

# 5. Check applications table structure and constraints
echo "=== APPLICATIONS TABLE FULL STRUCTURE ===" >> production_health_check_fixed.txt
docker exec $POSTGRES_CONTAINER psql -U postgres -d tme_portal -c "\d applications" >> production_health_check_fixed.txt 2>&1
echo "" >> production_health_check_fixed.txt

# 6. Check user_todos constraints (this is showing errors)
echo "=== USER_TODOS TABLE STRUCTURE ===" >> production_health_check_fixed.txt
docker exec $POSTGRES_CONTAINER psql -U postgres -d tme_portal -c "\d user_todos" >> production_health_check_fixed.txt 2>&1
echo "" >> production_health_check_fixed.txt

# 7. Check actual urgency values in applications
echo "=== URGENCY VALUES IN APPLICATIONS ===" >> production_health_check_fixed.txt
docker exec $POSTGRES_CONTAINER psql -U postgres -d tme_portal -c "SELECT urgency, COUNT(*) FROM applications GROUP BY urgency;" >> production_health_check_fixed.txt 2>&1
echo "" >> production_health_check_fixed.txt

# 8. Check actual category values in user_todos
echo "=== CATEGORY VALUES IN USER_TODOS ===" >> production_health_check_fixed.txt
docker exec $POSTGRES_CONTAINER psql -U postgres -d tme_portal -c "SELECT category, COUNT(*) FROM user_todos GROUP BY category;" >> production_health_check_fixed.txt 2>&1
echo "" >> production_health_check_fixed.txt

# 9. Check which migrations have been applied
echo "=== CHECK MIGRATION COLUMNS ===" >> production_health_check_fixed.txt
docker exec $POSTGRES_CONTAINER psql -U postgres -d tme_portal -c "
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'applications' 
AND column_name IN ('urgency', 'revision_count', 'submitter_message')
ORDER BY column_name;" >> production_health_check_fixed.txt 2>&1
echo "" >> production_health_check_fixed.txt

# 10. Check clients table structure
echo "=== CLIENTS TABLE STRUCTURE ===" >> production_health_check_fixed.txt
docker exec $POSTGRES_CONTAINER psql -U postgres -d tme_portal -c "\d clients" >> production_health_check_fixed.txt 2>&1
echo "" >> production_health_check_fixed.txt

# 11. Database size and maintenance
echo "=== DATABASE SIZE ===" >> production_health_check_fixed.txt
docker exec $POSTGRES_CONTAINER psql -U postgres -d tme_portal -c "SELECT pg_database_size('tme_portal')/1024/1024 as size_mb;" >> production_health_check_fixed.txt 2>&1
echo "" >> production_health_check_fixed.txt

# 12. Check active connections
echo "=== ACTIVE DATABASE CONNECTIONS ===" >> production_health_check_fixed.txt
docker exec $POSTGRES_CONTAINER psql -U postgres -d tme_portal -c "
SELECT pid, usename, application_name, client_addr, state, query_start 
FROM pg_stat_activity 
WHERE datname = 'tme_portal' 
ORDER BY query_start DESC;" >> production_health_check_fixed.txt 2>&1
echo "" >> production_health_check_fixed.txt

# 13. Create proper backup
BACKUP_TIME=$(date +%Y%m%d-%H%M%S)
echo "=== CREATING DATABASE BACKUP ===" >> production_health_check_fixed.txt
docker exec $POSTGRES_CONTAINER pg_dump -U postgres -d tme_portal > backup_production_${BACKUP_TIME}.sql
ls -lh backup_production_${BACKUP_TIME}.sql >> production_health_check_fixed.txt 2>&1
echo "" >> production_health_check_fixed.txt

# 14. Check Redis with authentication
echo "=== REDIS STATUS WITH AUTH ===" >> production_health_check_fixed.txt
docker exec tme-user-redis-1 redis-cli -a 2UvSulxR79obMWJ3dfCcb6zs ping >> production_health_check_fixed.txt 2>&1
docker exec tme-user-redis-1 redis-cli -a 2UvSulxR79obMWJ3dfCcb6zs INFO server | grep -E "redis_version|uptime_in_days" >> production_health_check_fixed.txt 2>&1
docker exec tme-user-redis-1 redis-cli -a 2UvSulxR79obMWJ3dfCcb6zs DBSIZE >> production_health_check_fixed.txt 2>&1
echo "" >> production_health_check_fixed.txt

# 15. Check what's in the old volumes (might have data)
echo "=== CHECK OLD VOLUME DATA ===" >> production_health_check_fixed.txt
echo "Old postgres volume content:" >> production_health_check_fixed.txt
sudo ls -la /var/lib/docker/volumes/tme-production-deploy_postgres_data/_data/ | head -10 >> production_health_check_fixed.txt 2>&1
echo "" >> production_health_check_fixed.txt
echo "Current postgres volume content:" >> production_health_check_fixed.txt
sudo ls -la /var/lib/docker/volumes/tme-user_postgres_data/_data/ | head -10 >> production_health_check_fixed.txt 2>&1
echo "" >> production_health_check_fixed.txt

# 16. Show the complete report
echo "=== HEALTH CHECK FIXED COMPLETE ===" >> production_health_check_fixed.txt
cat production_health_check_fixed.txt
```

## Quick Analysis of What I See:

1. **Critical Finding**: You have TWO postgres containers running:
   - `test-postgres` (9 days old)
   - `tme-user-postgres-1` (9 days old - the active one)

2. **Volume Confusion**: Two sets of volumes exist:
   - Old: `tme-production-deploy_*` (created Aug 22)
   - Current: `tme-user_*` (created Aug 30)

3. **Application Errors**:
   - `user_todos_category_check` constraint violations
   - `urgency` field still sending 'standard' instead of 'medium'

4. **Docker Images**:
   - Running `tme-portal-server:latest-fix` (9 days old)
   - Also have `latest` and `20250820` versions

Run these corrected commands and send me the `production_health_check_fixed.txt` file so I can analyze the actual database state.