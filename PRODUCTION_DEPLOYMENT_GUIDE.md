# TME Portal Production Deployment Guide

This guide documents the complete process for deploying the TME Portal to production.

## Prerequisites

- Local development environment with Docker
- SSH access to production server
- Production server with Docker and Docker Compose installed

## Step-by-Step Deployment Process

### 1. Build Production Images (Local)

```bash
# Build the application for linux/amd64 architecture
docker build --platform linux/amd64 -t tme-portal-app:production .

# Save the image to a tar file
docker save -o ~/tme-portal-app.tar tme-portal-app:production
```

### 2. Export Database Data (Local)

```bash
# Create export script if not exists
chmod +x scripts/export-user-data.sh

# Export user data from development database
./scripts/export-user-data.sh
# This creates: database/user_data_export.sql
```

### 3. Transfer Files to Production Server (Local)

```bash
# Transfer Docker image
scp ~/tme-portal-app.tar tme-user@192.168.97.149:~/

# Transfer database export
scp database/user_data_export.sql tme-user@192.168.97.149:~/

# Transfer docker-compose and database files
scp docker-compose.yml tme-user@192.168.97.149:~/tme-portal/
scp -r database/ tme-user@192.168.97.149:~/tme-portal/
```

### 4. Server Setup (On Server)

```bash
# SSH into server
ssh tme-user@192.168.97.149

# Navigate to project directory
cd ~/tme-portal

# Load Docker image
docker load -i ~/tme-portal-app.tar

# Create .env file with production configuration
cat > .env << EOF
NODE_ENV=production
DATABASE_URL=postgresql://tme_user:YOUR_DB_PASSWORD@postgres:5432/tme_portal
REDIS_URL=redis://default:YOUR_REDIS_PASSWORD@redis:6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD
POSTGRES_PASSWORD=YOUR_DB_PASSWORD
NEXTAUTH_SECRET=YOUR_SECRET_KEY
NEXTAUTH_URL=http://YOUR_SERVER_IP
SECURE_COOKIES=false  # Set to true if using HTTPS
BREVO_SMTP_USER=YOUR_BREVO_USER
BREVO_SMTP_PASSWORD=YOUR_BREVO_PASSWORD
OPENAI_API_KEY=YOUR_OPENAI_KEY
EOF

# Start all services
docker compose up -d
```

### 5. Import Database Data (On Server)

```bash
# Import user data
docker exec -i tme-portal-postgres-1 psql -U tme_user -d tme_portal < ~/user_data_export.sql

# Apply migrations in order
docker exec -i tme-portal-postgres-1 psql -U tme_user -d tme_portal < database/migrations/001_review_system.sql
docker exec -i tme-portal-postgres-1 psql -U tme_user -d tme_portal < database/migrations/002_add_notification_metadata.sql
docker exec -i tme-portal-postgres-1 psql -U tme_user -d tme_portal < database/migrations/002_update_urgency_levels.sql
docker exec -i tme-portal-postgres-1 psql -U tme_user -d tme_portal < database/migrations/003_user_todos_system.sql
docker exec -i tme-portal-postgres-1 psql -U tme_user -d tme_portal < database/migrations/003_user_todos_system_patch.sql

# Fix search path (if needed)
docker exec -it tme-portal-postgres-1 psql -U tme_user -d tme_portal -c "ALTER USER tme_user SET search_path TO public;"
```

### 6. Update Default Passwords (Optional)

```bash
# Generate new password hash
# First create a simple script locally:
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YOUR_NEW_PASSWORD', 12).then(console.log)"

# Update all users with default password
docker exec -it tme-portal-postgres-1 psql -U tme_user -d tme_portal -c \
  "UPDATE users SET hashed_password = 'YOUR_HASH_HERE' WHERE must_change_password = true;"
```

### 7. Verify Deployment

1. Access the application at `http://YOUR_SERVER_IP`
2. Test login with a user account
3. Verify all features work:
   - Profile photos load
   - Todo lists function
   - Review submission works
   - Email sending works

### 8. Troubleshooting Common Issues

#### 400 Error on Login
- Check `SECURE_COOKIES` setting matches your protocol (false for HTTP, true for HTTPS)
- Restart app container: `docker compose restart app`

#### 401 Authorization Errors
- Clear browser cookies and cache
- Ensure Redis is running: `docker exec -it tme-portal-redis-1 redis-cli ping`

#### "Relation does not exist" Errors
- Re-run migrations in order
- Restart app to refresh connections: `docker compose restart app`

#### Email Sending Fails
- Verify Brevo SMTP credentials in .env
- Ensure server has internet access to `smtp-relay.brevo.com`

#### AI Assistant Not Working
- Verify OpenAI API key in .env
- Ensure server has access to `api.openai.com`

## Network Requirements

The production server needs outbound HTTPS access to:
- `smtp-relay.brevo.com` - For email sending
- `api.openai.com` - For AI assistant functionality

## Important Notes

1. Always backup existing data before deployment
2. Use strong passwords for database and Redis
3. Keep the .env file secure and never commit it to git
4. Monitor logs for any errors: `docker logs -f tme-portal-app-1`
5. Default passwords:
   - Original pattern: `TME2024_[EMPLOYEE_CODE]`
   - Can be updated to any secure password using the steps above

## Container Management

```bash
# View running containers
docker ps

# Stop all services
docker compose down

# Restart specific service
docker compose restart app

# View logs
docker logs tme-portal-app-1 --tail 100

# Execute commands in containers
docker exec -it tme-portal-postgres-1 psql -U tme_user -d tme_portal
docker exec -it tme-portal-redis-1 redis-cli
```

## Updating the Application

To deploy updates:
1. Build new image locally
2. Save and transfer to server
3. Load image on server
4. Restart app container: `docker compose restart app`

Remember to run any new migrations after updating!