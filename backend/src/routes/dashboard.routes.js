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

  router.get('/stats', (req, res) => {
    res.json({
      treasury: {
        totalValue: 1000000,
        allocation: {
          stablecoins: { percentage: 60, value: 600000 },
          majors: { percentage: 30, value: 300000 },
          growth: { percentage: 10, value: 100000 }
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
