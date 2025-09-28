# 📁 tools/ Directory

Testing and utility tools for the SentinelAI project.

## 📂 Files

### 🧪 Testing Tools
- `test-real-proof-server.js` - Tests real Midnight proof server connectivity
- `backtest.py` - Python backtesting tool for AI strategies

## 🚀 Usage

### Proof Server Testing
```bash
# Test current proof server setup
node tools/test-real-proof-server.js

# Output shows mode (MOCK vs REAL) and connectivity status
```

### AI Strategy Backtesting
```bash
# Run backtests on AI trading strategies
python tools/backtest.py

# Configure parameters in the script for different scenarios
```

## 🔧 Requirements

### For test-real-proof-server.js:
- Node.js
- Active proof server (mock or real)

### For backtest.py:
- Python 3.x
- Required Python packages (see script imports)

## 📊 Tool Purposes

- **test-real-proof-server.js**: Validates proof server integration and distinguishes between mock and real servers
- **backtest.py**: Tests AI trading strategies against historical data to validate performance

## 🤝 Contributing

When adding new tools:
1. Add comprehensive documentation in the tool's comments
2. Include usage examples
3. Specify requirements and dependencies
4. Update this README
