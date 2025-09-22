// SentinelAI Services Backend
// Main server entry point with Midnight integration

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { MidnightService } from './services/midnight.service.js';
import { WatchdogService } from './services/watchdog.service.js';
import { GuardianService } from './services/guardian.service.js';
import { ProfilerService } from './services/profiler.service.js';
import { OrchestratorService } from './services/orchestrator.service.js';
import { MarketDataService } from './services/market-data.service.js';
import { logger } from './utils/logger.js';
import watchdogRoutes from './routes/watchdog.routes.js';
import guardianRoutes from './routes/guardian.routes.js';
import profilerRoutes from './routes/profiler.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize services
const midnightService = new MidnightService();
const watchdogService = new WatchdogService(midnightService);
const guardianService = new GuardianService(midnightService);
const profilerService = new ProfilerService(midnightService);
const orchestratorService = new OrchestratorService(
  watchdogService,
  guardianService,
  profilerService
);
const marketDataService = new MarketDataService(guardianService);

// Routes
app.use('/api/watchdog', watchdogRoutes);
app.use('/api/guardian', guardianRoutes);
app.use('/api/profiler', profilerRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    services: {
      midnight: midnightService.isConnected(),
      watchdog: watchdogService.isActive(),
      guardian: guardianService.isActive(),
      profiler: profilerService.isActive(),
      orchestrator: orchestratorService.isActive()
    },
    timestamp: new Date().toISOString()
  });
});

// WebSocket server for real-time updates
const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  logger.info('New WebSocket connection');

  // Send initial state
  ws.send(JSON.stringify({
    type: 'init',
    data: {
      treasury: guardianService.getCurrentAllocation(),
      alerts: watchdogService.getActiveAlerts(),
      market: marketDataService.getLatestData()
    }
  }));

  // Subscribe to updates
  orchestratorService.on('action', (action) => {
    ws.send(JSON.stringify({
      type: 'action',
      data: action
    }));
  });

  watchdogService.on('alert', (alert) => {
    ws.send(JSON.stringify({
      type: 'alert',
      data: alert
    }));
  });

  guardianService.on('rebalance', (rebalance) => {
    ws.send(JSON.stringify({
      type: 'rebalance',
      data: rebalance
    }));
  });

  ws.on('close', () => {
    logger.info('WebSocket connection closed');
  });
});

// Start services
async function startServices() {
  try {
    // Connect to Midnight
    await midnightService.connect();
    logger.info('Connected to Midnight Network');

    // Deploy contracts if needed
    await midnightService.deployContracts();
    logger.info('Contracts deployed/verified');

    // Initialize services
    await watchdogService.initialize();
    await guardianService.initialize();
    await profilerService.initialize();
    await orchestratorService.initialize();
    logger.info('All services initialized');

    // Start market data polling
    marketDataService.startPolling();
    logger.info('Market data polling started');

    // Start orchestrator processing
    orchestratorService.startProcessing();
    logger.info('Orchestrator processing started');

  } catch (error) {
    logger.error('Failed to start services:', error);
    process.exit(1);
  }
}

// Error handling
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  await startServices();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await midnightService.disconnect();
  process.exit(0);
});

export default app;
