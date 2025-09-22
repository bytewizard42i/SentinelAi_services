# SentinelAI Hostinger Deployment Guide

## 🎯 Deployment Options

### Option 1: VPS Hosting (Recommended)
**Cost**: $4-8/month | **Difficulty**: Medium | **Features**: Full

1. **Get Hostinger VPS**
   - Choose VPS plan (minimum 2GB RAM)
   - Select Ubuntu 22.04 LTS
   - Set up SSH access

2. **Run Deployment Script**
   ```bash
   # Upload and run the setup script
   scp deploy/hostinger-setup.sh user@your-vps-ip:~/
   ssh user@your-vps-ip
   chmod +x hostinger-setup.sh
   ./hostinger-setup.sh
   ```

3. **Configure Domain**
   - Point your domain to VPS IP
   - Update nginx config with your domain
   - Run: `sudo certbot --nginx -d yourdomain.com`

### Option 2: Static Demo Site
**Cost**: $2/month | **Difficulty**: Easy | **Features**: Demo only

1. **Create Static Dashboard**
   ```bash
   # Build static version
   npm run build:static
   ```

2. **Upload to Hostinger**
   - Use File Manager or FTP
   - Upload `dist/` folder contents
   - Set index.html as homepage

### Option 3: Hybrid (Frontend + External API)
**Cost**: $2/month + $5/month | **Difficulty**: Easy | **Features**: Full

1. **Frontend on Hostinger Shared**
2. **Backend on Railway/Render**
3. **Connect via CORS-enabled API**

## 🔧 Production Configuration

### Environment Variables
```bash
# backend/.env.production
NODE_ENV=production
PORT=3000
MIDNIGHT_NETWORK=testnet
MIDNIGHT_NODE_URL=https://node.testnet.midnight.network
MIDNIGHT_INDEXER_URL=https://indexer.testnet.midnight.network
MIDNIGHT_PROOF_SERVER_URL=http://localhost:6300

# Optional: Real API keys for production
OPENAI_API_KEY=your_openai_key
DISCORD_TOKEN=your_discord_token
```

### Performance Optimizations
```javascript
// Add to package.json
{
  "scripts": {
    "start:prod": "NODE_ENV=production node src/index.js",
    "build": "npm install --production"
  }
}
```

## 🚀 Quick Start Commands

### VPS Deployment
```bash
# 1. SSH into VPS
ssh user@your-vps-ip

# 2. Run setup script
curl -sSL https://raw.githubusercontent.com/your-repo/main/deploy/hostinger-setup.sh | bash

# 3. Check status
pm2 status
curl http://localhost:3000/health
```

### Shared Hosting
```bash
# 1. Build static version
npm run build:static

# 2. Upload via FTP
# Upload dist/* to public_html/

# 3. Test
# Visit https://yourdomain.com
```

## 📊 Monitoring & Maintenance

### Check Logs
```bash
pm2 logs sentinelai-api
tail -f /var/log/nginx/access.log
```

### Update Deployment
```bash
git pull origin main
npm install
pm2 restart sentinelai-api
```

### Backup
```bash
# Backup database and configs
tar -czf backup-$(date +%Y%m%d).tar.gz storage/ backend/.env.production
```

## 🔒 Security Checklist

- [ ] SSL certificate installed
- [ ] Firewall configured (UFW)
- [ ] SSH key authentication
- [ ] Regular security updates
- [ ] Environment variables secured
- [ ] Database backups automated

## 💡 Cost Breakdown

| Option | Hostinger | External | Total/Month |
|--------|-----------|----------|-------------|
| VPS Full | $4-8 | $0 | $4-8 |
| Shared + API | $2 | $5 | $7 |
| Static Demo | $2 | $0 | $2 |

## 🆘 Troubleshooting

### Common Issues
1. **Port 3000 blocked**: Check firewall rules
2. **Node.js version**: Ensure 22.15.1 installed
3. **PM2 not starting**: Check logs with `pm2 logs`
4. **Nginx 502**: Verify backend is running on port 3000

### Support Commands
```bash
# Check service status
systemctl status nginx
pm2 status
docker ps

# Restart services
pm2 restart all
sudo systemctl restart nginx
```
