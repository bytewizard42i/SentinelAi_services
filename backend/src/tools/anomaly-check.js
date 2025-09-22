// Anomaly Detection Tool - Pillar 2: Treasury Watchdog
// Behavioral anomaly detection for nefarious activity

import { logger } from '../utils/logger.js';
import crypto from 'crypto';

export class AnomalyDetector {
  constructor(midnightService) {
    this.midnight = midnightService;
    this.transactionHistory = [];
    this.userProfiles = new Map();
    this.alerts = [];
    
    // Isolation Forest parameters
    this.isolationForest = {
      numTrees: 100,
      sampleSize: 256,
      anomalyThreshold: 0.8
    };
    
    // Configuration
    this.config = {
      maxTransactionSize: 1000,      // Max normal tx size
      maxDailyTransactions: 10,      // Max txs per day
      unusualTimeWindow: [0, 6],     // Unusual hours (0-6 AM)
      challengeRequired: true,        // Require 2FA for anomalies
      alertThreshold: 0.8            // Anomaly score threshold
    };
  }

  // MCP Tool Schema
  getSchema() {
    return {
      name: 'detect_anomaly',
      description: 'Check transaction for anomalous patterns',
      parameters: {
        tx_type: {
          type: 'string',
          description: 'Transaction type (withdraw, transfer, stake)',
          required: true
        },
        user_id: {
          type: 'string',
          description: 'User identifier (hashed pubkey)',
          required: true
        },
        amount: {
          type: 'number',
          description: 'Transaction amount',
          required: true
        },
        metadata: {
          type: 'object',
          description: 'Additional transaction metadata',
          default: {}
        }
      }
    };
  }

  async execute(params) {
    const { tx_type, user_id, amount, metadata } = params;
    
    try {
      // Hash user ID for privacy
      const hashedUserId = this.hashUserId(user_id);
      
      // Get or create user profile
      const profile = this.getUserProfile(hashedUserId);
      
      // Create transaction features
      const features = this.extractFeatures({
        type: tx_type,
        amount: amount,
        timestamp: Date.now(),
        userId: hashedUserId,
        ...metadata
      });
      
      // Calculate anomaly score
      const anomalyScore = this.calculateAnomalyScore(features, profile);
      
      // Determine if anomaly
      const isAnomaly = anomalyScore > this.config.alertThreshold;
      
      // Update user profile
      this.updateProfile(hashedUserId, features, anomalyScore);
      
      if (isAnomaly) {
        // Create alert
        const alert = await this.createAlert({
          userId: hashedUserId,
          txType: tx_type,
          amount: amount,
          anomalyScore: anomalyScore,
          reason: this.getAnomalyReason(features, profile),
          timestamp: Date.now()
        });
        
        // Challenge required
        const challenge = await this.createChallenge(hashedUserId, alert);
        
        return {
          success: false,
          anomalyDetected: true,
          score: anomalyScore,
          reason: alert.reason,
          challenge: challenge,
          message: `⚠️ ALERT: ${alert.reason}. Transaction requires verification.`,
          action: 'pause_transaction'
        };
      }
      
      // Record normal transaction
      this.recordTransaction(hashedUserId, features);
      
      return {
        success: true,
        anomalyDetected: false,
        score: anomalyScore,
        message: 'Transaction pattern normal',
        action: 'allow_transaction'
      };
      
    } catch (error) {
      logger.error('Anomaly detection failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  hashUserId(userId) {
    return crypto.createHash('sha256').update(userId).digest('hex').substring(0, 16);
  }

  getUserProfile(hashedUserId) {
    if (!this.userProfiles.has(hashedUserId)) {
      // Create new profile
      this.userProfiles.set(hashedUserId, {
        userId: hashedUserId,
        transactionCount: 0,
        averageAmount: 0,
        maxAmount: 0,
        typicalHours: [],
        typicalTypes: {},
        lastTransaction: null,
        anomalyCount: 0,
        trustScore: 50 // Start neutral
      });
    }
    
    return this.userProfiles.get(hashedUserId);
  }

  extractFeatures(transaction) {
    const hour = new Date(transaction.timestamp).getHours();
    const dayOfWeek = new Date(transaction.timestamp).getDay();
    
    return {
      amount: transaction.amount,
      hour: hour,
      dayOfWeek: dayOfWeek,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isUnusualHour: hour >= this.config.unusualTimeWindow[0] && 
                     hour <= this.config.unusualTimeWindow[1],
      type: transaction.type,
      timestamp: transaction.timestamp,
      // Size relative to max
      sizeRatio: transaction.amount / this.config.maxTransactionSize,
      // Time since last transaction
      timeSinceLast: this.getTimeSinceLastTransaction(transaction.userId)
    };
  }

  calculateAnomalyScore(features, profile) {
    let score = 0;
    let factors = [];
    
    // Check amount anomaly (40% weight)
    if (features.amount > profile.maxAmount * 3) {
      score += 0.4;
      factors.push('amount_3x_max');
    } else if (features.amount > profile.averageAmount * 5) {
      score += 0.3;
      factors.push('amount_5x_avg');
    }
    
    // Check time anomaly (20% weight)
    if (features.isUnusualHour) {
      score += 0.2;
      factors.push('unusual_hour');
    }
    
    // Check frequency anomaly (20% weight)
    if (features.timeSinceLast < 60000) { // Less than 1 minute
      score += 0.2;
      factors.push('rapid_succession');
    }
    
    // Check type anomaly (10% weight)
    if (profile.typicalTypes[features.type] === undefined ||
        profile.typicalTypes[features.type] < 2) {
      score += 0.1;
      factors.push('unusual_type');
    }
    
    // Trust score adjustment (10% weight)
    const trustAdjustment = (50 - profile.trustScore) / 500;
    score += trustAdjustment;
    
    // Apply isolation forest (simplified)
    const isolationScore = this.runIsolationForest(features);
    score = score * 0.7 + isolationScore * 0.3;
    
    logger.debug(`Anomaly score: ${score.toFixed(3)}, factors: ${factors.join(', ')}`);
    
    return Math.min(1, Math.max(0, score));
  }

  runIsolationForest(features) {
    // Simplified isolation forest simulation
    // In production, use actual ML library
    
    const featureVector = [
      features.amount / 1000,
      features.hour / 24,
      features.isWeekend ? 1 : 0,
      features.sizeRatio,
      features.timeSinceLast / 3600000 // Convert to hours
    ];
    
    // Simulate path length in isolation trees
    let totalPathLength = 0;
    for (let i = 0; i < 10; i++) { // Simplified: only 10 trees
      const pathLength = this.simulateIsolationPath(featureVector);
      totalPathLength += pathLength;
    }
    
    const avgPathLength = totalPathLength / 10;
    const expectedPathLength = Math.log2(this.isolationForest.sampleSize);
    
    // Convert to anomaly score (shorter path = more anomalous)
    const score = Math.pow(2, -avgPathLength / expectedPathLength);
    
    return score;
  }

  simulateIsolationPath(features) {
    // Simulate isolation tree path
    let depth = 0;
    let samples = this.isolationForest.sampleSize;
    
    while (samples > 1 && depth < 10) {
      // Random split
      const splitFeature = Math.floor(Math.random() * features.length);
      const splitValue = Math.random();
      
      if (features[splitFeature] < splitValue) {
        samples = Math.floor(samples * 0.6);
      } else {
        samples = Math.floor(samples * 0.4);
      }
      
      depth++;
    }
    
    return depth;
  }

  getAnomalyReason(features, profile) {
    const reasons = [];
    
    if (features.amount > profile.maxAmount * 3) {
      reasons.push(`Transaction ${(features.amount / profile.maxAmount).toFixed(1)}x larger than maximum`);
    }
    
    if (features.isUnusualHour) {
      reasons.push(`Unusual transaction time (${features.hour}:00)`);
    }
    
    if (features.timeSinceLast < 60000) {
      reasons.push('Rapid succession transactions');
    }
    
    if (profile.anomalyCount > 3) {
      reasons.push(`User has ${profile.anomalyCount} recent anomalies`);
    }
    
    return reasons.length > 0 ? reasons.join('. ') : 'Unusual pattern detected';
  }

  async createAlert(alertData) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...alertData,
      status: 'pending',
      reviewed: false
    };
    
    this.alerts.push(alert);
    
    // Send to contract
    if (this.midnight.isConnected()) {
      await this.midnight.sendTransaction(
        'watchdog',
        'createAlert',
        [
          alertData.userId,
          alertData.anomalyScore * 100, // Convert to percentage
          alertData.reason
        ]
      );
    }
    
    logger.warn(`Alert created: ${alert.id} - ${alert.reason}`);
    
    return alert;
  }

  async createChallenge(userId, alert) {
    const challenge = {
      id: `challenge_${Date.now()}`,
      userId: userId,
      alertId: alert.id,
      type: 'two_factor',
      question: 'Please confirm this transaction via 2FA or admin approval',
      requiredApprovals: alert.anomalyScore > 0.9 ? 3 : 2,
      approvals: [],
      status: 'pending',
      expiresAt: Date.now() + 600000 // 10 minutes
    };
    
    // Store challenge (in production, use proper storage)
    this.challenges = this.challenges || new Map();
    this.challenges.set(challenge.id, challenge);
    
    return challenge;
  }

  async verifyChallenge(challengeId, response) {
    const challenge = this.challenges?.get(challengeId);
    
    if (!challenge) {
      return { success: false, error: 'Challenge not found' };
    }
    
    if (Date.now() > challenge.expiresAt) {
      return { success: false, error: 'Challenge expired' };
    }
    
    // Verify response (simplified)
    if (response.type === 'admin_approval' && response.adminId) {
      challenge.approvals.push({
        adminId: response.adminId,
        timestamp: Date.now()
      });
      
      if (challenge.approvals.length >= challenge.requiredApprovals) {
        challenge.status = 'approved';
        return { success: true, message: 'Transaction approved' };
      } else {
        return { 
          success: false, 
          message: `${challenge.requiredApprovals - challenge.approvals.length} more approvals needed` 
        };
      }
    }
    
    return { success: false, error: 'Invalid challenge response' };
  }

  updateProfile(userId, features, anomalyScore) {
    const profile = this.userProfiles.get(userId);
    
    if (!profile) return;
    
    // Update statistics
    profile.transactionCount++;
    profile.averageAmount = (profile.averageAmount * (profile.transactionCount - 1) + features.amount) / profile.transactionCount;
    profile.maxAmount = Math.max(profile.maxAmount, features.amount);
    profile.lastTransaction = features.timestamp;
    
    // Update typical hours
    if (!profile.typicalHours.includes(features.hour)) {
      profile.typicalHours.push(features.hour);
    }
    
    // Update typical types
    profile.typicalTypes[features.type] = (profile.typicalTypes[features.type] || 0) + 1;
    
    // Update trust score
    if (anomalyScore > this.config.alertThreshold) {
      profile.anomalyCount++;
      profile.trustScore = Math.max(0, profile.trustScore - 5);
    } else {
      profile.trustScore = Math.min(100, profile.trustScore + 1);
    }
    
    this.userProfiles.set(userId, profile);
  }

  recordTransaction(userId, features) {
    this.transactionHistory.push({
      userId: userId,
      features: features,
      timestamp: Date.now()
    });
    
    // Keep only last 1000 transactions
    if (this.transactionHistory.length > 1000) {
      this.transactionHistory.shift();
    }
  }

  getTimeSinceLastTransaction(userId) {
    const profile = this.userProfiles.get(userId);
    
    if (!profile || !profile.lastTransaction) {
      return Infinity;
    }
    
    return Date.now() - profile.lastTransaction;
  }

  getAlerts(status = 'pending') {
    return this.alerts.filter(a => a.status === status);
  }

  getStats() {
    return {
      totalProfiles: this.userProfiles.size,
      totalAlerts: this.alerts.length,
      pendingAlerts: this.alerts.filter(a => a.status === 'pending').length,
      averageTrustScore: Array.from(this.userProfiles.values())
        .reduce((sum, p) => sum + p.trustScore, 0) / this.userProfiles.size || 0
    };
  }
}
