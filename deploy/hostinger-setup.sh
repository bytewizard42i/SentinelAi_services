#!/bin/bash
# SentinelAI Hostinger VPS Deployment Script

echo "🚀 Setting up SentinelAI on Hostinger VPS..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22.15.1
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Install Nginx
sudo apt-get install -y nginx

# Install PM2 for process management
sudo npm install -g pm2

# Clone and setup SentinelAI
git clone https://github.com/your-username/SentinelAi_services.git
cd SentinelAi_services/SentinelAi_services-project

# Install dependencies
cd backend && npm install && cd ..

# Create production environment
cp backend/.env.example backend/.env.production
echo "NODE_ENV=production" >> backend/.env.production
echo "PORT=3000" >> backend/.env.production

# Setup PM2 ecosystem
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'sentinelai-api',
    script: 'backend/src/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Configure Nginx
sudo tee /etc/nginx/sites-available/sentinelai << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/sentinelai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt-get install -y certbot python3-certbot-nginx
# sudo certbot --nginx -d your-domain.com

# Setup firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

echo "✅ SentinelAI deployed successfully!"
echo "🌐 Access your dashboard at: http://your-domain.com"
echo "📊 API Health: http://your-domain.com/health"
echo "🔧 Manage with: pm2 status"
