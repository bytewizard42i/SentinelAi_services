// Watchdog Routes
import express from 'express';

const router = express.Router();

export default function(watchdogService) {
  router.get('/status', (req, res) => {
    res.json({ status: 'active', monitoring: true });
  });

  router.get('/alerts', async (req, res) => {
    res.json({ alerts: [] });
  });

  router.post('/scan', async (req, res) => {
    res.json({ message: 'Scan initiated', status: 'scanning' });
  });

  return router;
}
