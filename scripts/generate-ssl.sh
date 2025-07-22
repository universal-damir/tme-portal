#!/bin/bash

# TME Portal SSL Certificate Generation Script
# Generates self-signed SSL certificates for local network deployment

set -e

# Configuration
SSL_DIR="/opt/tme-portal/ssl"
DOMAIN="tme-portal.local"
COUNTRY="AE"
STATE="Dubai"
CITY="Dubai"
ORG="TME Services"
OU="IT Department"
EMAIL="hafees@TME-Services.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}TME Portal SSL Certificate Generator${NC}"
echo "====================================="

# Create SSL directory
echo -e "${YELLOW}Creating SSL directory...${NC}"
mkdir -p "$SSL_DIR"
cd "$SSL_DIR"

# Generate private key
echo -e "${YELLOW}Generating private key...${NC}"
openssl genrsa -out tme-portal.key 4096

# Generate certificate signing request
echo -e "${YELLOW}Generating certificate signing request...${NC}"
openssl req -new -key tme-portal.key -out tme-portal.csr -subj "/C=${COUNTRY}/ST=${STATE}/L=${CITY}/O=${ORG}/OU=${OU}/CN=${DOMAIN}/emailAddress=${EMAIL}"

# Create certificate extensions file
echo -e "${YELLOW}Creating certificate extensions...${NC}"
cat > tme-portal.ext << EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = ${DOMAIN}
DNS.2 = tme-portal
DNS.3 = localhost
IP.1 = 127.0.0.1
IP.2 = 192.168.1.100
IP.3 = 10.0.0.100
IP.4 = 172.20.0.2
EOF

# Generate self-signed certificate (valid for 10 years)
echo -e "${YELLOW}Generating self-signed certificate...${NC}"
openssl x509 -req -in tme-portal.csr -signkey tme-portal.key -out tme-portal.crt -days 3650 -extensions v3_req -extfile tme-portal.ext

# Generate PEM format (for some applications)
echo -e "${YELLOW}Generating PEM format...${NC}"
cat tme-portal.crt tme-portal.key > tme-portal.pem

# Set appropriate permissions
echo -e "${YELLOW}Setting file permissions...${NC}"
chmod 600 tme-portal.key tme-portal.pem
chmod 644 tme-portal.crt tme-portal.csr

# Generate Diffie-Hellman parameters for enhanced security
echo -e "${YELLOW}Generating Diffie-Hellman parameters (this may take a while)...${NC}"
openssl dhparam -out dhparam.pem 2048

# Display certificate information
echo -e "${GREEN}Certificate generated successfully!${NC}"
echo ""
echo "Certificate Details:"
echo "===================="
openssl x509 -in tme-portal.crt -text -noout | grep -A 2 "Subject:"
openssl x509 -in tme-portal.crt -text -noout | grep -A 10 "Subject Alternative Name"
openssl x509 -in tme-portal.crt -text -noout | grep "Not After"

# Create installation instructions
cat > INSTALLATION_INSTRUCTIONS.txt << EOF
TME Portal SSL Certificate Installation Instructions
===================================================

Files Generated:
- tme-portal.key: Private key (keep secure!)
- tme-portal.crt: Public certificate
- tme-portal.pem: Combined certificate and key
- dhparam.pem: Diffie-Hellman parameters
- tme-portal.csr: Certificate signing request (can be deleted)

For Docker Deployment:
1. Copy these files to your Docker host
2. Mount the SSL directory in docker-compose.yml:
   volumes:
     - ${SSL_DIR}:/etc/ssl/certs/tme-portal:ro

For Employee Workstations (to avoid browser warnings):
1. Copy tme-portal.crt to each employee's computer
2. Import the certificate into their browser's trusted certificates:

   Windows:
   - Open Chrome/Edge > Settings > Privacy and Security > Security > Manage Certificates
   - Import tme-portal.crt into "Trusted Root Certification Authorities"
   
   macOS:
   - Open Keychain Access
   - Import tme-portal.crt
   - Double-click the certificate > Trust > Always Trust
   
   Linux:
   - Copy to /usr/local/share/ca-certificates/
   - Run: sudo update-ca-certificates

Network Configuration:
- Add to office router/DNS: ${DOMAIN} -> [SERVER_IP]
- Or add to each computer's hosts file:
  192.168.1.100    ${DOMAIN}

Security Notes:
- Private key should never be shared
- Certificate is valid for 10 years
- Supports multiple domains and IP addresses
- Uses 4096-bit RSA encryption
EOF

echo ""
echo -e "${GREEN}Files created in: ${SSL_DIR}${NC}"
echo -e "${GREEN}Installation instructions: ${SSL_DIR}/INSTALLATION_INSTRUCTIONS.txt${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the installation instructions"
echo "2. Configure your web server to use these certificates"
echo "3. Install the certificate on employee workstations"
echo "4. Update DNS/hosts files to point ${DOMAIN} to your server"
echo ""
echo -e "${GREEN}SSL setup completed successfully!${NC}"