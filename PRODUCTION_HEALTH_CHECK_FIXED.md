# Fixed Production Health Check Commands

## The database commands need to use 'docker exec' properly. Here are the corrected commands:

```bash
# First, let's see what you have so far:
cat production_health_check.txt

# Now let's get the correct container name and fix the database commands:
POSTGRES_CONTAINER=$(docker ps --format "{{.Names}}" | grep postgres | head -1)
echo "Found PostgreSQL container: $POSTGRES_CONTAINER"

# If no postgres container found, let's check all containers:
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"

# Once we identify the postgres container, use these fixed commands:
# (Replace $POSTGRES_CONTAINER with the actual container name if needed)

# Test the connection first:
docker exec -it $POSTGRES_CONTAINER psql -U tme_user -d tme_portal -c "SELECT version();"

# If the above fails with password, try:
docker exec -it $POSTGRES_CONTAINER psql -U postgres -d tme_portal -c "SELECT version();"

# Get the correct database user:
docker exec -it $POSTGRES_CONTAINER psql -U postgres -c "\du"

# Now run the health checks with the correct user:
# (Use postgres user if tme_user doesn't exist)

echo "=== DATABASE CONNECTION INFO (FIXED) ===" >> production_health_check.txt
docker exec $POSTGRES_CONTAINER psql -U postgres -d tme_portal -c "\conninfo" >> production_health_check.txt 2>&1
echo "" >> production_health_check.txt

echo "=== DATABASE RECORD COUNTS (FIXED) ===" >> production_health_check.txt
docker exec $POSTGRES_CONTAINER psql -U postgres -d tme_portal -c "
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

echo "=== DATABASE TABLES (FIXED) ===" >> production_health_check.txt
docker exec $POSTGRES_CONTAINER psql -U postgres -d tme_portal -c "\dt" >> production_health_check.txt 2>&1
echo "" >> production_health_check.txt

echo "=== APPLICATIONS TABLE CONSTRAINTS (FIXED) ===" >> production_health_check.txt
docker exec $POSTGRES_CONTAINER psql -U postgres -d tme_portal -c "\d applications" | grep -A10 "Check constraints:" >> production_health_check.txt 2>&1
echo "" >> production_health_check.txt

echo "=== URGENCY VALUES IN DATABASE (FIXED) ===" >> production_health_check.txt
docker exec $POSTGRES_CONTAINER psql -U postgres -d tme_portal -c "SELECT urgency, COUNT(*) as count FROM applications GROUP BY urgency ORDER BY count DESC;" >> production_health_check.txt 2>&1
echo "" >> production_health_check.txt

echo "=== DATABASE SIZE & MAINTENANCE (FIXED) ===" >> production_health_check.txt
docker exec $POSTGRES_CONTAINER psql -U postgres -d tme_portal -c "SELECT pg_database_size('tme_portal')/1024/1024 as size_mb;" >> production_health_check.txt 2>&1
docker exec $POSTGRES_CONTAINER psql -U postgres -d tme_portal -c "SELECT schemaname, tablename, last_vacuum, last_autovacuum FROM pg_stat_user_tables ORDER BY last_vacuum DESC LIMIT 5;" >> production_health_check.txt 2>&1
echo "" >> production_health_check.txt

echo "=== DATABASE CONNECTIONS (FIXED) ===" >> production_health_check.txt
docker exec $POSTGRES_CONTAINER psql -U postgres -d tme_portal -c "SELECT state, count(*) as count FROM pg_stat_activity WHERE datname = 'tme_portal' GROUP BY state;" >> production_health_check.txt 2>&1
echo "" >> production_health_check.txt

# Create backup with postgres user:
BACKUP_TIME=$(date +%Y%m%d-%H%M%S)
echo "=== CREATING BACKUP (FIXED): backup_production_${BACKUP_TIME}.sql ===" >> production_health_check.txt
docker exec $POSTGRES_CONTAINER pg_dump -U postgres -d tme_portal > backup_production_${BACKUP_TIME}.sql
echo "Backup size: $(ls -lh backup_production_${BACKUP_TIME}.sql | awk '{print $5}')" >> production_health_check.txt
echo "" >> production_health_check.txt

# Check which migrations have been applied:
echo "=== APPLIED MIGRATIONS CHECK ===" >> production_health_check.txt
docker exec $POSTGRES_CONTAINER psql -U postgres -d tme_portal -c "
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'applications' 
ORDER BY ordinal_position;" >> production_health_check.txt 2>&1
echo "" >> production_health_check.txt

# Check for client table structure (was a problem before):
echo "=== CLIENTS TABLE STRUCTURE ===" >> production_health_check.txt
docker exec $POSTGRES_CONTAINER psql -U postgres -d tme_portal -c "\d clients" >> production_health_check.txt 2>&1
echo "" >> production_health_check.txt

# Final summary:
echo "=== FINAL CHECK COMPLETE ===" >> production_health_check.txt
cat production_health_check.txt
```

## Quick Diagnostic First:

Before running all commands, let's quickly check what's running:

```bash
# 1. See all containers
docker ps -a

# 2. Find postgres container specifically
docker ps | grep postgres

# 3. Check if database tme_portal exists
docker exec $(docker ps --format "{{.Names}}" | grep postgres | head -1) psql -U postgres -l

# 4. Check available users in postgres
docker exec $(docker ps --format "{{.Names}}" | grep postgres | head -1) psql -U postgres -c "\du"
```

Send me the output of these quick diagnostic commands first, and I'll help you determine the exact commands to run based on your actual container setup.