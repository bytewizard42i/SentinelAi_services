// Risk Profiler Service
// Implements personalized allocation based on user risk tolerance

import EventEmitter from 'events';
import { logger } from '../utils/logger.js';

export class ProfilerService extends EventEmitter {
  constructor(midnightService) {
    super();
    this.midnight = midnightService;
    this.active = false;
    
    // User profiles storage
    this.userProfiles = new Map();
    this.allocations = new Map();
    this.profileAlerts = new Map();
    
    // Configuration
    this.maxAgeForHighRisk = 55;
    this.minAgeForInvesting = 18;
    this.suspiciousChangeThreshold = 30;
    
    // Quiz questions
    this.quizQuestions = [
      {
        id: 1,
        category: 'risk_tolerance',
        question: 'How would you react to a 20% drop in your portfolio value?',
        options: [
          'Sell everything immediately',
          'Sell some to reduce losses',
          'Hold and wait for recovery',
          'Buy more at lower prices'
        ],
        weight: 3
      },
      {
        id: 2,
        category: 'risk_tolerance',
        question: 'What percentage of your portfolio would you allocate to high-risk assets?',
        options: ['0-10%', '10-30%', '30-50%', 'More than 50%'],
        weight: 3
      },
      {
        id: 3,
        category: 'risk_tolerance',
        question: 'How often do you check your portfolio?',
        options: ['Multiple times daily', 'Daily', 'Weekly', 'Monthly or less'],
        weight: 2
      },
      {
        id: 4,
        category: 'investment_goals',
        question: 'What is your primary investment goal?',
        options: ['Capital preservation', 'Steady income', 'Long-term growth', 'Maximum returns'],
        weight: 2
      },
      {
        id: 5,
        category: 'investment_goals',
        question: 'When do you plan to use these funds?',
        options: ['Less than 1 year', '1-3 years', '3-10 years', 'More than 10 years'],
        weight: 2
      },
      {
        id: 6,
        category: 'experience',
        question: 'How many years of investment experience do you have?',
        options: ['None', 'Less than 2 years', '2-5 years', 'More than 5 years'],
        weight: 2
      },
      {
        id: 7,
        category: 'experience',
        question: 'Have you invested in cryptocurrencies before?',
        options: ['Never', 'Small amounts', 'Moderate amounts', 'Significant amounts'],
        weight: 1
      },
      {
        id: 8,
        category: 'time_horizon',
        question: 'What is your investment time horizon?',
        options: ['Less than 1 year', '1-3 years', '3-10 years', 'More than 10 years'],
        weight: 5
      }
    ];
  }

  async initialize() {
    try {
      // Load existing profiles from contract if available
      if (this.midnight.isConnected()) {
        await this.loadProfiles();
      }
      
      // Initialize with some default profiles for testing
      this.initializeMockProfiles();
      
      this.active = true;
      logger.info('Profiler service initialized');
    } catch (error) {
      logger.error('Failed to initialize profiler:', error);
      throw error;
    }
  }

  async loadProfiles() {
    try {
      // In production, would load from contract state
      logger.info('Loading user profiles from contract...');
    } catch (error) {
      logger.warn('Failed to load profiles from contract:', error);
    }
  }

  initializeMockProfiles() {
    // Create mock profiles for testing
    const mockProfiles = [
      {
        userId: '0xuser1',
        age: 35,
        riskTolerance: 6,
        investmentGoals: 3, // Growth
        experienceLevel: 2, // Intermediate
        timeHorizon: 10,
        profileScore: 60
      },
      {
        userId: '0xuser2',
        age: 55,
        riskTolerance: 3,
        investmentGoals: 1, // Preservation
        experienceLevel: 3, // Advanced
        timeHorizon: 5,
        profileScore: 30
      },
      {
        userId: '0xuser3',
        age: 25,
        riskTolerance: 8,
        investmentGoals: 4, // Speculation
        experienceLevel: 1, // Novice
        timeHorizon: 15,
        profileScore: 75
      }
    ];

    mockProfiles.forEach(profile => {
      this.userProfiles.set(profile.userId, {
        ...profile,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        isLocked: false
      });
      
      // Generate allocation for each profile
      const allocation = this.generateAllocation(profile);
      this.allocations.set(profile.userId, allocation);
    });
  }

  async createProfile(userId, age, quizResponses) {
    try {
      // Check if profile already exists
      if (this.userProfiles.has(userId)) {
        throw new Error('Profile already exists');
      }
      
      // Validate age
      if (age < this.minAgeForInvesting) {
        throw new Error(`Below minimum age of ${this.minAgeForInvesting}`);
      }
      
      // Calculate scores from quiz responses
      const scores = this.calculateProfileScores(quizResponses, age);
      
      // Check for suspicious profile
      if (this.isSuspiciousProfile(age, scores.riskTolerance)) {
        await this.createProfileAlert(userId, age, scores.riskTolerance, 'suspicious_profile');
      }
      
      // Create profile
      const profile = {
        userId: userId,
        age: age,
        riskTolerance: scores.riskTolerance,
        investmentGoals: scores.goals,
        experienceLevel: scores.experience,
        timeHorizon: scores.timeHorizon,
        profileScore: scores.composite,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        isLocked: false
      };
      
      this.userProfiles.set(userId, profile);
      
      // Generate allocation recommendation
      const allocation = this.generateAllocation(profile);
      this.allocations.set(userId, allocation);
      
      // Send to contract if connected
      if (this.midnight.isConnected()) {
        await this.midnight.sendTransaction('profiler', 'createProfile', [
          age,
          quizResponses
        ]);
      }
      
      // Emit profile created event
      this.emit('profileCreated', { profile, allocation });
      
      logger.info(`Profile created for user ${userId}`);
      return { profile, allocation };
    } catch (error) {
      logger.error('Failed to create profile:', error);
      throw error;
    }
  }

  calculateProfileScores(responses, age) {
    let riskScore = 0;
    let goalsScore = 0;
    let experienceScore = 0;
    let timeScore = 0;
    
    // Process each response
    responses.forEach((answer, questionId) => {
      const question = this.quizQuestions.find(q => q.id === questionId);
      if (!question) return;
      
      const answerValue = parseInt(answer) + 1; // Convert 0-based to 1-based
      const weightedValue = answerValue * question.weight;
      
      switch (question.category) {
        case 'risk_tolerance':
          riskScore += weightedValue;
          break;
        case 'investment_goals':
          goalsScore += weightedValue;
          break;
        case 'experience':
          experienceScore += weightedValue;
          break;
        case 'time_horizon':
          timeScore += weightedValue;
          break;
      }
    });
    
    // Apply age multiplier
    const ageMultiplier = this.calculateAgeMultiplier(age);
    riskScore = Math.round(riskScore * ageMultiplier / 100);
    
    // Normalize scores
    const riskTolerance = Math.min(10, Math.max(1, Math.round(riskScore / 7)));
    const goals = Math.min(4, Math.max(1, Math.round(goalsScore / 4)));
    const experience = Math.min(4, Math.max(1, Math.round(experienceScore / 3)));
    const timeHorizon = Math.min(30, Math.max(1, timeScore));
    
    // Calculate composite score (0-100)
    const composite = Math.round(
      riskTolerance * 4 +
      goals * 2 +
      experience * 2 +
      Math.min(timeHorizon, 10) * 2
    );
    
    return {
      riskTolerance,
      goals,
      experience,
      timeHorizon,
      composite
    };
  }

  calculateAgeMultiplier(age) {
    if (age < 30) return 100;
    if (age < 40) return 90;
    if (age < 50) return 75;
    if (age < 60) return 60;
    return 40;
  }

  generateAllocation(profile) {
    let stablecoin, majorAssets, growthAssets, maxDrawdown, rebalanceFreq;
    
    // Base allocation on composite score
    if (profile.profileScore < 30) {
      // Conservative
      stablecoin = 60;
      majorAssets = 30;
      growthAssets = 10;
      maxDrawdown = 15;
      rebalanceFreq = 30; // Monthly
    } else if (profile.profileScore < 60) {
      // Balanced
      stablecoin = 30;
      majorAssets = 50;
      growthAssets = 20;
      maxDrawdown = 25;
      rebalanceFreq = 14; // Bi-weekly
    } else if (profile.profileScore < 80) {
      // Growth
      stablecoin = 15;
      majorAssets = 55;
      growthAssets = 30;
      maxDrawdown = 35;
      rebalanceFreq = 7; // Weekly
    } else {
      // Aggressive
      stablecoin = 10;
      majorAssets = 40;
      growthAssets = 50;
      maxDrawdown = 50;
      rebalanceFreq = 3; // Bi-daily
    }
    
    // Age adjustments
    if (profile.age > 60) {
      stablecoin = Math.min(100, stablecoin + 20);
      growthAssets = Math.max(0, growthAssets - 20);
    } else if (profile.age > 50) {
      stablecoin = Math.min(100, stablecoin + 10);
      growthAssets = Math.max(0, growthAssets - 10);
    }
    
    // Time horizon adjustments
    if (profile.timeHorizon < 2) {
      stablecoin = Math.min(100, stablecoin + 30);
      growthAssets = Math.max(0, growthAssets - 20);
      majorAssets = Math.max(0, majorAssets - 10);
    }
    
    // Normalize allocations to sum to 100
    const total = stablecoin + majorAssets + growthAssets;
    if (total !== 100) {
      const ratio = 100 / total;
      stablecoin = Math.round(stablecoin * ratio);
      majorAssets = Math.round(majorAssets * ratio);
      growthAssets = 100 - stablecoin - majorAssets;
    }
    
    return {
      stablecoinPercent: stablecoin,
      majorAssetsPercent: majorAssets,
      growthAssetsPercent: growthAssets,
      maxDrawdownTolerance: maxDrawdown,
      rebalanceFrequency: rebalanceFreq,
      generatedAt: Date.now()
    };
  }

  isSuspiciousProfile(age, riskTolerance) {
    // Elderly with very high risk tolerance
    if (age > this.maxAgeForHighRisk && riskTolerance > 8) {
      return true;
    }
    
    // Very young with maximum risk
    if (age < 25 && riskTolerance === 10) {
      return true;
    }
    
    return false;
  }

  async updateProfile(userId, updates) {
    try {
      const profile = this.userProfiles.get(userId);
      if (!profile) {
        throw new Error('Profile not found');
      }
      
      if (profile.isLocked) {
        throw new Error('Profile is locked');
      }
      
      const previousScore = profile.profileScore;
      
      // Update profile fields
      const updatedProfile = {
        ...profile,
        ...updates,
        lastUpdated: Date.now()
      };
      
      // Recalculate composite score
      updatedProfile.profileScore = Math.round(
        updatedProfile.riskTolerance * 4 +
        updatedProfile.investmentGoals * 2 +
        updatedProfile.experienceLevel * 2 +
        Math.min(updatedProfile.timeHorizon, 10) * 2
      );
      
      // Check for suspicious changes
      const scoreDiff = Math.abs(updatedProfile.profileScore - previousScore);
      if (scoreDiff > this.suspiciousChangeThreshold) {
        await this.createProfileAlert(
          userId,
          updatedProfile.age,
          updatedProfile.riskTolerance,
          'suspicious_change'
        );
      }
      
      this.userProfiles.set(userId, updatedProfile);
      
      // Update allocation
      const newAllocation = this.generateAllocation(updatedProfile);
      this.allocations.set(userId, newAllocation);
      
      // Update contract if connected
      if (this.midnight.isConnected()) {
        await this.midnight.sendTransaction('profiler', 'updateProfile', [
          updatedProfile.riskTolerance,
          updatedProfile.investmentGoals
        ]);
      }
      
      // Emit update event
      this.emit('profileUpdated', { profile: updatedProfile, allocation: newAllocation });
      
      logger.info(`Profile updated for user ${userId}`);
      return { profile: updatedProfile, allocation: newAllocation };
    } catch (error) {
      logger.error('Failed to update profile:', error);
      throw error;
    }
  }

  async createProfileAlert(userId, age, riskTolerance, type) {
    const alert = {
      id: `profile_alert_${Date.now()}`,
      userId: userId,
      age: age,
      riskTolerance: riskTolerance,
      alertType: type,
      timestamp: Date.now(),
      requiresReview: true,
      reviewed: false
    };
    
    this.profileAlerts.set(alert.id, alert);
    
    // Emit alert event
    this.emit('profileAlert', alert);
    
    logger.warn(`Profile alert created: ${type} for user ${userId}`);
    return alert;
  }

  getUserProfile(userId) {
    return this.userProfiles.get(userId);
  }

  getUserAllocation(userId) {
    return this.allocations.get(userId);
  }

  async verifyRiskCompliance(userId, requiredMaxRisk) {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      return false;
    }
    
    return profile.riskTolerance <= requiredMaxRisk;
  }

  async lockProfile(userId, lock = true) {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      throw new Error('Profile not found');
    }
    
    profile.isLocked = lock;
    this.userProfiles.set(userId, profile);
    
    logger.info(`Profile ${userId} ${lock ? 'locked' : 'unlocked'}`);
    return profile;
  }

  isActive() {
    return this.active;
  }

  getProfileAlerts(reviewed = false) {
    const alerts = [];
    this.profileAlerts.forEach(alert => {
      if (alert.reviewed === reviewed) {
        alerts.push(alert);
      }
    });
    return alerts;
  }

  async reviewAlert(alertId) {
    const alert = this.profileAlerts.get(alertId);
    if (alert) {
      alert.reviewed = true;
      alert.reviewedAt = Date.now();
      return true;
    }
    return false;
  }

  isActive() {
    return this.active;
  }

  getStats() {
    const profiles = Array.from(this.userProfiles.values());
    
    return {
      totalProfiles: profiles.length,
      conservativeProfiles: profiles.filter(p => p.profileScore < 30).length,
      balancedProfiles: profiles.filter(p => p.profileScore >= 30 && p.profileScore < 60).length,
      growthProfiles: profiles.filter(p => p.profileScore >= 60 && p.profileScore < 80).length,
      aggressiveProfiles: profiles.filter(p => p.profileScore >= 80).length,
      lockedProfiles: profiles.filter(p => p.isLocked).length,
      unreviewedAlerts: Array.from(this.profileAlerts.values()).filter(a => !a.reviewed).length
    };
  }

  getQuizQuestions() {
    return this.quizQuestions;
  }

  async simulateAllocation(age, riskTolerance, goals, timeHorizon) {
    const mockProfile = {
      age: age,
      riskTolerance: riskTolerance,
      investmentGoals: goals,
      experienceLevel: 2, // Default intermediate
      timeHorizon: timeHorizon,
      profileScore: Math.round(
        riskTolerance * 4 +
        goals * 2 +
        2 * 2 +
        Math.min(timeHorizon, 10) * 2
      )
    };
    
    return this.generateAllocation(mockProfile);
  }
}
