// Treasury Watchdog Service
// Implements behavioral anomaly detection for safety from nefarious actions

import EventEmitter from 'events';
// import IsolationForest from 'isolation-forest'; // Disabled for demo
import { logger } from '../utils/logger.js';

export class WatchdogService extends EventEmitter {
  constructor(midnightService) {
    super();
    this.midnight = midnightService;
    this.active = false;
    this.behaviorProfiles = new Map();
    this.activeAlerts = [];
    this.anomalyDetector = null;
    this.alertThreshold = 75;
    this.freezeThreshold = 90;
  }

  async initialize() {
    try {
      // Initialize anomaly detection model (disabled for demo)
      // this.anomalyDetector = new IsolationForest({
      //   numTrees: 100,
      //   sampleSize: 256,
      //   dimensions: 6 // transaction size, time, frequency, etc.
      // });
      
      // Use simple mock anomaly detector for demo
      this.anomalyDetector = {
        fit: (data) => logger.debug('Mock fit called'),
        train: (data) => logger.debug('Mock train called with', data.length, 'samples'),
        predict: (data) => Math.random() > 0.95 ? 1 : 0, // 5% anomaly rate
        score: (data) => Math.random() * 100
      };

      // Load existing profiles from contract
      await this.loadProfiles();
      
      // Train initial model if we have data
      if (this.behaviorProfiles.size > 0) {
        await this.trainModel();
      }

      this.active = true;
      logger.info('Watchdog service initialized');
    } catch (error) {
      logger.error('Failed to initialize watchdog:', error);
      throw error;
    }
  }

  async loadProfiles() {
    try {
      // In production, load from contract state
      // For now, initialize with mock data
      this.initializeMockProfiles();
    } catch (error) {
      logger.error('Failed to load profiles:', error);
    }
  }

  initializeMockProfiles() {
    // Create mock behavior profiles for testing
    const mockUsers = [
      {
        userId: '0xuser1',
        avgTransactionSize: 1000,
        typicalActiveHours: 0b11110000, // Active 12pm-12am
        transactionCount: 150,
        riskScore: 15
      },
      {
        userId: '0xuser2',
        avgTransactionSize: 5000,
        typicalActiveHours: 0b00001111, // Active 12am-12pm
        transactionCount: 75,
        riskScore: 25
      },
      {
        userId: '0xadmin1',
        avgTransactionSize: 10000,
        typicalActiveHours: 0b11111111, // Active all hours
        transactionCount: 500,
        riskScore: 10,
        isAdmin: true
      }
    ];

    mockUsers.forEach(user => {
      this.behaviorProfiles.set(user.userId, user);
    });
  }

  async recordTransaction(userId, amount, timestamp) {
    try {
      // Get or create profile
      let profile = this.behaviorProfiles.get(userId) || this.createNewProfile(userId);
      
      // Calculate anomaly score
      const anomalyScore = await this.calculateAnomalyScore(profile, amount, timestamp);
      
      // Update profile
      profile = this.updateProfile(profile, amount, timestamp, anomalyScore);
      this.behaviorProfiles.set(userId, profile);
      
      // Check if alert needed
      if (anomalyScore >= this.alertThreshold) {
        await this.createAlert(userId, anomalyScore, amount, timestamp);
      }
      
      // Check if freeze needed
      if (anomalyScore >= this.freezeThreshold) {
        await this.freezeAccount(userId);
      }
      
      // Send to contract if connected
      if (this.midnight.isConnected()) {
        await this.midnight.sendTransaction('watchdog', 'recordTransaction', [
          amount,
          timestamp
        ]);
      }
      
      return anomalyScore;
    } catch (error) {
      logger.error('Failed to record transaction:', error);
      throw error;
    }
  }

  async calculateAnomalyScore(profile, amount, timestamp) {
    let score = 0;
    
    // Size anomaly
    if (profile.avgTransactionSize > 0) {
      const deviation = Math.abs(amount - profile.avgTransactionSize) / profile.avgTransactionSize;
      if (deviation > 2) {
        score += 30 * Math.min(deviation / 2, 2); // Cap at 60 points
      }
    }
    
    // Time anomaly
    const hour = new Date(timestamp).getHours();
    const hourBlock = Math.floor(hour / 3);
    const hourMask = 1 << hourBlock;
    if ((profile.typicalActiveHours & hourMask) === 0 && profile.transactionCount > 10) {
      score += 20; // Unusual time
    }
    
    // Frequency anomaly
    if (profile.lastActivity) {
      const timeDiff = timestamp - profile.lastActivity;
      if (timeDiff < 60000 && profile.transactionCount > 5) { // Less than 1 minute
        score += 25; // Rapid transactions
      }
    }
    
    // Use ML model if trained
    if (this.anomalyDetector && profile.transactionCount > 10) {
      const features = this.extractFeatures(profile, amount, timestamp);
      const mlScore = await this.anomalyDetector.score(features);
      score = score * 0.6 + mlScore * 40; // Blend rule-based and ML scores
    }
    
    return Math.min(Math.round(score), 100);
  }

  extractFeatures(profile, amount, timestamp) {
    // Extract features for ML model
    const hour = new Date(timestamp).getHours();
    const dayOfWeek = new Date(timestamp).getDay();
    const amountRatio = profile.avgTransactionSize > 0 ? 
      amount / profile.avgTransactionSize : 1;
    const timeSinceLast = profile.lastActivity ? 
      (timestamp - profile.lastActivity) / 1000 : 3600;
    
    return [
      amountRatio,           // Transaction size ratio
      hour / 24,            // Normalized hour
      dayOfWeek / 7,        // Normalized day
      Math.log(timeSinceLast + 1) / 10, // Log time since last
      profile.transactionCount / 1000,   // Transaction history
      profile.riskScore / 100            // Current risk level
    ];
  }

  createNewProfile(userId) {
    return {
      userId: userId,
      avgTransactionSize: 0,
      typicalActiveHours: 0,
      transactionCount: 0,
      lastActivity: null,
      riskScore: 0,
      isAdmin: false
    };
  }

  updateProfile(profile, amount, timestamp, anomalyScore) {
    const hour = new Date(timestamp).getHours();
    const hourBlock = Math.floor(hour / 3);
    const hourMask = 1 << hourBlock;
    
    // Update moving average
    profile.avgTransactionSize = profile.transactionCount === 0 ?
      amount :
      (profile.avgTransactionSize * profile.transactionCount + amount) / (profile.transactionCount + 1);
    
    // Update typical hours
    profile.typicalActiveHours |= hourMask;
    
    // Update counters
    profile.transactionCount++;
    profile.lastActivity = timestamp;
    profile.riskScore = anomalyScore;
    
    return profile;
  }

  async createAlert(userId, score, amount, timestamp) {
    const alert = {
      id: `alert_${Date.now()}_${userId}`,
      userId: userId,
      score: score,
      amount: amount,
      timestamp: timestamp,
      type: this.determineAlertType(score),
      severity: this.determineSeverity(score),
      details: `Anomaly detected with score ${score}`,
      status: 'active'
    };
    
    this.activeAlerts.push(alert);
    
    // Emit alert event
    this.emit('alert', alert);
    
    // Log critical alerts
    if (alert.severity === 'critical') {
      logger.error(`CRITICAL ALERT: ${alert.details} for user ${userId}`);
    }
    
    return alert;
  }

  determineAlertType(score) {
    if (score >= 80) return 'suspicious_admin_action';
    if (score >= 60) return 'rapid_transactions';
    if (score >= 40) return 'unusual_timing';
    return 'unusual_amount';
  }

  determineSeverity(score) {
    if (score >= 90) return 'critical';
    if (score >= 75) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  async freezeAccount(userId) {
    try {
      logger.warn(`Freezing account ${userId} due to high anomaly score`);
      
      // Send freeze transaction to contract
      if (this.midnight.isConnected()) {
        await this.midnight.sendTransaction('watchdog', 'freezeAccount', [userId]);
      }
      
      // Emit freeze event
      this.emit('accountFrozen', { userId, timestamp: Date.now() });
      
      return true;
    } catch (error) {
      logger.error('Failed to freeze account:', error);
      throw error;
    }
  }

  async validateAdminAction(adminId, action, targetUser, amount) {
    try {
      const profile = this.behaviorProfiles.get(adminId);
      
      if (!profile || !profile.isAdmin) {
        return { valid: false, reason: 'Not an admin' };
      }
      
      // Check if amount is suspicious
      if (amount > profile.avgTransactionSize * 5) {
        await this.createChallenge(adminId, action, targetUser, amount);
        return { valid: false, reason: 'Amount requires challenge' };
      }
      
      // Check recent activity
      const recentAlerts = this.activeAlerts.filter(
        a => a.userId === adminId && 
        Date.now() - a.timestamp < 3600000 // Last hour
      );
      
      if (recentAlerts.length > 0) {
        return { valid: false, reason: 'Recent suspicious activity' };
      }
      
      return { valid: true };
    } catch (error) {
      logger.error('Failed to validate admin action:', error);
      return { valid: false, reason: 'Validation error' };
    }
  }

  async createChallenge(adminId, action, targetUser, amount) {
    const challenge = {
      id: `challenge_${Date.now()}`,
      adminId: adminId,
      action: action,
      targetUser: targetUser,
      amount: amount,
      requiredApprovals: 2,
      currentApprovals: 0,
      deadline: Date.now() + 3600000, // 1 hour
      status: 'pending'
    };
    
    // Store challenge and notify other admins
    this.emit('challengeCreated', challenge);
    
    if (this.midnight.isConnected()) {
      await this.midnight.sendTransaction('watchdog', 'createChallenge', [
        adminId,
        action,
        targetUser,
        amount
      ]);
    }
    
    return challenge;
  }

  isActive() {
    return this.active;
  }

  async trainModel() {
    try {
      const trainingData = [];
      
      // Prepare training data from profiles
      this.behaviorProfiles.forEach(profile => {
        if (profile.transactionCount > 5) {
          // Generate synthetic normal transactions
          for (let i = 0; i < 10; i++) {
            const features = [
              1.0 + (Math.random() - 0.5) * 0.3,  // Normal amount variation
              Math.random(),                       // Random hour
              Math.random(),                       // Random day
              Math.random() * 5,                   // Normal time gaps
              profile.transactionCount / 1000,
              profile.riskScore / 100
            ];
            trainingData.push(features);
          }
        }
      });
      
      if (trainingData.length > 0) {
        await this.anomalyDetector.train(trainingData);
        logger.info('Anomaly detection model trained');
      }
    } catch (error) {
      logger.error('Failed to train model:', error);
    }
  }

  getActiveAlerts() {
    return this.activeAlerts.filter(a => a.status === 'active');
  }

  getBehaviorProfile(userId) {
    return this.behaviorProfiles.get(userId);
  }

  async dismissAlert(alertId) {
    const alert = this.activeAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'dismissed';
      return true;
    }
    return false;
  }

  async unfreezeAccount(userId) {
    try {
      if (this.midnight.isConnected()) {
        await this.midnight.sendTransaction('watchdog', 'unfreezeAccount', [userId]);
      }
      
      this.emit('accountUnfrozen', { userId, timestamp: Date.now() });
      return true;
    } catch (error) {
      logger.error('Failed to unfreeze account:', error);
      throw error;
    }
  }

  getStats() {
    return {
      totalProfiles: this.behaviorProfiles.size,
      activeAlerts: this.activeAlerts.filter(a => a.status === 'active').length,
      criticalAlerts: this.activeAlerts.filter(a => a.severity === 'critical').length,
      frozenAccounts: Array.from(this.behaviorProfiles.values()).filter(p => p.frozen).length
    };
  }

  getActiveAlerts() {
    return [...this.activeAlerts];
  }
}
