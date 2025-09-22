# SentinelAI Services - Setup Guide
## Based on Dega Workshop Best Practices

### Prerequisites

#### Required Versions (Critical for Compatibility)
- **Node.js**: 22.15.1 (exact version required)
- **Yarn**: 4.1.0 or 4.1.1
- **Docker**: Latest stable
- **Midnight Proof Server**: v4.0.0

### Quick Start

#### 1. Clone and Setup
```bash
# Clone the repository
git clone https://github.com/bytewizard42i/SentinelAi_services.git
cd SentinelAi_services/SentinelAi_services-project

# Switch to correct Node version
nvm use 22.15.1

# Enable Yarn 4.1.0
corepack enable
corepack prepare yarn@4.1.0 --activate
```

#### 2. Install Dependencies
```bash
cd backend
yarn install
```

#### 3. Start Proof Server
```bash
# Using Docker
docker-compose up proof-server -d

# Verify it's running on port 6300
curl http://localhost:6300/health
```

#### 4. Setup Agent Wallet
```bash
# Generate wallet credentials and MCP config
node scripts/setup-agent.js my_treasury_agent

# This will output:
# - MIDNIGHT_SEED (keep secure!)
# - MIDNIGHT_MNEMONIC (backup phrase)
# - MCP Server Configuration (for AI agent)
```

#### 5. Configure Environment
```bash
# Copy the generated credentials to .env
# Add any API keys (OpenAI, Discord)
# Add shielded token addresses
```

#### 6. Start the Services

##### Option A: Development Mode (Single Wallet)
```bash
yarn dev
# Wallet will sync and display address
# MCP server starts on port 3000
```

##### Option B: Production Mode (Multi-Wallet with Docker)
```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f treasury-wallet
```

### Testing the Integration

#### 1. Test Wallet Connection
```bash
# In another terminal
curl http://localhost:3000/health
```

#### 2. Test with Natural Language (via Eliza)
If using Eliza OS for AI agent:
```bash
# Clone Eliza
git clone https://github.com/elizaos/eliza.git
cd eliza

# Install (using Bun)
bun install

# Configure character with MCP config from step 4
# Update agent/src/character.json

# Start Eliza
bunx eliza start
```

#### 3. Test Commands
Try these natural language commands:
- "What is my wallet address?"
- "Check my defund token balance"
- "Send 10 tokens to [address]"
- "What's the treasury allocation?"
- "Check anomaly score for user123"

### Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Discord   │────▶│  Eliza/Agent │────▶│  MCP Server │
└─────────────┘     └──────────────┘     └─────────────┘
                            │                     │
                            ▼                     ▼
                    ┌──────────────┐     ┌─────────────┐
                    │  LLM (OpenAI)│     │   Midnight  │
                    └──────────────┘     │   Network   │
                                         └─────────────┘
                                                │
                    ┌───────────────────────────┴──────┐
                    │                                   │
            ┌───────▼────────┐               ┌─────────▼──────┐
            │ Smart Contracts│               │  Proof Server  │
            │  (Compact)     │               │    (Docker)    │
            └────────────────┘               └────────────────┘
```

### Smart Contract Deployment

Our contracts are written in Compact v0.15:
1. `TreasuryWatchdog.compact` - Anomaly detection
2. `MarketGuardian.compact` - Rebalancing logic
3. `RiskProfiler.compact` - User preferences
4. `TreasuryOrchestrator.compact` - Coordination

To compile and deploy:
```bash
# Compile contracts (requires Compact compiler)
yarn compile-contracts

# Deploy to testnet
yarn deploy --network testnet
```

### Common Issues & Solutions

#### Issue: Version Mismatch Errors
**Solution**: Ensure exact versions:
- Midnight SDK packages MUST be version 2.0.2
- Node MUST be 22.15.1
- Yarn MUST be 4.1.0 or 4.1.1

#### Issue: Proof Server Connection Failed
**Solution**: 
- Check Docker is running: `docker ps`
- Check port 6300 is free: `lsof -i :6300`
- Restart proof server: `docker-compose restart proof-server`

#### Issue: Wallet Not Syncing
**Solution**:
- Check network connectivity to testnet
- Verify storage permissions in `./storage`
- Check logs: `tail -f storage/[agent_id]/logs/*.log`

#### Issue: TypeScript Errors with Contracts
**Solution**: The workshop mentioned TypeScript checking can be strict. Ensure all Midnight packages are version 2.0.2 to avoid type mismatches.

### Security Notes

1. **Never commit seeds or mnemonics** to version control
2. **Use Docker** for production multi-wallet setups
3. **Separate wallets** for different services (treasury, watchdog, guardian)
4. **Backup wallet states** from `./storage/[agent_id]/wallets/`

### Advanced Configuration

#### Multi-Agent Setup
```bash
# Start multiple agents on different ports
AGENT_ID=treasury PORT=3000 yarn dev
AGENT_ID=watchdog PORT=3001 yarn dev
AGENT_ID=guardian PORT=3002 yarn dev
```

#### Custom Token Registration
```javascript
// Add to your .env
TOKEN_1=0x123...abc  # Shielded token address
TOKEN_2=0x456...def  # Another token
```

### Support

- Discord: [Join Dega Discord]
- Documentation: https://docs.midnight.network
- Hackathon Support: Available during hackathon period

### Next Steps

1. ✅ Complete wallet setup
2. ✅ Test natural language commands
3. ⬜ Deploy contracts to testnet
4. ⬜ Configure production Docker setup
5. ⬜ Integrate with DAO governance tools
