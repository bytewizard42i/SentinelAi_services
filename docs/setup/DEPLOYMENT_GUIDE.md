# SentinelAI Live Deployment Guide
# Complete setup for production deployment

## Frontend Deployment (Netlify/Vercel)

### 1. Netlify Configuration
```toml
# netlify.toml (already created)
[build]
  publish = "frontend/dist"
  command = "cd frontend && npm run build"

[build.environment]
  NODE_VERSION = "22.15.1"
```

### 2. Environment Variables for Frontend
```bash
# Frontend .env.production
REACT_APP_API_URL=https://sentinelai-backend.onrender.com
REACT_APP_WS_URL=wss://sentinelai-backend.onrender.com
REACT_APP_ENVIRONMENT=production
```

## Backend Deployment (Render/Railway)

### 1. Backend Configuration
```yaml
# render.yaml
services:
  - type: web
    name: sentinelai-backend
    runtime: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: DATABASE_URL
        fromSecret: database_url
      - key: REDIS_URL
        fromSecret: redis_url
```

### 2. Backend Environment Variables
```bash
# Backend production env
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your-production-jwt-secret
SESSION_SECRET=your-production-session-secret
MIDNIGHT_NODE_URL=https://midnight-testnet.hyperlane.com
PROOF_SERVER_URL=https://midnight-proof-server.com
```

## Database Deployment (Supabase/Neon)

### 1. PostgreSQL Setup
```sql
-- Database initialization (already in backend/sql/init.sql)
-- Deploy to Supabase or Neon Tech
-- Get connection string for backend
```

### 2. Redis Setup (Upstash/Redis Cloud)
```bash
# Redis URL for caching
REDIS_URL=redis://username:password@host:port
```

## Deployment Steps

### Phase 1: Database Setup
1. Create Supabase/Neon PostgreSQL database
2. Run init.sql migrations
3. Create Upstash/Redis Cloud instance
4. Get connection URLs

### Phase 2: Backend Deployment
1. Deploy to Render/Railway/Heroku
2. Set environment variables
3. Test API endpoints
4. Get backend URL (e.g., https://sentinelai-backend.onrender.com)

### Phase 3: Frontend Deployment
1. Update netlify.toml with backend URL
2. Deploy to Netlify/Vercel
3. Set environment variables
4. Test frontend connectivity
5. Get frontend URL (e.g., https://sentinelai.netlify.app)

### Phase 4: Contract Deployment
1. Deploy contracts to Midnight testnet
2. Update frontend with contract addresses
3. Test contract interactions

## Required Services

### Free Tier Options:
- **Frontend:** Netlify (free), Vercel (free)
- **Backend:** Render (free tier), Railway (free tier)
- **Database:** Supabase (free), Neon (free)
- **Redis:** Upstash (free tier)
- **Contracts:** Midnight testnet (free)

### Paid Upgrades (if needed):
- Render: $7/month for persistent apps
- Railway: $5/month for databases
- Supabase: Pro plan for higher limits
- Upstash: Paid tier for more operations

## Quick Deployment Commands

```bash
# 1. Deploy contracts first
./deploy/deploy-contracts.sh full

# 2. Set up database
# Create Supabase project, run SQL migrations

# 3. Deploy backend
# Push to GitHub, connect to Render/Railway

# 4. Deploy frontend
# Push to GitHub, connect to Netlify/Vercel
# Update API URLs in netlify.toml

# 5. Update environment variables
# Set production URLs and secrets
```

## URLs to Get

After deployment, you'll have:
- Frontend URL: https://your-project.netlify.app
- Backend URL: https://your-backend.onrender.com
- Database URL: postgresql://...
- Redis URL: redis://...
- Contract Addresses: 0x... (from deployment)

## Testing Live Deployment

```bash
# Test frontend
curl https://your-frontend-url.netlify.app

# Test backend
curl https://your-backend-url.onrender.com/health

# Test API
curl https://your-backend-url.onrender.com/api/risk/stats

# Test WebSocket
# Use online WebSocket tester
```

## Cost Estimate

### Free Tier (sufficient for demo):
- Netlify: $0
- Render: $0 (750 hours/month)
- Supabase: $0 (500MB database)
- Upstash: $0 (10k requests/day)
- Midnight: $0 (testnet)
**Total: $0/month**

### Production Scale:
- Render: $7/month
- Supabase: $25/month
- Upstash: $10/month
**Total: ~$42/month**
