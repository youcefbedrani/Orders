#!/bin/bash

###############################################################################
# Warm Lead - VPS Quick Deploy Script
# This script automates the deployment process on your VPS
###############################################################################

set -e  # Exit on error

echo ""
echo "🚀 Warm Lead - VPS Deployment Script"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${YELLOW}⚠️  Running as root. This is okay but not recommended.${NC}"
    SUDO=""
else
    SUDO="sudo"
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "📋 Checking prerequisites..."
echo ""

# Check for Docker
if command_exists docker; then
    echo -e "${GREEN}✅ Docker is installed${NC}"
    docker --version
else
    echo -e "${YELLOW}⚠️  Docker not found. Installing...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    $SUDO sh get-docker.sh
    rm get-docker.sh
    echo -e "${GREEN}✅ Docker installed${NC}"
fi

echo ""

# Check for Docker Compose
if command_exists docker-compose; then
    echo -e "${GREEN}✅ Docker Compose is installed${NC}"
    docker-compose --version
else
    echo -e "${YELLOW}⚠️  Docker Compose not found. Installing...${NC}"
    $SUDO curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    $SUDO chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose installed${NC}"
fi

echo ""
echo "======================================"
echo ""

# Ask for deployment method
echo "Choose deployment method:"
echo "1) Docker (Recommended)"
echo "2) PM2 (Node.js)"
echo ""
read -p "Enter choice [1-2]: " deploy_choice

if [ "$deploy_choice" = "1" ]; then
    echo ""
    echo "🐳 Deploying with Docker..."
    echo ""
    
    # Stop any existing containers
    if [ -f "docker-compose.yml" ]; then
        echo "Stopping existing containers..."
        $SUDO docker-compose down 2>/dev/null || true
    fi
    
    # Build and start
    echo "Building and starting containers..."
    $SUDO docker-compose up -d --build
    
    echo ""
    echo -e "${GREEN}✅ Docker deployment complete!${NC}"
    echo ""
    
    # Wait a moment for container to start
    sleep 3
    
    # Check status
    echo "Container status:"
    $SUDO docker-compose ps
    
    echo ""
    echo "View logs with: ${YELLOW}sudo docker-compose logs -f${NC}"
    
elif [ "$deploy_choice" = "2" ]; then
    echo ""
    echo "📦 Deploying with PM2..."
    echo ""
    
    # Check for Node.js
    if ! command_exists node; then
        echo -e "${YELLOW}Installing Node.js...${NC}"
        curl -fsSL https://deb.nodesource.com/setup_18.x | $SUDO -E bash -
        $SUDO apt-get install -y nodejs
    fi
    
    echo -e "${GREEN}✅ Node.js installed${NC}"
    node --version
    npm --version
    
    # Install dependencies
    echo ""
    echo "Installing dependencies..."
    npm install
    
    # Build
    echo ""
    echo "Building application..."
    npm run build
    
    # Install PM2
    if ! command_exists pm2; then
        echo ""
        echo "Installing PM2..."
        $SUDO npm install -g pm2
    fi
    
    # Stop existing PM2 process
    pm2 delete warm-lead 2>/dev/null || true
    
    # Start with PM2
    echo ""
    echo "Starting application with PM2..."
    pm2 start npm --name "warm-lead" -- start
    
    # Save PM2 configuration
    pm2 save
    
    # Setup startup script
    echo ""
    echo "Setting up PM2 startup script..."
    $SUDO env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
    
    echo ""
    echo -e "${GREEN}✅ PM2 deployment complete!${NC}"
    echo ""
    echo "View logs with: ${YELLOW}pm2 logs warm-lead${NC}"
    echo "View status with: ${YELLOW}pm2 status${NC}"
else
    echo -e "${RED}Invalid choice${NC}"
    exit 1
fi

echo ""
echo "======================================"
echo ""

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "📍 Access your application at:"
echo "   http://$SERVER_IP:3000"
echo ""
echo "🔐 Default login credentials:"
echo "   Email: admin@example.com"
echo "   Password: admin123"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Change the default password after first login!${NC}"
echo ""

# Check if firewall is active
if command_exists ufw; then
    if $SUDO ufw status | grep -q "Status: active"; then
        echo -e "${YELLOW}🔥 Firewall detected. Opening port 3000...${NC}"
        $SUDO ufw allow 3000/tcp
        echo -e "${GREEN}✅ Port 3000 opened${NC}"
        echo ""
    fi
fi

echo "📚 Documentation:"
echo "   - Installation Guide: INSTALLATION.md"
echo "   - User Guide: USER_GUIDE.md"
echo "   - VPS Deployment: VPS_DEPLOYMENT.md"
echo ""
echo "======================================"
echo ""
