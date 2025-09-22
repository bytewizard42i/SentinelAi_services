# 🆓 Free SentinelAI Deployment Guide

## Option 1: Static Demo (100% Free)

### Step 1: Upload to Hostinger
1. **Login to Hostinger Control Panel**
2. **Go to File Manager**
3. **Navigate to public_html/**
4. **Upload the frontend/index.html file**
5. **Rename it to index.html (if needed)**

### Step 2: Create Subdirectory (Optional)
```
public_html/
├── index.html (your main site)
├── sentinelai/
│   └── index.html (SentinelAI dashboard)
```

**Access**: `https://yourdomain.com/sentinelai/`

---

## Option 2: Free Backend + Hostinger Frontend

### Step 1: Deploy Backend to Railway (Free Tier)
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login and deploy
railway login
cd backend
railway init
railway up

# You'll get a URL like: https://sentinelai-production.up.railway.app
```

### Step 2: Create API-Connected Frontend
```html
<!-- frontend/dashboard.html -->
<!DOCTYPE html>
<html>
<head>
    <title>SentinelAI Live Dashboard</title>
</head>
<body>
    <div id="dashboard">Loading...</div>
    
    <script>
        const API_BASE = 'https://your-railway-app.up.railway.app';
        
        async function loadDashboard() {
            try {
                const health = await fetch(`${API_BASE}/health`).then(r => r.json());
                const portfolio = await fetch(`${API_BASE}/api/guardian/portfolio`).then(r => r.json());
                
                document.getElementById('dashboard').innerHTML = `
                    <h1>SentinelAI Live Dashboard</h1>
                    <p>Status: ${health.status}</p>
                    <p>Services: ${Object.keys(health.services).length} active</p>
                    <h3>Portfolio:</h3>
                    <pre>${JSON.stringify(portfolio, null, 2)}</pre>
                `;
            } catch (error) {
                document.getElementById('dashboard').innerHTML = 'Error loading dashboard';
            }
        }
        
        loadDashboard();
        setInterval(loadDashboard, 30000); // Update every 30 seconds
    </script>
</body>
</html>
```

---

## Option 3: GitHub Pages + Netlify Functions (Free)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add SentinelAI dashboard"
git push origin main
```

### Step 2: Enable GitHub Pages
1. Go to repository Settings
2. Scroll to Pages section
3. Select source: Deploy from branch
4. Choose main branch, /frontend folder
5. Get URL: `https://username.github.io/repository-name`

### Step 3: Point Your Domain
In Hostinger DNS settings:
```
Type: CNAME
Name: sentinelai
Value: username.github.io
```

**Access**: `https://sentinelai.yourdomain.com`

---

## 🚀 Quick Start (5 Minutes)

### Immediate Deploy to Hostinger:
1. **Download** the `frontend/index.html` file I created
2. **Login** to Hostinger File Manager
3. **Upload** to `public_html/sentinelai/`
4. **Visit** `https://yourdomain.com/sentinelai/`

### Free Tier Limits:
- **Railway**: 500 hours/month (enough for demos)
- **Render**: 750 hours/month
- **Vercel**: Unlimited static, 100GB bandwidth
- **Netlify**: 100GB bandwidth, 300 build minutes

## 💡 Pro Tips

### Custom Subdomain
In Hostinger, create subdomain:
- **Subdomain**: `sentinelai`
- **Document Root**: `public_html/sentinelai`
- **Access**: `https://sentinelai.yourdomain.com`

### SSL Certificate
Hostinger provides free SSL - just enable it in the control panel.

### Performance
- Compress images
- Minify CSS/JS
- Use CDN for libraries
- Enable gzip compression

## 🎯 Hackathon Strategy

For the **Dega-Midnight hackathon**:

1. **Use Option 1** (static demo) for immediate results
2. **Add the Miro board link** prominently
3. **Include GitHub repo link** for judges to see code
4. **Add demo video** if possible

The static demo shows your AI logic and UI/UX skills, while the GitHub repo proves the technical implementation!
