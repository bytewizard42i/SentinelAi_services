# 🔐 Midnight Network Integration Guide
# Ensuring SentinelAI runs on local proof server as hackathon prerequisite

## 🎯 Hackathon Requirement Met
✅ **"Docker with Proof Server v4"** - Implemented and configured

## 📋 Midnight Integration Checklist

### ✅ Completed:
- [x] Proof Server v4 configured in docker-compose.yml
- [x] Backend connects to proof server at `http://proof-server:6300`
- [x] Contracts configured for Midnight testnet
- [x] MCP server integrated with proof server
- [x] ElizaOS agents configured for Midnight network
- [x] Multi-wallet support for Midnight testnet

### 🔄 Current Status:
- [x] Docker image: `midnight/proof-server:v4`
- [x] Port: 6300 (internal), accessible at localhost:6300
- [x] Network: testnet
- [x] Health check: `/health` endpoint
- [x] Integration: Backend and contracts connect properly

## 🚀 Starting Midnight Proof Server

### Quick Start:
```bash
# Start only proof server
docker-compose up -d proof-server

# Check if running
docker-compose ps
curl http://localhost:6300/health

# Start full stack with Midnight
docker-compose up -d
```

### Full Development Environment:
```bash
# Start all services including Midnight proof server
docker-compose up -d

# Start with multi-account support
docker-compose --profile multi-account up -d

# Start with CLI tools for testing
docker-compose --profile cli up -d
```

## 🧪 Testing Midnight Integration

### 1. Test Proof Server Health:
```bash
curl http://localhost:6300/health
# Expected: {"status":"healthy"}
```

### 2. Test Backend Connection:
```bash
curl http://localhost:3000/health
# Should show proof server connectivity
```

### 3. Test Contract Deployment:
```bash
./deploy/deploy-contracts.sh full
# Should deploy to testnet via proof server
```

### 4. Test AI Agent Integration:
```bash
curl http://localhost:5000/health  # ElizaOS
curl http://localhost:3000/mcp/health  # MCP Server
```

## 🔧 Configuration Details

### Proof Server Environment:
```yaml
image: midnight/proof-server:v4
ports:
  - "6300:6300"
environment:
  - PROOF_SERVER_PORT=6300
  - NETWORK=testnet
volumes:
  - proof-data:/data
```

### Backend Integration:
```javascript
const midnightConfig = {
  nodeUrl: process.env.MIDNIGHT_NODE_URL || 'https://midnight-testnet.hyperlane.com',
  proofServerUrl: process.env.MIDNIGHT_PROOF_SERVER_URL || 'http://localhost:6300',
  network: 'testnet',
  sdkVersion: '2.0.2'  // As required by workshop
};
```

### Contract Configuration:
```compact
// TreasuryWatchdog.compact
pragma language_version 0.17;
import CompactStandardLibrary;

// Configured for Midnight testnet
// Uses proof server for ZK proofs
```

## 🌐 Network Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │────│   Backend       │
│   (React)       │    │   (Node.js)     │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┼─────────────────────┐
                                 │                     │
                    ┌────────────▼────────────┐ ┌─────▼─────┐
                    │   Proof Server v4      │ │  MCP Server│
                    │   (localhost:6300)     │ │ (AI Agent) │
                    └────────────────────────┘ └───────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Midnight Testnet     │
                    │   Blockchain Network   │
                    └────────────────────────┘
```

## 🔍 Troubleshooting Midnight Integration

### Issue: Proof Server Won't Start
```bash
# Check logs
docker-compose logs proof-server

# Try different image
docker pull midnight/proof-server:latest
# Edit docker-compose.yml to use :latest

# Restart
docker-compose down && docker-compose up -d proof-server
```

### Issue: Backend Can't Connect
```bash
# Verify environment variables
echo $MIDNIGHT_PROOF_SERVER_URL
# Should be: http://localhost:6300

# Test connectivity
curl http://localhost:6300/health
```

### Issue: Contract Deployment Fails
```bash
# Check proof server is running
docker-compose ps | grep proof-server

# Verify network configuration
cat deploy/deploy-contracts.sh | grep PROOF_SERVER

# Test deployment manually
./deploy/deploy-contracts.sh compile
./deploy/deploy-contracts.sh deploy
```

## 📚 Midnight Resources

### Official Documentation:
- Midnight Network: https://docs.midnight.network
- Proof Server Setup: https://docs.midnight.network/proof-server
- Compact Contracts: https://docs.midnight.network/compact

### Workshop Requirements Met:
✅ Node.js 22.15.1
✅ Eliza OS 1.5.9
✅ Docker with Proof Server v4
✅ Midnight SDK 2.0.2
✅ MCP for AI communication
✅ Yarn 4.1.0+

## 🎯 Verification Commands

```bash
# Complete system health check
echo "=== Midnight Proof Server ==="
curl -s http://localhost:6300/health || echo "❌ Proof server down"

echo "=== Backend API ==="
curl -s http://localhost:3000/health || echo "❌ Backend down"

echo "=== MCP Server ==="
curl -s http://localhost:3000/mcp/health || echo "❌ MCP down"

echo "=== ElizaOS Agent ==="
curl -s http://localhost:5000/health || echo "❌ Eliza down"

echo "=== Contract Addresses ==="
cat deploy/contract_addresses.txt 2>/dev/null || echo "❌ No contracts deployed"
```

## 🚀 Production Deployment

For live deployment, use the production docker-compose:
```bash
# Production with Midnight
docker-compose -f docker-compose.production.yml up -d

# Verify all services
docker-compose -f docker-compose.production.yml ps
```

**Status: ✅ Midnight Network integration complete and verified as hackathon prerequisite!**
