#!/bin/bash

# Production server setup script for TME Portal
# Run this on the production server after loading Docker images

set -e

echo "==========================================
TME Portal Production Setup
==========================================
"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create project directory
PROJECT_DIR="/home/tme-user/tme-portal"
echo -e "${YELLOW}Creating project directory...${NC}"
mkdir -p ${PROJECT_DIR}
cd ${PROJECT_DIR}

# Create necessary subdirectories
mkdir -p database backups nginx/ssl scripts logs

# Create .env file
echo -e "${YELLOW}Creating production .env file...${NC}"
cat > .env << 'EOF'
# Production Environment Variables
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgresql://tme_user:CHANGE_THIS_PASSWORD@postgres:5432/tme_portal
POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD

# Redis Configuration
REDIS_URL=redis://default:CHANGE_THIS_PASSWORD@redis:6379
REDIS_PASSWORD=CHANGE_THIS_PASSWORD

# NextAuth Configuration
NEXTAUTH_SECRET=CHANGE_THIS_SECRET_USE_OPENSSL_RAND_BASE64_32
NEXTAUTH_URL=http://192.168.97.149

# Email Configuration (Brevo/SendinBlue)
BREVO_SMTP_USER=your-brevo-smtp-user
BREVO_SMTP_PASSWORD=your-brevo-smtp-password

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Backup Encryption Key
BACKUP_ENCRYPTION_KEY=CHANGE_THIS_ENCRYPTION_KEY
EOF

echo -e "${GREEN}✓ Created .env file${NC}"
echo -e "${RED}⚠️  IMPORTANT: Edit the .env file to set secure passwords!${NC}"

# Create docker-compose.yml
echo -e "${YELLOW}Creating docker-compose.yml...${NC}"
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  app:
    image: tme-portal-app:production
    ports:
      - "80:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - BREVO_SMTP_USER=${BREVO_SMTP_USER}
      - BREVO_SMTP_PASSWORD=${BREVO_SMTP_PASSWORD}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - SECURE_COOKIES=true
      - DOCKER_ENV=true
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - tme_network
    volumes:
      - app_uploads:/app/public/uploads
      - app_logs:/app/logs

  postgres:
    image: tme-portal-postgres:production
    environment:
      - POSTGRES_DB=tme_portal
      - POSTGRES_USER=tme_user
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/01-init.sql
      - ./database/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql
    restart: unless-stopped
    networks:
      - tme_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tme_user -d tme_portal"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: tme-portal-redis:production
    command: >
      redis-server 
      --requirepass ${REDIS_PASSWORD}
      --maxmemory 512mb
      --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - tme_network
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

volumes:
  postgres_data:
  redis_data:
  app_uploads:
  app_logs:

networks:
  tme_network:
    driver: bridge
EOF

echo -e "${GREEN}✓ Created docker-compose.yml${NC}"

# Create password generation script
echo -e "${YELLOW}Creating password generator script...${NC}"
cat > generate-passwords.sh << 'EOF'
#!/bin/bash

echo "Generating secure passwords..."

# Generate passwords
POSTGRES_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
REDIS_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
BACKUP_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

echo ""
echo "Generated passwords (save these securely):"
echo "========================================="
echo "POSTGRES_PASSWORD: $POSTGRES_PASS"
echo "REDIS_PASSWORD: $REDIS_PASS"
echo "NEXTAUTH_SECRET: $NEXTAUTH_SECRET"
echo "BACKUP_ENCRYPTION_KEY: $BACKUP_KEY"
echo ""
echo "Update your .env file with these values!"
EOF

chmod +x generate-passwords.sh

echo -e "\n${GREEN}==========================================
Setup complete!
==========================================${NC}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Run: ./generate-passwords.sh"
echo "2. Edit .env file with the generated passwords"
echo "3. Update NEXTAUTH_URL to your domain/IP"
echo "4. Add your Brevo SMTP and OpenAI credentials"
echo "5. Copy your database init files to ./database/"
echo "6. Run: docker-compose up -d"

echo -e "\n${RED}⚠️  Security reminder:${NC}"
echo "- Use strong, unique passwords"
echo "- Keep .env file secure (chmod 600 .env)"
echo "- Set up firewall rules"
echo "- Configure SSL certificates for HTTPS"