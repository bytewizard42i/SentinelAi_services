// Market Guardian Service
// Implements automated risk rebalancing for fund safety

import EventEmitter from 'events';
import { logger } from '../utils/logger.js';

export class GuardianService extends EventEmitter {
  constructor(midnightService) {
    super();
    this.midnight = midnightService;
    this.active = false;
    
    // Treasury state
    this.treasuryAllocation = {
      totalValue: 1000000, // $1M USD starting
      stablecoinPercent: 30,
      riskAssetPercent: 70,
      lastRebalance: Date.now(),
      rebalanceCount: 0
    };
    
    // Market data
    this.marketData = new Map();
    this.watchedAssets = new Set(['BTC', 'ETH', 'SOL']);
    this.assetWeights = new Map([
      ['BTC', 40],
      ['ETH', 30],
      ['SOL', 30]
    ]);
    
    // Risk settings
    this.riskSettings = {
      riskAppetite: 2, // 1=conservative, 2=balanced, 3=aggressive
      minStablecoin: 20,
      maxStablecoin: 70,
      rebalanceCooldown: 1800000, // 30 minutes
      circuitBreakerEnabled: true
    };
    
    // Rebalance tiers
    this.rebalanceTiers = [
      { threshold: -60, stablecoinTarget: 80, speed: 3 }, // Severe downturn
      { threshold: -40, stablecoinTarget: 60, speed: 2 }, // Moderate downturn
      { threshold: -20, stablecoinTarget: 40, speed: 1 }, // Mild downturn
      { threshold: 40, stablecoinTarget: 20, speed: 1 }   // Bull market
    ];
    
    this.rebalanceHistory = [];
  }

  async initialize() {
    try {
      // Load initial configuration from contract if available
      if (this.midnight.isConnected()) {
        await this.loadContractState();
      }
      
      // Initialize with default market data
      this.initializeMarketData();
      
      this.active = true;
      logger.info('Guardian service initialized');
    } catch (error) {
      logger.error('Failed to initialize guardian:', error);
      throw error;
    }
  }

  async loadContractState() {
    try {
      const allocation = await this.midnight.callContract('guardian', 'getAllocation');
      if (allocation) {
        this.treasuryAllocation = {
          ...this.treasuryAllocation,
          ...allocation
        };
      }
    } catch (error) {
      logger.warn('Failed to load contract state, using defaults:', error);
    }
  }

  initializeMarketData() {
    // Initialize with mock market data
    const mockData = [
      {
        asset: 'BTC',
        price: 45000,
        volume24h: 25000000000,
        volatility: 35,
        trend: 15
      },
      {
        asset: 'ETH',
        price: 2800,
        volume24h: 12000000000,
        volatility: 40,
        trend: 20
      },
      {
        asset: 'SOL',
        price: 120,
        volume24h: 2000000000,
        volatility: 55,
        trend: -10
      }
    ];

    mockData.forEach(data => {
      this.marketData.set(data.asset, {
        priceUSD: data.price * 100, // Convert to cents
        volume24h: data.volume24h,
        volatilityIndex: data.volatility,
        trendDirection: data.trend,
        lastUpdate: Date.now(),
        confidence: this.calculateConfidence(data.volume24h, data.volatility)
      });
    });
  }

  async updateMarketData(asset, price, volume, volatility, trend) {
    try {
      const data = {
        priceUSD: Math.round(price * 100), // Convert to cents
        volume24h: volume,
        volatilityIndex: volatility,
        trendDirection: trend,
        lastUpdate: Date.now(),
        confidence: this.calculateConfidence(volume, volatility)
      };
      
      this.marketData.set(asset, data);
      
      // Check if rebalancing needed
      if (this.shouldRebalance()) {
        await this.triggerRebalance();
      }
      
      // Update contract if connected
      if (this.midnight.isConnected()) {
        await this.midnight.sendTransaction('guardian', 'updateMarketData', [
          asset,
          data.priceUSD,
          data.volume24h,
          data.volatilityIndex,
          data.trendDirection
        ]);
      }
      
      // Emit market update event
      this.emit('marketUpdate', { asset, data });
      
      return data;
    } catch (error) {
      logger.error('Failed to update market data:', error);
      throw error;
    }
  }

  calculateConfidence(volume, volatility) {
    let confidence = 50; // Base confidence
    
    // Higher volume increases confidence
    if (volume > 1000000000) { // > $1B
      confidence += 25;
    } else if (volume > 100000000) { // > $100M
      confidence += 15;
    }
    
    // Lower volatility increases confidence
    if (volatility < 30) {
      confidence += 25;
    } else if (volatility < 50) {
      confidence += 10;
    }
    
    return Math.min(confidence, 100);
  }

  shouldRebalance() {
    const now = Date.now();
    
    // Check cooldown
    if (now - this.treasuryAllocation.lastRebalance < this.riskSettings.rebalanceCooldown) {
      return false;
    }
    
    // Calculate composite market score
    const marketScore = this.calculateMarketScore();
    
    // Check circuit breaker
    if (this.riskSettings.circuitBreakerEnabled) {
      const avgVolatility = this.getAverageVolatility();
      const avgConfidence = this.getAverageConfidence();
      
      if (avgVolatility > 90 && avgConfidence < 50) {
        logger.warn('Circuit breaker activated - market too unstable');
        return false;
      }
    }
    
    // Check if any tier threshold is crossed
    for (const tier of this.rebalanceTiers) {
      if (marketScore <= tier.threshold) {
        return true;
      }
    }
    
    return false;
  }

  calculateMarketScore() {
    let totalScore = 0;
    let totalWeight = 0;
    
    this.watchedAssets.forEach(asset => {
      const data = this.marketData.get(asset);
      const weight = this.assetWeights.get(asset) || 0;
      
      if (data && weight > 0) {
        totalScore += data.trendDirection * weight;
        totalWeight += weight;
      }
    });
    
    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  getAverageVolatility() {
    let total = 0;
    let count = 0;
    
    this.marketData.forEach(data => {
      total += data.volatilityIndex;
      count++;
    });
    
    return count > 0 ? total / count : 50;
  }

  getAverageConfidence() {
    let total = 0;
    let count = 0;
    
    this.marketData.forEach(data => {
      total += data.confidence;
      count++;
    });
    
    return count > 0 ? total / count : 50;
  }

  async triggerRebalance() {
    try {
      const marketScore = this.calculateMarketScore();
      const volatility = this.getAverageVolatility();
      
      // Find appropriate tier
      let targetStablecoin = this.treasuryAllocation.stablecoinPercent;
      let executionSpeed = 1;
      
      for (const tier of this.rebalanceTiers) {
        if (marketScore <= tier.threshold) {
          targetStablecoin = tier.stablecoinTarget;
          executionSpeed = tier.speed;
          break;
        }
      }
      
      // Apply risk settings constraints
      targetStablecoin = Math.max(
        this.riskSettings.minStablecoin,
        Math.min(this.riskSettings.maxStablecoin, targetStablecoin)
      );
      
      // Execute rebalancing
      await this.executeRebalance(targetStablecoin, volatility, executionSpeed);
      
    } catch (error) {
      logger.error('Failed to trigger rebalance:', error);
      throw error;
    }
  }

  async executeRebalance(targetStablecoin, volatility, speed) {
    const currentStablecoin = this.treasuryAllocation.stablecoinPercent;
    
    // Calculate step size based on volatility and speed
    let stepSize = 10; // Default 10% steps
    if (volatility > 70) {
      stepSize = 5; // Smaller steps in high volatility
    } else if (volatility < 30) {
      stepSize = 15; // Larger steps in low volatility
    }
    
    // Adjust for execution speed
    stepSize = Math.round(stepSize * (speed / 2));
    
    // Calculate new allocation
    let newStablecoin;
    if (targetStablecoin > currentStablecoin) {
      // Moving to safety (risk-off)
      newStablecoin = Math.min(
        currentStablecoin + stepSize,
        targetStablecoin
      );
    } else {
      // Moving to risk (risk-on)
      newStablecoin = Math.max(
        currentStablecoin - stepSize,
        targetStablecoin
      );
    }
    
    // Update allocation
    const previousAllocation = { ...this.treasuryAllocation };
    this.treasuryAllocation.stablecoinPercent = newStablecoin;
    this.treasuryAllocation.riskAssetPercent = 100 - newStablecoin;
    this.treasuryAllocation.lastRebalance = Date.now();
    this.treasuryAllocation.rebalanceCount++;
    
    // Record in history
    const rebalanceRecord = {
      id: `rebalance_${Date.now()}`,
      timestamp: Date.now(),
      from: previousAllocation,
      to: { ...this.treasuryAllocation },
      marketScore: this.calculateMarketScore(),
      volatility: volatility,
      reason: this.getRebalanceReason(targetStablecoin)
    };
    
    this.rebalanceHistory.push(rebalanceRecord);
    
    // Emit rebalance event
    this.emit('rebalance', rebalanceRecord);
    
    logger.info(`Rebalanced: ${currentStablecoin}% → ${newStablecoin}% stablecoins`);
    
    // Update contract if connected
    if (this.midnight.isConnected()) {
      await this.midnight.sendTransaction('guardian', 'executeRebalance', [
        newStablecoin,
        volatility
      ]);
    }
    
    return rebalanceRecord;
  }

  getRebalanceReason(targetStablecoin) {
    const current = this.treasuryAllocation.stablecoinPercent;
    
    if (targetStablecoin > current + 20) {
      return 'Severe market downturn detected';
    } else if (targetStablecoin > current + 10) {
      return 'Market weakness detected';
    } else if (targetStablecoin < current - 10) {
      return 'Market strength detected';
    } else if (targetStablecoin < current - 20) {
      return 'Strong bull market detected';
    } else {
      return 'Minor market adjustment';
    }
  }

  async updateRiskSettings(riskAppetite, rebalanceCooldown) {
    try {
      // Update risk settings
      this.riskSettings.riskAppetite = riskAppetite;
      this.riskSettings.rebalanceCooldown = rebalanceCooldown;
      
      // Adjust min/max based on risk appetite
      if (riskAppetite === 1) { // Conservative
        this.riskSettings.minStablecoin = 40;
        this.riskSettings.maxStablecoin = 80;
      } else if (riskAppetite === 3) { // Aggressive
        this.riskSettings.minStablecoin = 10;
        this.riskSettings.maxStablecoin = 50;
      } else { // Balanced
        this.riskSettings.minStablecoin = 20;
        this.riskSettings.maxStablecoin = 70;
      }
      
      // Update contract if connected
      if (this.midnight.isConnected()) {
        await this.midnight.sendTransaction('guardian', 'updateRiskSettings', [
          riskAppetite,
          rebalanceCooldown
        ]);
      }
      
      logger.info('Risk settings updated');
      return this.riskSettings;
    } catch (error) {
      logger.error('Failed to update risk settings:', error);
      throw error;
    }
  }

  getCurrentAllocation() {
    return { ...this.treasuryAllocation };
  }

  isActive() {
    return this.active;
  }

  getMarketData(asset) {
    return this.marketData.get(asset);
  }

  getAllMarketData() {
    const data = {};
    this.marketData.forEach((value, key) => {
      data[key] = value;
    });
    return data;
  }

  getRebalanceHistory(limit = 10) {
    return this.rebalanceHistory.slice(-limit);
  }

  async verifyAllocationCompliance(minStable, maxStable) {
    const current = this.treasuryAllocation.stablecoinPercent;
    return current >= minStable && current <= maxStable;
  }

  isActive() {
    return this.active;
  }

  getStats() {
    return {
      allocation: this.treasuryAllocation,
      marketScore: this.calculateMarketScore(),
      volatility: this.getAverageVolatility(),
      confidence: this.getAverageConfidence(),
      rebalanceCount: this.treasuryAllocation.rebalanceCount,
      lastRebalance: this.treasuryAllocation.lastRebalance
    };
  }

  async simulateRebalance(marketConditions) {
    // Simulate rebalancing under given conditions
    const tempMarketScore = marketConditions.trend || this.calculateMarketScore();
    const tempVolatility = marketConditions.volatility || this.getAverageVolatility();
    
    let targetStablecoin = this.treasuryAllocation.stablecoinPercent;
    
    for (const tier of this.rebalanceTiers) {
      if (tempMarketScore <= tier.threshold) {
        targetStablecoin = tier.stablecoinTarget;
        break;
      }
    }
    
    // Apply constraints
    targetStablecoin = Math.max(
      this.riskSettings.minStablecoin,
      Math.min(this.riskSettings.maxStablecoin, targetStablecoin)
    );
    
    return {
      currentAllocation: this.treasuryAllocation.stablecoinPercent,
      recommendedAllocation: targetStablecoin,
      change: targetStablecoin - this.treasuryAllocation.stablecoinPercent,
      reason: this.getRebalanceReason(targetStablecoin)
    };
  }
}
