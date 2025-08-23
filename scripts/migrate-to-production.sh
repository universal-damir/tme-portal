#!/bin/bash
# TME Portal - Production Migration Script
# This script helps migrate from development to production

set -e  # Exit on error

echo "🚀 TME Portal Production Migration"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Run this script from the TME Portal root directory"
    exit 1
fi

# Function to backup current data
backup_current_data() {
    echo "📦 Backing up current development data..."
    
    # Create backup directory
    mkdir -p ./backups/pre-production
    
    # Backup PostgreSQL
    echo "  - Backing up PostgreSQL database..."
    docker exec tme-portal-1-postgres-1 pg_dump -U tme_user tme_portal > ./backups/pre-production/database_$(date +%Y%m%d_%H%M%S).sql
    
    echo "✅ Backup completed: ./backups/pre-production/"
}

# Function to prepare production environment
prepare_production() {
    echo ""
    echo "🔧 Preparing production environment..."
    
    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        echo "❌ Error: .env.production not found!"
        echo "  Please create it first using the template"
        exit 1
    fi
    
    # Check if passwords are still default
    if grep -q "CHANGE_THIS" .env.production; then
        echo "❌ Error: Production passwords not set!"
        echo "  Run: ./scripts/generate-prod-passwords.sh"
        echo "  Then update .env.production with the generated passwords"
        exit 1
    fi
    
    echo "✅ Production environment ready"
}

# Function to build production images
build_production() {
    echo ""
    echo "🏗️  Building production Docker images..."
    
    # Build with production compose file
    docker-compose -f docker-compose.production.yml build --no-cache
    
    echo "✅ Production images built"
}

# Main migration process
echo "⚠️  WARNING: This will stop your development containers!"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

# Step 1: Backup
backup_current_data

# Step 2: Stop development
echo ""
echo "🛑 Stopping development containers..."
docker-compose down

# Step 3: Prepare production
prepare_production

# Step 4: Build production
build_production

echo ""
echo "✅ Production preparation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy this entire folder to your production server"
echo "2. On the production server, run:"
echo "   docker-compose -f docker-compose.production.yml up -d"
echo "3. Monitor logs with:"
echo "   docker-compose -f docker-compose.production.yml logs -f"
echo ""
echo "🔐 Security reminders:"
echo "- Ensure .env.production has strong passwords"
echo "- Set up firewall rules for ports 80/443"
echo "- Configure backup retention policies"
echo "- Set up monitoring and alerts"