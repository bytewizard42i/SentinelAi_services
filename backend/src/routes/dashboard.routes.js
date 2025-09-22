// Dashboard Routes
import express from 'express';

const router = express.Router();

export default function() {
  router.get('/status', (req, res) => {
    res.json({ 
      system: 'operational',
      pillars: {
        watchdog: 'active',
        guardian: 'active',
        profiler: 'active'
      },
      metrics: {
        maxDrawdown: -28,
        fraudDetection: 95,
        responseTime: '<1 minute'
      }
    });
  });

  router.get('/metrics', async (req, res) => {
    res.json({ 
      treasury: {
        totalValue: 1000000,
        assets: 12,
        transactions24h: 156
      },
      performance: {
        dayChange: '+2.4%',
        weekChange: '+5.1%',
        monthChange: '+12.3%'
      }
    });
  });

  return router;
}
