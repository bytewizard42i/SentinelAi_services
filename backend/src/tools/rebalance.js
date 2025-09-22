// Rebalance Tool - Pillar 1: Market Guardian
// Emotion-free treasury rebalancing based on market trends

import { logger } from '../utils/logger.js';

export class RebalanceTool {
  constructor(midnightService) {
    this.midnight = midnightService;
    this.priceHistory = [];
    this.rebalanceHistory = [];
    this.lastRebalance = null;
    
    // Configuration
    this.config = {
      dipThreshold: -0.05,    // 5% dip triggers rebalance
      recoveryThreshold: 0.03, // 3% recovery to rebalance back
      maxShiftPercent: 0.20,   // Max 20% shift per rebalance
      cooldownMinutes: 15,      // Minimum time between rebalances
      tiers: [
        { trigger: -0.20, stableTarget: 80 }, // Severe: -20% → 80% stables
        { trigger: -0.10, stableTarget: 60 }, // Moderate: -10% → 60% stables
        { trigger: -0.05, stableTarget: 40 }, // Mild: -5% → 40% stables
        { trigger: 0.05, stableTarget: 20 },  // Bull: +5% → 20% stables
      ]
    };
  }

  // MCP Tool Schema
  getSchema() {
    return {
      name: 'rebalance_treasury',
      description: 'Shift allocation to stables on downward trends',
      parameters: {
        asset: { 
          type: 'string', 
          description: 'Asset to monitor (e.g., ETH, BTC)',
          required: true 
        },
        threshold: { 
          type: 'number', 
          description: 'Dip threshold (-0.05 for 5% dip)',
          default: -0.05 
        },
        amount_pct: { 
          type: 'number', 
          description: 'Percentage to shift (0.2 for 20%)',
          default: 0.20 
        },
        auto: {
          type: 'boolean',
          description: 'Enable automatic tiered rebalancing',
          default: true
        }
      }
    };
  }

  async execute(params) {
    const { asset, threshold, amount_pct, auto } = params;
    
    try {
      // Check cooldown
      if (this.isInCooldown()) {
        return {
          success: false,
          message: `Rebalance on cooldown. Wait ${this.getCooldownRemaining()} minutes.`
        };
      }

      // Fetch market data
      const marketData = await this.fetchMarketData(asset);
      const trend = this.calculateTrend(marketData);
      
      // Get current allocation
      const currentAllocation = await this.midnight.callContract(
        'guardian', 
        'getAllocation'
      );

      // Determine target allocation
      let targetAllocation;
      if (auto) {
        targetAllocation = this.getTieredTarget(trend.change);
      } else {
        // Manual rebalance based on threshold
        if (trend.change <= threshold) {
          targetAllocation = {
            stablecoinPercent: Math.min(100, 
              currentAllocation.stablecoinPercent + (amount_pct * 100)
            )
          };
        } else {
          return {
            success: false,
            message: `No rebalance needed. Market change: ${(trend.change * 100).toFixed(2)}%`
          };
        }
      }

      // Calculate shift needed
      const shift = targetAllocation.stablecoinPercent - currentAllocation.stablecoinPercent;
      
      if (Math.abs(shift) < 5) {
        return {
          success: false,
          message: `Minimal shift needed (${shift}%). Skipping rebalance.`
        };
      }

      // Execute rebalance
      const result = await this.executeRebalance(
        currentAllocation,
        targetAllocation,
        trend
      );

      // Record rebalance
      this.recordRebalance({
        timestamp: Date.now(),
        asset: asset,
        marketChange: trend.change,
        from: currentAllocation,
        to: targetAllocation,
        txHash: result.txHash
      });

      return {
        success: true,
        message: `Rebalanced: ${currentAllocation.stablecoinPercent}% → ${targetAllocation.stablecoinPercent}% stables`,
        trend: trend,
        allocation: targetAllocation,
        txHash: result.txHash,
        projectedRecovery: this.predictRecovery(trend)
      };

    } catch (error) {
      logger.error('Rebalance failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async fetchMarketData(asset) {
    // Mock market data for demo
    // In production, integrate with Chainlink or other oracle
    const mockPrices = {
      'ETH': [2500, 2480, 2450, 2400, 2380, 2350], // Simulating dip
      'BTC': [45000, 44800, 44500, 44200, 44000, 43500]
    };

    const prices = mockPrices[asset] || mockPrices['ETH'];
    
    // Add some randomness for demo
    const latestPrice = prices[prices.length - 1] * (0.95 + Math.random() * 0.1);
    
    return {
      asset: asset,
      prices: [...prices, latestPrice],
      timestamp: Date.now(),
      volume: 1000000 + Math.random() * 500000
    };
  }

  calculateTrend(marketData) {
    const prices = marketData.prices;
    const current = prices[prices.length - 1];
    const previous = prices[0];
    
    const change = (current - previous) / previous;
    const volatility = this.calculateVolatility(prices);
    
    // Simple moving average
    const sma = prices.reduce((a, b) => a + b, 0) / prices.length;
    
    return {
      current: current,
      change: change,
      changePercent: (change * 100).toFixed(2) + '%',
      volatility: volatility,
      sma: sma,
      trend: change < -0.05 ? 'bearish' : change > 0.05 ? 'bullish' : 'neutral',
      confidence: Math.max(0.5, 1 - volatility) // Higher volatility = lower confidence
    };
  }

  calculateVolatility(prices) {
    if (prices.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  getTieredTarget(changePercent) {
    // Find appropriate tier based on market change
    for (const tier of this.config.tiers) {
      if (changePercent <= tier.trigger) {
        return { stablecoinPercent: tier.stableTarget };
      }
    }
    
    // Default conservative allocation
    return { stablecoinPercent: 30 };
  }

  async executeRebalance(from, to, trend) {
    logger.info(`Executing rebalance: ${from.stablecoinPercent}% → ${to.stablecoinPercent}% stables`);
    
    // Calculate amounts to shift
    const treasuryValue = 1000000; // Mock treasury value
    const shiftAmount = Math.abs(to.stablecoinPercent - from.stablecoinPercent) * treasuryValue / 100;
    
    // Simulate transaction
    const tx = await this.midnight.sendTransaction(
      'guardian',
      'executeRebalance',
      [
        to.stablecoinPercent,
        trend.volatility * 100, // Pass volatility as percentage
        trend.confidence * 100
      ]
    );
    
    this.lastRebalance = Date.now();
    
    return {
      txHash: tx.hash || '0x' + Math.random().toString(16).substr(2, 64),
      shiftAmount: shiftAmount,
      gasUsed: 150000
    };
  }

  predictRecovery(trend) {
    // Simple prediction based on trend and volatility
    const baseHours = 4;
    const volatilityFactor = trend.volatility * 10;
    const trendFactor = trend.trend === 'bearish' ? 2 : 1;
    
    const estimatedHours = baseHours * trendFactor + volatilityFactor;
    
    return {
      hours: Math.round(estimatedHours),
      confidence: trend.confidence,
      message: `Projected recovery in ${Math.round(estimatedHours)} hours (${(trend.confidence * 100).toFixed(0)}% confidence)`
    };
  }

  isInCooldown() {
    if (!this.lastRebalance) return false;
    
    const elapsed = (Date.now() - this.lastRebalance) / 1000 / 60; // minutes
    return elapsed < this.config.cooldownMinutes;
  }

  getCooldownRemaining() {
    if (!this.lastRebalance) return 0;
    
    const elapsed = (Date.now() - this.lastRebalance) / 1000 / 60;
    return Math.max(0, Math.ceil(this.config.cooldownMinutes - elapsed));
  }

  recordRebalance(data) {
    this.rebalanceHistory.push(data);
    
    // Keep only last 100 rebalances
    if (this.rebalanceHistory.length > 100) {
      this.rebalanceHistory.shift();
    }
    
    logger.info(`Rebalance recorded: ${data.from.stablecoinPercent}% → ${data.to.stablecoinPercent}%`);
  }

  getHistory(limit = 10) {
    return this.rebalanceHistory.slice(-limit);
  }

  getStats() {
    if (this.rebalanceHistory.length === 0) {
      return { totalRebalances: 0 };
    }
    
    const totalShifts = this.rebalanceHistory.reduce((sum, r) => {
      return sum + Math.abs(r.to.stablecoinPercent - r.from.stablecoinPercent);
    }, 0);
    
    return {
      totalRebalances: this.rebalanceHistory.length,
      averageShift: (totalShifts / this.rebalanceHistory.length).toFixed(2) + '%',
      lastRebalance: this.lastRebalance ? new Date(this.lastRebalance).toISOString() : null,
      isInCooldown: this.isInCooldown()
    };
  }
}
