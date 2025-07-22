#!/bin/bash

# TME Portal Firewall Configuration Script
# Configures UFW firewall for secure local network deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}TME Portal Firewall Setup${NC}"
echo "========================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root (use sudo)${NC}"
   exit 1
fi

# Install UFW if not already installed
echo -e "${YELLOW}Checking UFW installation...${NC}"
if ! command -v ufw &> /dev/null; then
    echo -e "${YELLOW}Installing UFW...${NC}"
    apt update
    apt install -y ufw
fi

# Reset UFW to default state
echo -e "${YELLOW}Resetting UFW to default configuration...${NC}"
ufw --force reset

# Set default policies
echo -e "${YELLOW}Setting default policies...${NC}"
ufw default deny incoming
ufw default allow outgoing

# Office network configuration (adjust IP range as needed)
OFFICE_NETWORK="192.168.1.0/24"
echo -e "${BLUE}Office network range: ${OFFICE_NETWORK}${NC}"

# Allow SSH from office network only (for remote administration)
echo -e "${YELLOW}Configuring SSH access (port 22) from office network...${NC}"
ufw allow from $OFFICE_NETWORK to any port 22 proto tcp comment 'SSH from office network'

# Allow TME Portal application (port 3000) from office network only
echo -e "${YELLOW}Configuring TME Portal access (port 3000) from office network...${NC}"
ufw allow from $OFFICE_NETWORK to any port 3000 proto tcp comment 'TME Portal from office network'

# Allow HTTPS (port 443) if using reverse proxy
echo -e "${YELLOW}Configuring HTTPS access (port 443) from office network...${NC}"
ufw allow from $OFFICE_NETWORK to any port 443 proto tcp comment 'HTTPS from office network'

# Allow HTTP (port 80) for redirects from office network
echo -e "${YELLOW}Configuring HTTP access (port 80) from office network...${NC}"
ufw allow from $OFFICE_NETWORK to any port 80 proto tcp comment 'HTTP redirects from office network'

# Allow loopback interface (important for Docker internal communication)
echo -e "${YELLOW}Configuring loopback interface...${NC}"
ufw allow in on lo
ufw allow out on lo

# Allow Docker network communication
echo -e "${YELLOW}Configuring Docker network communication...${NC}"
ufw allow in on docker0
ufw allow in on br-+

# Block all other incoming connections
echo -e "${YELLOW}Blocking all other incoming connections...${NC}"

# Configure logging
echo -e "${YELLOW}Enabling UFW logging...${NC}"
ufw logging on

# Enable UFW
echo -e "${YELLOW}Enabling UFW firewall...${NC}"
ufw --force enable

# Display status
echo -e "${GREEN}Firewall configuration completed!${NC}"
echo ""
echo -e "${BLUE}Current UFW status:${NC}"
ufw status verbose

echo ""
echo -e "${BLUE}Firewall Rules Summary:${NC}"
echo "======================="
echo "✅ SSH (port 22): Office network only"
echo "✅ TME Portal (port 3000): Office network only"  
echo "✅ HTTPS (port 443): Office network only"
echo "✅ HTTP (port 80): Office network only"
echo "✅ Docker networks: Allowed"
echo "✅ Loopback: Allowed"
echo "❌ All other incoming: Blocked"

echo ""
echo -e "${YELLOW}Security Notes:${NC}"
echo "- Only office network (${OFFICE_NETWORK}) can access TME Portal"
echo "- SSH is restricted to office network for admin access"
echo "- Docker containers can communicate internally"
echo "- All other external access is blocked"
echo "- Logging is enabled for security monitoring"

echo ""
echo -e "${YELLOW}To modify office network range:${NC}"
echo "1. Edit this script and change OFFICE_NETWORK variable"
echo "2. Run: sudo ufw delete allow from old.network.range"  
echo "3. Run: sudo ufw allow from new.network.range to any port 3000"

echo ""
echo -e "${GREEN}Firewall setup completed successfully!${NC}"

# Create monitoring script
cat > /opt/tme-portal/monitor-firewall.sh << 'EOF'
#!/bin/bash

# TME Portal Firewall Monitoring Script
# Check for suspicious connection attempts

LOG_FILE="/var/log/ufw.log"
ALERT_EMAIL="hafees@TME-Services.com"

# Check for blocked connections in the last hour
BLOCKED_ATTEMPTS=$(grep "$(date '+%b %d %H')" $LOG_FILE | grep "BLOCK" | wc -l)

if [ $BLOCKED_ATTEMPTS -gt 50 ]; then
    echo "WARNING: $BLOCKED_ATTEMPTS blocked connection attempts in the last hour"
    echo "Recent blocked attempts:"
    tail -20 $LOG_FILE | grep "BLOCK"
    
    # Uncomment to send email alerts (requires mail command)
    # echo "High number of blocked connection attempts detected on TME Portal server" | mail -s "TME Portal Security Alert" $ALERT_EMAIL
fi

# Show current connections to port 3000
echo "Current connections to TME Portal:"
netstat -an | grep :3000
EOF

chmod +x /opt/tme-portal/monitor-firewall.sh

echo ""
echo -e "${BLUE}Monitoring script created: /opt/tme-portal/monitor-firewall.sh${NC}"
echo "Run this script regularly to monitor for security issues"