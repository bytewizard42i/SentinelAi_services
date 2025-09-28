// SentinelAI Services Backend - Demo Mode
// Runs without requiring Midnight network connection

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock data for demo
const mockData = {
  treasury: {
    totalValue: 1000000,
    allocation: {
      stablecoins: { percentage: 60, value: 600000, tokens: ['USDC', 'DAI'] },
      majors: { percentage: 30, value: 300000, tokens: ['ETH', 'BTC'] },
      growth: { percentage: 10, value: 100000, tokens: ['UNI', 'AAVE'] }
    }
  },
  alerts: [],
  riskProfile: {
    type: 'Conservative',
    score: 3
  },
  marketData: {
    ETH: { price: 1650, change24h: -2.3 },
    BTC: { price: 35000, change24h: 1.2 },
    USDC: { price: 1, change24h: 0 }
  }
};

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    mode: 'demo',
    services: {
      midnight: false,
      watchdog: true,
      guardian: true,
      profiler: true,
      orchestrator: true
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    treasury: mockData.treasury,
    riskProfile: mockData.riskProfile,
    alerts: mockData.alerts,
    marketData: mockData.marketData
  });
});

app.get('/api/watchdog/alerts', (req, res) => {
  res.json({ alerts: mockData.alerts });
});

app.post('/api/watchdog/challenge', (req, res) => {
  const alert = {
    id: Date.now(),
    type: 'LARGE_WITHDRAWAL',
    severity: 'HIGH',
    message: `Large withdrawal of ${req.body.amount} detected`,
    timestamp: new Date().toISOString(),
    status: 'PENDING_CHALLENGE'
  };
  mockData.alerts.push(alert);
  res.json({ success: true, alert });
});

app.get('/api/guardian/allocation', (req, res) => {
  res.json(mockData.treasury.allocation);
});

app.post('/api/guardian/rebalance', (req, res) => {
  res.json({
    success: true,
    message: 'Rebalancing simulation complete',
    newAllocation: req.body.allocation || mockData.treasury.allocation
  });
});

app.get('/api/profiler/profile', (req, res) => {
  res.json(mockData.riskProfile);
});

app.post('/api/profiler/quiz', (req, res) => {
  const { answers } = req.body;
  const score = answers ? answers.reduce((acc, val) => acc + val, 0) / answers.length : 3;
  const types = ['Conservative', 'Moderate', 'Aggressive'];
  const type = types[Math.min(Math.floor(score / 2), 2)];
  
  mockData.riskProfile = { type, score };
  res.json({ profile: mockData.riskProfile });
});

// WebSocket server for real-time updates
const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  // Send initial state
  ws.send(JSON.stringify({
    type: 'init',
    data: {
      treasury: mockData.treasury,
      alerts: mockData.alerts,
      market: mockData.marketData
    }
  }));
  
  // Simulate periodic updates
  const interval = setInterval(() => {
    // Update market prices slightly
    Object.keys(mockData.marketData).forEach(token => {
      const change = (Math.random() - 0.5) * 2;
      mockData.marketData[token].price *= (1 + change / 100);
      mockData.marketData[token].change24h += change / 10;
    });
    
    ws.send(JSON.stringify({
      type: 'market_update',
      data: mockData.marketData
    }));
  }, 5000);
  
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    clearInterval(interval);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 SentinelAI Demo Server Running
================================
📍 API Server: http://localhost:${PORT}
🔌 WebSocket: ws://localhost:8080
📊 Dashboard: http://localhost:3001
🧪 Mode: Demo (No Midnight Connection)

Available endpoints:
- GET  /health
- GET  /api/dashboard/stats
- GET  /api/watchdog/alerts
- POST /api/watchdog/challenge
- GET  /api/guardian/allocation
- POST /api/guardian/rebalance
- GET  /api/profiler/profile
- POST /api/profiler/quiz
  `);
});
