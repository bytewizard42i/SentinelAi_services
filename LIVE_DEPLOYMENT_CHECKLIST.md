# 🚀 SentinelAI Live Deployment Checklist

## 📋 Pre-Deployment Requirements

### Accounts Needed (All Free to Start):
- [ ] **Netlify Account** (for frontend hosting)
- [ ] **Render Account** (for backend hosting)
- [ ] **Supabase Account** (for PostgreSQL database)
- [ ] **Upstash Account** (for Redis caching)
- [ ] **GitHub Account** (for code hosting - already have)

### Environment Setup:
- [ ] Node.js 22.15.1 installed
- [ ] Git repository pushed to GitHub
- [ ] Midnight testnet access
- [ ] Basic command line knowledge

---

## 🔥 Phase 1: Database Setup (15 minutes)

### Supabase PostgreSQL:
1. [ ] Go to https://supabase.com
2. [ ] Create free account
3. [ ] Create new project: "sentinelai-prod"
4. [ ] Wait for database to be ready (~2 minutes)
5. [ ] Go to Settings > Database
6. [ ] Copy "Connection string" (starts with postgresql://)
7. [ ] **Save this URL** - you'll need it for backend

### Upstash Redis:
1. [ ] Go to https://console.upstash.com
2. [ ] Create free account
3. [ ] Create Redis database: "sentinelai-cache"
4. [ ] Copy REST API endpoint
5. [ ] **Save the URL** - you'll need it for backend

---

## 🔥 Phase 2: Backend Deployment (20 minutes)

### Render Setup:
1. [ ] Go to https://render.com
2. [ ] Create free account
3. [ ] Click "New +" > "Web Service"
4. [ ] Connect your GitHub repository
5. [ ] Select branch: `main`
6. [ ] Configure build settings:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
7. [ ] Add environment variables:
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://... (from Supabase)
   REDIS_URL=redis://... (from Upstash)
   JWT_SECRET=your-super-secure-jwt-secret-here
   SESSION_SECRET=your-session-secret-here
   MIDNIGHT_NODE_URL=https://midnight-testnet.hyperlane.com
   PROOF_SERVER_URL=https://midnight-proof-server.hyperlane.com
   ```
8. [ ] Click "Create Web Service"
9. [ ] Wait for deployment (~5-10 minutes)
10. [ ] **Save the backend URL** (e.g., https://sentinelai-backend.onrender.com)

---

## 🔥 Phase 3: Frontend Deployment (15 minutes)

### Netlify Setup:
1. [ ] Go to https://netlify.com
2. [ ] Create free account (GitHub login recommended)
3. [ ] Click "Add new site" > "Import from Git"
4. [ ] Connect your GitHub repository
5. [ ] Configure build settings:
   - **Branch:** `main`
   - **Build command:** `cd frontend && npm run build`
   - **Publish directory:** `frontend/dist`
6. [ ] Add environment variables:
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com
   REACT_APP_WS_URL=wss://your-backend-url.onrender.com
   REACT_APP_ENVIRONMENT=production
   ```
7. [ ] Click "Deploy site"
8. [ ] Wait for deployment (~3-5 minutes)
9. [ ] **Save the frontend URL** (e.g., https://sentinelai.netlify.app)

---

## 🔥 Phase 4: Contract Deployment (10 minutes)

### Midnight Testnet Deployment:
1. [ ] Ensure you have Midnight CLI installed
2. [ ] Run deployment script:
   ```bash
   cd deploy
   chmod +x deploy-contracts.sh
   ./deploy-contracts.sh full
   ```
3. [ ] Copy contract addresses from `deploy/contract_addresses.txt`
4. [ ] Update frontend environment variables with contract addresses:
   ```
   REACT_APP_WATCHDOG_CONTRACT=0x...
   REACT_APP_GUARDIAN_CONTRACT=0x...
   REACT_APP_PROFILER_CONTRACT=0x...
   REACT_APP_ORCHESTRATOR_CONTRACT=0x...
   ```

---

## 🔥 Phase 5: Testing & Verification (10 minutes)

### Test Frontend:
```bash
curl https://your-frontend-url.netlify.app
# Should return HTML
```

### Test Backend:
```bash
curl https://your-backend-url.onrender.com/health
# Should return {"status":"healthy"}
```

### Test API:
```bash
curl https://your-backend-url.onrender.com/api/risk/stats
# Should return risk statistics
```

### Test Full Flow:
1. [ ] Open frontend URL in browser
2. [ ] Take risk quiz
3. [ ] Should save to database
4. [ ] Dashboard should load
5. [ ] WebSocket should connect

---

## 🎯 Final URLs to Submit

After deployment, you'll have:
- **Frontend URL:** https://your-project.netlify.app
- **Backend API:** https://your-backend.onrender.com
- **Demo Video:** (record and upload to YouTube/Loom)

---

## 🚨 Common Issues & Solutions

### Backend Won't Start:
- Check environment variables are set correctly
- Verify database URL is accessible
- Check Render logs for error messages

### Frontend Shows Blank Page:
- Check API URL is correct in Netlify env vars
- Verify backend is running
- Check browser console for errors

### Database Connection Issues:
- Verify Supabase URL is correct
- Check database is not paused (free tier pauses after inactivity)
- Run migrations if needed

### WebSocket Not Connecting:
- Ensure backend URL is correct
- Check if Render allows WebSocket connections
- Verify firewall settings

---

## 💰 Cost Breakdown

### Free Tier Limits:
- **Netlify:** 100GB bandwidth/month
- **Render:** 750 hours/month (~30 days)
- **Supabase:** 500MB database, 50MB file storage
- **Upstash:** 10,000 requests/day
- **Midnight:** Unlimited testnet usage

### When You'll Need Paid Plans:
- High traffic (>10k users/day)
- Large database (>500MB)
- Custom domains
- Advanced monitoring

---

## 📞 Support Resources

### If Something Breaks:
1. Check service status pages
2. Review deployment logs
3. Test locally first
4. Check environment variables
5. Verify network connectivity

### Quick Rollback:
- Netlify: Deploy previous version from deploy history
- Render: Roll back to previous deployment
- Database: Restore from backup if needed

---

## ✅ Success Checklist

- [ ] Frontend loads without errors
- [ ] Backend API responds
- [ ] Database connections work
- [ ] Risk quiz saves data
- [ ] Dashboard displays correctly
- [ ] WebSocket connections work
- [ ] Contracts are deployed
- [ ] All URLs are working

---

## 🎉 Ready for Submission!

Once deployed, you'll have:
- ✅ Live demo that judges can click
- ✅ Working API endpoints
- ✅ Real database with data persistence
- ✅ Deployed smart contracts
- ✅ Professional URLs for submission

**Total Time: ~1 hour**
**Total Cost: $0 (free tiers)**

**Let's deploy! 🚀**
