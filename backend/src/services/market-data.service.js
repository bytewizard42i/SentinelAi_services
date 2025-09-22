// Market Data Service - Provides real-time market data for Guardian AI
// Simulated data for hackathon demo

import axios from 'axios';
import { EventEmitter } from 'events';

export class MarketDataService extends EventEmitter {
  constructor() {
    super();
    this.prices = {
      ETH: 1650,
      BTC: 28500,
      USDT: 1.00,
      USDC: 1.00,
      DAI: 1.00
    };
    this.volatility = {};
    this.marketTrends = {};
  }

  async initialize() {
    console.log('🏪 Market Data Service initialized');
    this.startPriceSimulation();
    return true;
  }

  startPriceSimulation() {
    // Simulate market movements for demo
    setInterval(() => {
      // Random price movements
      this.prices.ETH *= (1 + (Math.random() - 0.5) * 0.001);
      this.prices.BTC *= (1 + (Math.random() - 0.5) * 0.001);
      
      // Calculate volatility
      this.volatility.ETH = Math.random() * 0.3;
      this.volatility.BTC = Math.random() * 0.35;
      
      this.emit('priceUpdate', this.prices);
    }, 5000);
  }

  async getPrice(token) {
    return this.prices[token] || 0;
  }

  async getPrices() {
    return this.prices;
  }

  async getVolatility(token) {
    return this.volatility[token] || 0.2;
  }

  async getMarketCondition() {
    const avgVolatility = Object.values(this.volatility).reduce((a, b) => a + b, 0) / Object.values(this.volatility).length;
    
    if (avgVolatility > 0.4) return 'high_volatility';
    if (avgVolatility > 0.25) return 'moderate';
    return 'stable';
  }

  async simulateMarketCrash() {
    // Simulate a 15% drop for testing
    this.prices.ETH *= 0.85;
    this.prices.BTC *= 0.85;
    this.emit('marketCrash', {
      severity: 'high',
      assets: ['ETH', 'BTC'],
      dropPercentage: 15
    });
    return { message: 'Market crash simulated', prices: this.prices };
  }

  async simulateRecovery() {
    this.prices.ETH *= 1.1;
    this.prices.BTC *= 1.1;
    this.emit('marketRecovery', {
      assets: ['ETH', 'BTC'],
      recoveryPercentage: 10
    });
    return { message: 'Market recovery simulated', prices: this.prices };
  }

  startPolling() {
    // Already started in initialize
    console.log('Market data polling started');
  }

  stopPolling() {
    // Stop price simulation if needed
    console.log('Market data polling stopped');
  }

  getLatestData() {
    return {
      prices: this.prices,
      volatility: this.volatility,
      condition: this.marketTrends
    };
  }
}
