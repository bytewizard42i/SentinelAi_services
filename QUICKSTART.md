# 🚀 SentinelAI Quick Start Guide

## Prerequisites
- Docker & Docker Compose
- Node.js 22.15.1
- 4GB RAM minimum
- Midnight testnet access

## 🎯 5-Minute Setup

### 1. Clone & Configure
```bash
git clone https://github.com/bytewizard42i/SentinelAi_services.git
cd SentinelAi_services/SentinelAi_services-project
cp backend/.env.example backend/.env
```

### 2. Launch with Docker
```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

### 3. Access Applications
- **Dashboard**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Risk Quiz**: http://localhost:3001/risk-tolerance-quiz.html
- **Grafana**: http://localhost:3002 (admin/sentinel_admin_2024)
- **Prometheus**: http://localhost:9090

## 🎮 Demo Walkthrough

### Step 1: Take Risk Assessment
1. Open http://localhost:3001/risk-tolerance-quiz.html
2. Complete the 7-question quiz
3. Review your risk profile (Conservative/Balanced/Aggressive)
4. Click "Go to Dashboard"

### Step 2: Explore Dashboard
1. **Overview Tab**: See treasury value, allocation, and performance
2. **Watchdog Tab**: Monitor for anomalies and suspicious activity
3. **Guardian Tab**: View market conditions and rebalancing recommendations
4. **Profiler Tab**: Manage your risk settings

### Step 3: Simulate Market Events
```bash
# Trigger bear market scenario
curl -X POST http://localhost:3000/api/simulate/bear-market

# Trigger anomaly detection
curl -X POST http://localhost:3000/api/simulate/anomaly

# Trigger rebalancing
curl -X POST http://localhost:3000/api/simulate/rebalance
```

## 🔧 Deploy Smart Contracts

### Automatic Deployment
```bash
cd deploy
chmod +x deploy-contracts.sh
./deploy-contracts.sh full
```

### Manual Deployment
```bash
# Compile contracts
./deploy-contracts.sh compile

# Deploy to testnet
./deploy-contracts.sh deploy

# Initialize orchestrator
./deploy-contracts.sh init
```

## 📊 Monitor Performance

### Grafana Dashboard
1. Open http://localhost:3002
2. Login: admin/sentinel_admin_2024
3. Navigate to "SentinelAI Treasury" dashboard

### Health Checks
```bash
# Check all services
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:6300/health

# Check contract status
curl http://localhost:3000/api/contracts/status
```

## 🧪 Run Tests

### Unit Tests
```bash
cd tests
npm install
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Coverage Report
```bash
npm run test:coverage
open coverage/index.html
```

## 🐛 Troubleshooting

### Docker Issues
```bash
# Reset all containers
docker-compose -f docker-compose.production.yml down -v
docker-compose -f docker-compose.production.yml up -d --build

# Check logs
docker-compose -f docker-compose.production.yml logs [service_name]
```

### Contract Deployment Issues
```bash
# Check Midnight network status
curl https://midnight-testnet.hyperlane.com/status

# Verify proof server
curl http://localhost:6300/health

# Check deployment logs
cat deploy/deployment-report.md
```

### API Connection Issues
```bash
# Test backend
curl http://localhost:3000/api/health

# Test WebSocket
wscat -c ws://localhost:3000/ws

# Check Redis
docker exec sentinel-redis redis-cli ping
```

## 📚 Documentation

- **Architecture**: [PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md)
- **Contracts**: [contracts/README.md](contracts/README.md)
- **API Docs**: http://localhost:3000/api-docs
- **Hackathon Submission**: [HACKATHON_SUBMISSION.md](HACKATHON_SUBMISSION.md)

## 🎥 Demo Videos

- [Complete Walkthrough](https://youtu.be/demo-complete)
- [Risk Assessment Flow](https://youtu.be/demo-risk)
- [Anomaly Detection](https://youtu.be/demo-anomaly)
- [Rebalancing Demo](https://youtu.be/demo-rebalancing)

## 💬 Support

- **Discord**: [Join our server](https://discord.gg/sentinelai)
- **GitHub Issues**: [Report bugs](https://github.com/bytewizard42i/SentinelAi_services/issues)
- **Email**: john@sentinelai.services

## 🏆 Hackathon Features

✅ Three-tier AI governance (Watchdog, Guardian, Profiler)
✅ Privacy-preserving with Midnight Network
✅ Real-time dashboard with WebSocket updates
✅ Comprehensive test coverage (100+ tests)
✅ Docker containerization for easy deployment
✅ CI/CD pipeline with GitHub Actions
✅ Production-ready monitoring (Prometheus + Grafana)
✅ API integration for all features
✅ Beautiful, responsive UI

---

**Built with 💜 for the Dega-Midnight Hackathon**
