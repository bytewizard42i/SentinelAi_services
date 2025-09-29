# Changelog

All notable changes to the SentinelAI Services project will be documented in this file.

## [2.0.0] - 2025-09-28 - "Pressing Our Luck" Release

### 🎯 Major Features Added

#### Admin Control System
- **Admin Settings Panel**: Added comprehensive admin controls for each AI pillar
  - Overview: Refresh interval, alert thresholds, display currency
  - Watchdog: Anomaly detection sensitivity, transaction limits, circuit breakers
  - Guardian: Rebalancing thresholds, volatility limits, automation settings
  - Profiler: Risk parameters, stablecoin allocations, emergency modes

#### Interactive Help System
- **Info Icons (i)**: Added circular info buttons next to each admin setting
- **Detailed Tooltips**: Click to reveal comprehensive explanations and best practices
- **Context-Sensitive Help**: Each setting includes:
  - What it does
  - Recommended values
  - Impact on system behavior
  - Security implications

#### Automated Profile Investor
- **Smart Questionnaire**: Adaptive risk assessment system
- **Dual Expertise Modes**:
  - **Newbie Mode**: Simple questions about comfort levels and goals
  - **Expert Mode**: Technical questions about Sharpe ratios and strategies
- **Dynamic Risk Scoring**: 0-100 scale with automatic profile assignment
- **Visual Progress Tracking**: Progress bar shows questionnaire completion

### 🔧 Technical Improvements

#### UI/UX Enhancements
- Modal overlays with proper z-indexing
- Hover effects and transitions for better interactivity
- Color-coded status indicators (green/orange/red)
- Responsive design for all screen sizes
- Keyboard navigation support

#### State Management
- Centralized admin settings storage
- Persistent configuration across sessions
- Real-time setting updates without page refresh
- Modular component architecture

### 📋 Setting Explanations Added

#### Watchdog Settings
- **Anomaly Threshold**: 0-100 sensitivity scale for threat detection
- **Max Transaction Size**: Automatic approval limits
- **Circuit Breaker**: Emergency stop mechanism
- **Alert Delay**: Notification throttling to prevent spam
- **Suspicious Pattern Detection**: AI behavioral analysis toggle

#### Guardian Settings
- **Rebalance Threshold**: Portfolio drift tolerance
- **Market Volatility Limit**: Trading pause triggers
- **Auto Rebalance**: Automation on/off switch
- **Rebalance Frequency**: Hourly/Daily/Weekly options
- **Slippage Tolerance**: Maximum acceptable price deviation

#### Profiler Settings
- **Min/Max Stablecoin**: Portfolio safety bounds
- **Risk Update Frequency**: Profile recalculation schedule
- **Auto Adjust**: Dynamic risk management toggle
- **Emergency Mode**: Crisis response activation

### 🐛 Bug Fixes
- Fixed modal z-index stacking issues
- Resolved state persistence problems
- Corrected tooltip positioning on edge cases

### 📚 Documentation Updates
- Added comprehensive help text for all settings
- Created detailed admin guide
- Updated README with v2.0 features
- Added this CHANGELOG.md

### 🔄 Migration Notes
For users upgrading from v1.0:
1. Pull the `pressing-our-luck` branch
2. Run `npm install` in both frontend and backend
3. Clear browser cache for UI updates
4. Review new admin settings for optimal configuration

### 🎯 Coming Next (v2.1)
- Setting presets (Conservative/Balanced/Aggressive)
- Export/Import configuration files
- Multi-user admin roles
- Audit logs for setting changes
- Mobile app support

---

## [1.0.0] - 2025-09-22 - Initial Release

### Features
- Three-tier AI governance system
- Basic dashboard with 4 tabs
- Risk assessment quiz
- Midnight Network integration
- Docker deployment
- Real-time WebSocket updates

### Contributors
- John Santi - Lead Developer
- Cassie (AI Assistant) - Architecture & Implementation

---

For questions or support, contact: john@sentinelai.services
