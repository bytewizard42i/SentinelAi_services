# 🚀 SentinelAI Docker Demo - One-Button Setup

## 🎯 **Instant Demo - Zero Configuration Required!**

Run the entire SentinelAI Services demo with a single command. No dependencies, no setup, just Docker!

---

## ⚡ **Quick Start**

### **Option 1: Using the start script (Recommended)**
```bash
./start-docker-demo.sh
```

### **Option 2: Using docker-compose directly**
```bash
docker-compose -f docker-compose.all-in-one.yml up
```

That's it! The entire stack will start automatically. 🎉

---

## 📊 **What's Included**

### **Services Running:**
- ✅ **Frontend** (React Dashboard) - Port 3001
- ✅ **Backend** (Node.js API) - Port 3000
- ✅ **Proof Server** (Mock Midnight) - Port 6300
- ✅ **PostgreSQL** (Database) - Port 5432
- ✅ **Redis** (Cache) - Port 6379
- ✅ **Nginx** (Reverse Proxy) - Port 80

### **Features Available:**
- 🎮 **Full Simulation Suite** - All market and attack simulations
- 📊 **Animated Allocations** - Watch portfolio bars move in real-time
- 🚨 **Emergency Protection** - One-click safe asset allocation
- 🤖 **Risk Profiler** - Interactive questionnaire
- ⚙️ **Admin Settings** - Granular controls with help tooltips
- 🎨 **Professional UI** - Splash screen, dark theme, hover effects

---

## 🌐 **Access Points**

Once running, access the demo at:

| Service | URL | Description |
|---------|-----|-------------|
| **Dashboard** | http://localhost:3001 | Main UI with all features |
| **API** | http://localhost:3000 | Backend API endpoints |
| **Health Check** | http://localhost:3000/health | API health status |
| **Proxy** | http://localhost | Nginx reverse proxy |

---

## 🎯 **Demo Walkthrough**

### **1. Splash Screen**
- Beautiful banner image appears for 2 seconds
- Loading animation with smooth transitions

### **2. Dashboard Overview**
- Treasury value display
- Risk profile summary
- Active alerts panel

### **3. Market Guardian Tab**
Try these features:
- Click **"Simulate Market Downturn"** - Watch bars animate to 60% stablecoins
- Click **"Simulate Market Uptrend"** - Watch bars animate to 15% stablecoins
- Click **"Reset"** - Return to default 30/50/20 allocation
- Click **"Emergency Market Protection"** - Open allocation sliders

### **4. Treasury Watchdog Tab**
Test security features:
- Click **"Simulate Attack"** - Increment attack counter
- Click **"Reset"** - Reset counter to 0
- View anomaly detection alerts

### **5. Risk Profiler Tab**
- Click **"Auto Profile Investor"** - Take the risk quiz
- Choose **Newbie** or **Expert** mode
- Get personalized risk score

---

## 🛠️ **Management Commands**

### **View Logs**
```bash
docker-compose -f docker-compose.all-in-one.yml logs -f
```

### **Stop All Services**
```bash
docker-compose -f docker-compose.all-in-one.yml down
```

### **Restart Services**
```bash
docker-compose -f docker-compose.all-in-one.yml restart
```

### **Clean Everything** (including volumes)
```bash
docker-compose -f docker-compose.all-in-one.yml down -v
```

---

## 🔧 **Troubleshooting**

### **Port Already in Use**
If you get port conflicts:
```bash
# Stop existing services
docker-compose -f docker-compose.all-in-one.yml down

# Or kill specific ports
sudo lsof -i :3000 -i :3001 -i :6300
```

### **Services Not Starting**
Check individual service logs:
```bash
docker-compose -f docker-compose.all-in-one.yml logs frontend
docker-compose -f docker-compose.all-in-one.yml logs backend
```

### **Database Issues**
Reset the database:
```bash
docker-compose -f docker-compose.all-in-one.yml down -v
docker-compose -f docker-compose.all-in-one.yml up -d postgres
# Wait 5 seconds
docker-compose -f docker-compose.all-in-one.yml up -d
```

---

## 🎯 **Why This Rocks**

### **Zero Dependencies**
- No Node.js installation required
- No package management needed
- No environment setup
- Just Docker!

### **Complete Stack**
- All services containerized
- Database initialized automatically
- Mock proof server included
- Everything configured

### **Professional Demo**
- Production-like setup
- All features working
- Beautiful UI with animations
- Ready for hackathon judging

---

## 🏆 **Perfect For**

- **Hackathon Demos** - Guaranteed to work on judges' machines
- **Team Collaboration** - Everyone gets the same environment
- **Quick Testing** - Spin up/down in seconds
- **Presentations** - No setup anxiety, just run and show

---

## 📝 **Requirements**

- **Docker** - [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** - Usually included with Docker Desktop
- **4GB RAM** - For smooth operation
- **Ports Available** - 80, 3000, 3001, 5432, 6300, 6379

---

## 🚀 **Ready to Demo?**

```bash
# One command to rule them all
./start-docker-demo.sh
```

Visit http://localhost:3001 and enjoy the show! 🎉

---

**Built with 💜 for the Dega-Midnight Hackathon**

*SentinelAI Services - AI-Powered DAO Treasury Management*
