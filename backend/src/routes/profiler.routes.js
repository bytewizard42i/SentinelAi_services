// Profiler Routes
import express from 'express';

const router = express.Router();

export default function(profilerService) {
  router.get('/status', (req, res) => {
    res.json({ status: 'active', profiles: 3 });
  });

  router.post('/profile', async (req, res) => {
    res.json({ 
      profile: 'conservative',
      allocation: {
        stablecoins: 60,
        majors: 30,
        growth: 10
      }
    });
  });

  router.get('/quiz', async (req, res) => {
    res.json({ 
      questions: [
        "What's your investment time horizon?",
        "How comfortable are you with volatility?",
        "What's your primary goal?"
      ]
    });
  });

  return router;
}
