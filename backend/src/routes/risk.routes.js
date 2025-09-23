// Risk Quiz API Integration
// Backend endpoint for risk tolerance quiz submission and profile generation

import express from 'express';
import { profilerService } from '../services/profiler.service.js';
import { orchestratorService } from '../services/orchestrator.service.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Submit quiz responses and generate risk profile
router.post('/api/risk/submit-quiz', async (req, res) => {
  try {
    const { userId, responses } = req.body;
    
    // Validate input
    if (!userId || !responses) {
      return res.status(400).json({
        success: false,
        error: 'Missing userId or quiz responses'
      });
    }
    
    // Validate all questions answered
    const requiredQuestions = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'];
    for (const question of requiredQuestions) {
      if (!responses[question] || responses[question] < 1 || responses[question] > 5) {
        return res.status(400).json({
          success: false,
          error: `Invalid or missing response for ${question}`
        });
      }
    }
    
    // Calculate risk score
    const score = profilerService.calculateRiskScore(responses);
    
    // Generate risk profile
    const profile = profilerService.generateRiskProfile(score);
    
    // Check for suspicious profiles
    const isSuspicious = profilerService.checkSuspiciousProfile(responses, profile);
    if (isSuspicious) {
      // Alert the watchdog
      await orchestratorService.submitAction({
        sourceContract: 3, // Risk Profiler
        actionType: 3, // Alert
        priority: 2, // High
        payload: JSON.stringify({
          userId,
          reason: isSuspicious.reason,
          score
        })
      });
      
      profile.flagged = true;
      profile.flagReason = isSuspicious.reason;
    }
    
    // Store profile in database/blockchain
    await profilerService.storeUserProfile(userId, {
      responses,
      score,
      profile,
      timestamp: Date.now()
    });
    
    // Generate allocation recommendation
    const allocation = profilerService.generateAllocation(profile);
    
    // Return complete profile data
    res.json({
      success: true,
      data: {
        score,
        profile,
        allocation,
        settings: {
          riskAppetite: profile.riskAppetite,
          minStablecoin: profile.minStablecoin,
          maxStablecoin: profile.maxStablecoin,
          rebalanceCooldown: profile.rebalanceCooldown,
          circuitBreakerEnabled: profile.circuitBreakerEnabled
        }
      }
    });
    
    logger.info(`Risk profile generated for user ${userId}: ${profile.level} (score: ${score})`);
    
  } catch (error) {
    logger.error('Error submitting quiz:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process quiz submission'
    });
  }
});

// Get existing risk profile
router.get('/api/risk/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const profile = await profilerService.getUserProfile(userId);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    res.json({
      success: true,
      data: profile
    });
    
  } catch (error) {
    logger.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

// Update risk profile (requires verification)
router.put('/api/risk/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { responses } = req.body;
    
    // Get existing profile
    const existingProfile = await profilerService.getUserProfile(userId);
    if (!existingProfile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    // Calculate new score
    const newScore = profilerService.calculateRiskScore(responses);
    
    // Check for dramatic changes
    const scoreDiff = Math.abs(newScore - existingProfile.score);
    if (scoreDiff > 40) {
      // Flag for review
      await orchestratorService.submitAction({
        sourceContract: 3,
        actionType: 3,
        priority: 2,
        payload: JSON.stringify({
          userId,
          reason: 'Dramatic risk profile change detected',
          previousScore: existingProfile.score,
          newScore
        })
      });
      
      return res.status(400).json({
        success: false,
        error: 'Profile change requires additional verification',
        requiresVerification: true
      });
    }
    
    // Generate new profile
    const newProfile = profilerService.generateRiskProfile(newScore);
    
    // Update profile
    await profilerService.updateUserProfile(userId, {
      responses,
      score: newScore,
      profile: newProfile,
      previousScore: existingProfile.score,
      updatedAt: Date.now()
    });
    
    res.json({
      success: true,
      data: {
        score: newScore,
        profile: newProfile,
        previousScore: existingProfile.score
      }
    });
    
    logger.info(`Risk profile updated for user ${userId}: ${existingProfile.level} -> ${newProfile.level}`);
    
  } catch (error) {
    logger.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Get risk statistics
router.get('/api/risk/stats', async (req, res) => {
  try {
    const stats = await profilerService.getGlobalStatistics();
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// Get allocation recommendation
router.get('/api/risk/allocation/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const profile = await profilerService.getUserProfile(userId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    const allocation = profilerService.generateAllocation(profile.profile);
    
    res.json({
      success: true,
      data: allocation
    });
    
  } catch (error) {
    logger.error('Error generating allocation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate allocation'
    });
  }
});

export default router;
