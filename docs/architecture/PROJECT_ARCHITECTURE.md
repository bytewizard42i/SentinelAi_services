# SentinelAI Services - Three-Pillar Architecture

## Project Overview
AI-governed DAO treasury management with privacy-preserving features on Midnight Network.

## Three-Pillar System (Priority Order)

### 1. AI Treasury Watchdog (Priority 1: Safety from Nefarious Actions)
**Contract:** `TreasuryWatchdog.compact`
- **Purpose:** Behavioral anomaly detection for admin/user actions
- **Features:**
  - Profile building for normal behavior patterns
  - Anomaly scoring using Isolation Forest algorithm
  - Challenge mechanism for suspicious transactions
  - Emergency freeze capability
  - Alert system for DAO members
- **Privacy:** User profiles stored as encrypted DIDs, actions verified without revealing identity

### 2. AI Market Guardian (Priority 2: Safety of Funds)
**Contract:** `MarketGuardian.compact`
- **Purpose:** Automated risk rebalancing based on market conditions
- **Features:**
  - Real-time market data monitoring
  - Tiered rebalancing (gradual, not all-or-nothing)
  - User-defined risk sliders (conservative/balanced/aggressive)
  - Buy-the-dip automation
  - Circuit breaker for flash crashes
- **Privacy:** ZK proofs for allocation compliance without exposing treasury composition

### 3. AI Risk Profiler (Priority 3: Individual User Preferences)
**Contract:** `RiskProfiler.compact`
- **Purpose:** Personalized allocation based on user risk tolerance
- **Features:**
  - Onboarding quiz for risk assessment
  - Age/goals/experience-based allocation
  - Dynamic adjustment capability
  - Profile change detection (sudden high-risk flags)
  - Integration with treasury allocation
- **Privacy:** Profiles as selective disclosure credentials

## Inter-Contract Communication

### Data Flow Architecture
```
User Input → RiskProfiler → Profile Creation
                ↓
MarketGuardian ← Profile Data
     ↓
Rebalancing Decision → TreasuryWatchdog (Validation)
     ↓
Approved Action → Treasury Execution
```

### Conflict Resolution Rules
1. **Watchdog Override:** Can block any action from other contracts
2. **Guardian Priority:** Market safety overrides individual preferences
3. **Profile Constraints:** Sets boundaries but doesn't force actions

## Technical Stack

### Core Technologies
- **Blockchain:** Midnight Network
- **Smart Contracts:** Compact v0.15
- **AI/ML Models:**
  - Prophet (time-series forecasting for Market Guardian)
  - Isolation Forest (anomaly detection for Watchdog)
  - Risk scoring algorithm (for Profiler)
- **Backend:** Node.js + Mesh.js
- **Frontend:** React + Chart.js (for demo)
- **Privacy:** ZK proofs + DIDs

### Development Tools
- **Docker:** Midnight Proof Server v4.0.0
- **MCP:** Model Context Protocol for AI integration
- **ElizaOS:** Natural language interface

## Project Structure
```
SentinelAi_services-project/
├── contracts/           # Compact smart contracts
│   ├── TreasuryWatchdog.compact
│   ├── MarketGuardian.compact
│   └── RiskProfiler.compact
├── ai-models/          # AI/ML implementations
│   ├── anomaly-detector/
│   ├── market-predictor/
│   └── risk-assessor/
├── backend/            # Node.js server
│   ├── api/
│   ├── midnight-integration/
│   └── ai-orchestrator/
├── frontend/           # React demo dashboard
│   ├── components/
│   └── visualizations/
├── tests/              # Test suites
│   ├── contract-tests/
│   └── integration-tests/
└── docs/               # Documentation
    ├── API.md
    └── DEPLOYMENT.md
```

## Key Design Decisions

1. **Modular Contracts:** Each pillar operates independently but shares data
2. **Safety First:** Priority order ensures protection over optimization
3. **Privacy by Design:** All sensitive data uses ZK proofs or encrypted storage
4. **Human Override:** Always maintains manual intervention capability
5. **Incremental Deployment:** Can deploy pillars separately for testing

## Success Metrics

- **Watchdog:** 90%+ detection rate for anomalous activity
- **Guardian:** 20-30% drawdown reduction in bear markets
- **Profiler:** User satisfaction with personalized allocations
- **Overall:** Zero treasury loss from attacks or panic selling
