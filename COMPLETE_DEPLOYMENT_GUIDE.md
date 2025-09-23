# 🚀 SentinelAI Complete Deployment Guide
# Manual deployment to production platforms

---

## 🎯 **DEPLOYMENT STATUS**

**Windsurf deployment attempted but encountered server error.**
**✅ Using manual deployment approach instead (more reliable for hackathons)**

---

## 📋 **DEPLOYMENT CHECKLIST**

### ✅ **Prerequisites Completed:**
- [x] Accounts created (Netlify, Render, Supabase, Upstash)
- [x] Project configured with environment variables
- [x] Code committed and pushed to GitHub
- [x] Windsurf deployment config created
- [x] Netlify config updated with variables

### 🔄 **Next Steps:**
- [ ] Deploy frontend to Netlify
- [ ] Deploy backend to Render
- [ ] Configure database in Supabase
- [ ] Set up Redis in Upstash
- [ ] Test live URLs
- [ ] Record demo video

---

## 🚀 **STEP-BY-STEP DEPLOYMENT**

### **1. Frontend Deployment (Netlify)**

**URL:** https://app.netlify.com/
**Time:** 10 minutes

**Steps:**
1. Click "Add new site" → "Import from Git"
2. Choose "Deploy with GitHub"
3. Select repository: `bytewizard42i/SentinelAi_services`
4. **Build settings:**
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
5. **Environment variables:**
   ```
   REACT_APP_API_URL=https://[your-render-app].onrender.com
   REACT_APP_WS_URL=wss://[your-render-app].onrender.com
   REACT_APP_ENVIRONMENT=production
   ```
6. Click "Deploy site"
7. **Save the generated URL** (e.g., `https://amazing-site-name.netlify.app`)

---

### **2. Backend Deployment (Render)**

**URL:** https://dashboard.render.com/
**Time:** 15 minutes

**Steps:**
1. Click "New" → "Web Service"
2. Choose "Connect" (GitHub)
3. Select repository: `bytewizard42i/SentinelAi_services`
4. **Service configuration:**
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
5. **Environment variables:**
   ```
   NODE_ENV=production
   DATABASE_URL=[from Supabase]
   REDIS_URL=[from Upstash]
   JWT_SECRET=your-32-char-secure-jwt-secret-here-make-it-long
   SESSION_SECRET=your-32-char-session-secret-here-make-it-long
   MIDNIGHT_NODE_URL=https://midnight-testnet.hyperlane.com
   PROOF_SERVER_URL=https://midnight-proof-server.hyperlane.com
   MIDNIGHT_SDK_VERSION=2.0.2
   LOG_LEVEL=info
   PORT=10000
   ```
6. Click "Create Web Service"
7. Wait 5-10 minutes for deployment
8. **Save the service URL** (e.g., `https://sentinelai-backend.onrender.com`)

---

### **3. Database Setup (Supabase)**

**URL:** https://app.supabase.com/
**Time:** 5 minutes

**Steps:**
1. Go to your project dashboard
2. Click "SQL Editor" in left sidebar
3. Copy and paste the contents of `backend/sql/init.sql`
4. Click "Run"
5. Verify tables were created
6. Copy the "Connection string" from Settings → Database
7. Use this URL in your Render environment variables

---

### **4. Redis Setup (Upstash)**

**URL:** https://console.upstash.com/
**Time:** 3 minutes

**Steps:**
1. Go to your database dashboard
2. Copy the "REST API Endpoint"
3. Use this URL in your Render environment variables

---

### **5. Update Frontend URLs**

**URL:** https://app.netlify.com/
**Time:** 2 minutes

**Steps:**
1. Go to your Netlify site dashboard
2. Click "Site settings" → "Environment variables"
3. Update `REACT_APP_API_URL` with your Render backend URL
4. Update `REACT_APP_WS_URL` with `wss://[your-render-url]`
5. Trigger a new deploy: "Site settings" → "Build & deploy" → "Trigger deploy"

---

## 🧪 **TESTING LIVE DEPLOYMENT**

### **Frontend Tests:**
```bash
# Test frontend loads
curl https://your-netlify-site.netlify.app

# Test risk quiz page
curl https://your-netlify-site.netlify.app/risk-tolerance-quiz.html
```

### **Backend Tests:**
```bash
# Test backend health
curl https://your-render-app.onrender.com/health

# Test API endpoints
curl https://your-render-app.onrender.com/api/risk/stats

# Test Midnight status
curl https://your-render-app.onrender.com/api/midnight/status
```

### **Full Integration Tests:**
1. Open frontend URL in browser
2. Take risk quiz → Should save to Supabase
3. Dashboard should load → Should show data
4. WebSocket should connect → Real-time updates

---

## 🎬 **DEMO VIDEO CREATION**

**Tools:** Loom (free) - https://loom.com

**Script:**
1. **"Welcome to SentinelAI"** - Show homepage
2. **"Risk Assessment Quiz"** - Complete 7 questions
3. **"Personalized Dashboard"** - Show portfolio, alerts
4. **"AI Anomaly Detection"** - Trigger alerts
5. **"Contract Deployment"** - Deploy to Midnight testnet
6. **"Privacy Features"** - Explain ZK proofs

**Length:** 3-5 minutes
**Upload:** To YouTube/Loom and get shareable link

---

## 📸 **SCREENSHOTS FOR JUDGES**

Take screenshots of:
1. Risk quiz interface
2. Dashboard with data
3. AI alerts panel
4. Contract deployment
5. Mobile responsive view

---

## 📝 **DORAHACKS SUBMISSION**

**URL:** https://dorahacks.io/hackathon/ai-treasury-management/submission

**Required Fields:**
- **Project Title:** SentinelAI - Three-Tier AI DAO Treasury Governance
- **Live Demo:** https://your-netlify-site.netlify.app
- **Video Demo:** https://loom.com/share/your-video-link
- **GitHub:** https://github.com/bytewizard42i/SentinelAi_services
- **Screenshots:** Upload 5 images
- **Description:** Copy from `FINAL_SUBMISSION_README.md`

---

## 🚨 **TROUBLESHOOTING**

### **Netlify Issues:**
- Build fails: Check build logs, ensure `frontend/package.json` has correct scripts
- 404 errors: Check publish directory is `frontend/dist`
- API calls fail: Verify environment variables are set correctly

### **Render Issues:**
- Build fails: Check `backend/package.json` scripts
- App crashes: Check environment variables, especially DATABASE_URL
- Timeout: Free tier has 30-second startup limit

### **Database Issues:**
- Connection fails: Verify Supabase URL is correct
- Tables missing: Re-run SQL migrations
- Permissions: Check Supabase project settings

### **WebSocket Issues:**
- Not connecting: Ensure Render allows WebSocket connections
- CORS errors: Check Render CORS settings

---

## 💰 **COST SUMMARY**

- **Netlify:** $0 (100GB bandwidth free)
- **Render:** $0 (750 hours free)
- **Supabase:** $0 (500MB free)
- **Upstash:** $0 (10k requests free)
- **GitHub:** $0 (unlimited public repos)
- **Loom:** $0 (free tier)

**Total: $0** ✅

---

## 🏆 **SUCCESS CRITERIA**

- [ ] Frontend loads without errors
- [ ] Risk quiz saves data to database
- [ ] Dashboard displays correctly
- [ ] WebSocket connections work
- [ ] All URLs are publicly accessible
- [ ] Demo video shows working features
- [ ] Screenshots captured
- [ ] DoraHacks submission complete

---

## 🎯 **FINAL CHECKLIST**

### **Pre-Submission:**
- [x] Code complete and tested
- [x] Accounts created
- [ ] Frontend deployed to Netlify
- [ ] Backend deployed to Render
- [ ] Database configured in Supabase
- [ ] Redis configured in Upstash
- [ ] URLs tested and working
- [ ] Demo video recorded
- [ ] Screenshots taken
- [ ] DoraHacks submission filled

### **Submission Ready:**
- [ ] Live demo URL
- [ ] Working API
- [ ] Demo video
- [ ] GitHub repository
- [ ] Screenshots
- [ ] Project description

---

**Status: Manual deployment ready - more reliable than Windsurf for hackathons!** 🚀

**Let's get this deployed and submitted!** 🎯
