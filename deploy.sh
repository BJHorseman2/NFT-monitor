#!/bin/bash

# NFT Monitor Deployment Script
# Usage: ./deploy.sh [vps-ip-address]

set -e

echo "🚀 NFT Monitor Deployment Script"
echo "================================"

# Check if IP address provided
if [ -z "$1" ]; then
    echo "Usage: ./deploy.sh [vps-ip-address]"
    echo "Example: ./deploy.sh 192.168.1.100"
    exit 1
fi

VPS_IP=$1
APP_DIR="/home/nft-monitor"

echo "📦 Preparing deployment package..."

# Create deployment directory
mkdir -p deployment
cp -r *.js *.json .env.example deployment/
cp ecosystem.config.js deployment/

# Create setup script for VPS
cat > deployment/setup.sh << 'EOF'
#!/bin/bash

# Install Node.js and PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# Setup application
cd /home/nft-monitor
npm install

# Create .env file
echo "Please edit /home/nft-monitor/.env with your credentials"
cp .env.example .env

# Create logs directory
mkdir -p logs

# Setup PM2 to start on boot
pm2 startup systemd -u $USER --hp /home/$USER
pm2 save

echo "✅ Setup complete! Next steps:"
echo "1. Edit .env file with your API keys"
echo "2. Run: pm2 start ecosystem.config.js"
echo "3. View logs: pm2 logs"
echo "4. Monitor: pm2 monit"
EOF

chmod +x deployment/setup.sh

echo "📤 Deploying to $VPS_IP..."

# Copy files to VPS
scp -r deployment/* root@$VPS_IP:$APP_DIR/

# Run setup on VPS
ssh root@$VPS_IP "cd $APP_DIR && bash setup.sh"

echo "✅ Deployment complete!"
echo ""
echo "Next steps on your VPS:"
echo "1. SSH into VPS: ssh root@$VPS_IP"
echo "2. Edit config: nano $APP_DIR/.env"
echo "3. Start monitoring: cd $APP_DIR && pm2 start ecosystem.config.js"
echo "4. Check status: pm2 status"
echo "5. View logs: pm2 logs"

# Cleanup
rm -rf deployment