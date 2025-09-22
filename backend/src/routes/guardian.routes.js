// Guardian Routes
import express from 'express';

const router = express.Router();

export default function(guardianService) {
  router.get('/status', (req, res) => {
    res.json({ status: 'active', rebalancing: false });
  });

  router.post('/rebalance', async (req, res) => {
    res.json({ message: 'Rebalancing initiated', status: 'rebalancing' });
  });

  router.get('/portfolio', async (req, res) => {
    res.json({ 
      portfolio: {
        ETH: 40,
        BTC: 30,
        USDT: 20,
        USDC: 10
      }
    });
  });

  return router;
}
