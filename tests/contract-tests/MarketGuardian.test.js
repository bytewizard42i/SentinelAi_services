// MarketGuardian Contract Tests
// Tests for market monitoring and automated rebalancing

const { expect } = require('chai');
const { deployContract, getAccount } = require('../test-utils');

describe('MarketGuardian Contract', () => {
  let guardian;
  let owner;
  let treasury;
  
  beforeEach(async () => {
    // Deploy contract
    guardian = await deployContract('MarketGuardian');
    [owner, treasury] = await getAccount();
    
    // Initialize with treasury address
    await guardian.initialize(treasury.address);
  });
  
  describe('Market Data Management', () => {
    it('should update market data correctly', async () => {
      const btcPrice = 45000;
      const ethPrice = 3000;
      const volume = 1000000000;
      const volatility = 35;
      
      await guardian.updateMarketData(btcPrice, ethPrice, volume, volatility);
      
      const data = await guardian.getMarketData();
      expect(data.btcPrice).to.equal(btcPrice);
      expect(data.ethPrice).to.equal(ethPrice);
      expect(data.volume24h).to.equal(volume);
      expect(data.volatility).to.equal(volatility);
    });
    
    it('should track price history', async () => {
      // Update prices multiple times
      await guardian.updateMarketData(45000, 3000, 1000000000, 35);
      await guardian.updateMarketData(44000, 2900, 1100000000, 40);
      await guardian.updateMarketData(46000, 3100, 900000000, 30);
      
      const history = await guardian.getPriceHistory();
      expect(history.length).to.equal(3);
      expect(history[2].btcPrice).to.equal(46000);
    });
    
    it('should calculate price changes', async () => {
      await guardian.updateMarketData(45000, 3000, 1000000000, 35);
      await guardian.incrementTime(3600); // 1 hour later
      await guardian.updateMarketData(46800, 3150, 1000000000, 35);
      
      const changes = await guardian.getPriceChanges();
      expect(changes.btcChange).to.be.closeTo(4, 0.5); // ~4% increase
      expect(changes.ethChange).to.be.closeTo(5, 0.5); // ~5% increase
    });
  });
  
  describe('Market Sentiment Analysis', () => {
    it('should calculate market sentiment score', async () => {
      // Set positive market conditions
      await guardian.updateMarketData(45000, 3000, 1500000000, 25);
      await guardian.updateIndicators({
        rsi: 55,
        macd: 'positive',
        volume_trend: 'increasing'
      });
      
      const sentiment = await guardian.calculateSentiment();
      expect(sentiment).to.be.greaterThan(50); // Positive sentiment
      expect(sentiment).to.be.lessThanOrEqual(100);
    });
    
    it('should detect bear market conditions', async () => {
      // Set negative market conditions
      await guardian.updateMarketData(35000, 2200, 500000000, 65);
      await guardian.updateIndicators({
        rsi: 25,
        macd: 'negative',
        volume_trend: 'decreasing'
      });
      
      const sentiment = await guardian.calculateSentiment();
      const isBear = await guardian.isBearMarket();
      
      expect(sentiment).to.be.lessThan(40);
      expect(isBear).to.be.true;
    });
    
    it('should detect bull market conditions', async () => {
      // Set positive market conditions
      await guardian.updateMarketData(55000, 3800, 2000000000, 30);
      await guardian.updateIndicators({
        rsi: 70,
        macd: 'positive',
        volume_trend: 'increasing'
      });
      
      const sentiment = await guardian.calculateSentiment();
      const isBull = await guardian.isBullMarket();
      
      expect(sentiment).to.be.greaterThan(70);
      expect(isBull).to.be.true;
    });
  });
  
  describe('Treasury Allocation', () => {
    it('should track current allocation', async () => {
      await guardian.updateAllocation(30, 50, 20);
      
      const allocation = await guardian.getCurrentAllocation();
      expect(allocation.stablecoins).to.equal(30);
      expect(allocation.majors).to.equal(50);
      expect(allocation.altcoins).to.equal(20);
      expect(allocation.total).to.equal(100);
    });
    
    it('should validate allocation percentages', async () => {
      // Should fail - total not 100%
      await expect(
        guardian.updateAllocation(30, 40, 20)
      ).to.be.revertedWith('Allocation must total 100%');
      
      // Should succeed - total is 100%
      await guardian.updateAllocation(30, 50, 20);
      const allocation = await guardian.getCurrentAllocation();
      expect(allocation.total).to.equal(100);
    });
  });
  
  describe('Rebalancing Strategy', () => {
    it('should calculate target allocation based on market', async () => {
      // Bear market conditions
      await guardian.updateMarketData(35000, 2200, 500000000, 65);
      await guardian.updateIndicators({
        rsi: 25,
        macd: 'negative',
        volume_trend: 'decreasing'
      });
      
      const target = await guardian.calculateTargetAllocation();
      expect(target.stablecoins).to.be.greaterThan(50); // More conservative
      expect(target.altcoins).to.be.lessThan(15); // Less risky assets
    });
    
    it('should respect user risk settings', async () => {
      const conservativeSettings = {
        riskAppetite: 1,
        minStablecoin: 40,
        maxStablecoin: 80,
        rebalanceCooldown: 3600,
        circuitBreakerEnabled: true
      };
      
      await guardian.updateUserSettings(owner.address, conservativeSettings);
      
      const target = await guardian.calculateTargetAllocation();
      expect(target.stablecoins).to.be.at.least(40);
      expect(target.stablecoins).to.be.at.most(80);
    });
    
    it('should implement gradual rebalancing', async () => {
      // Current allocation
      await guardian.updateAllocation(30, 50, 20);
      
      // Target is 60% stablecoins (bear market)
      await guardian.setTargetAllocation(60, 30, 10);
      
      // First rebalance step
      const step1 = await guardian.getNextRebalanceStep();
      expect(step1.stablecoins).to.be.greaterThan(30);
      expect(step1.stablecoins).to.be.lessThan(60);
      
      // Apply step
      await guardian.executeRebalanceStep(step1);
      
      // Second step should continue toward target
      const step2 = await guardian.getNextRebalanceStep();
      expect(step2.stablecoins).to.be.greaterThan(step1.stablecoins);
    });
  });
  
  describe('Circuit Breaker', () => {
    it('should trigger on extreme volatility', async () => {
      // Normal conditions
      await guardian.updateMarketData(45000, 3000, 1000000000, 35);
      let circuitBreaker = await guardian.isCircuitBreakerActive();
      expect(circuitBreaker).to.be.false;
      
      // Extreme volatility
      await guardian.updateMarketData(30000, 2000, 3000000000, 95);
      circuitBreaker = await guardian.isCircuitBreakerActive();
      expect(circuitBreaker).to.be.true;
    });
    
    it('should prevent rebalancing when triggered', async () => {
      // Trigger circuit breaker
      await guardian.updateMarketData(30000, 2000, 3000000000, 95);
      
      // Try to rebalance
      await expect(
        guardian.executeRebalance()
      ).to.be.revertedWith('Circuit breaker active');
    });
    
    it('should auto-reset after cooldown', async () => {
      // Trigger circuit breaker
      await guardian.updateMarketData(30000, 2000, 3000000000, 95);
      expect(await guardian.isCircuitBreakerActive()).to.be.true;
      
      // Wait for cooldown (1 hour)
      await guardian.incrementTime(3600);
      
      // Update with normal conditions
      await guardian.updateMarketData(45000, 3000, 1000000000, 35);
      expect(await guardian.isCircuitBreakerActive()).to.be.false;
    });
  });
  
  describe('Rebalancing Execution', () => {
    it('should execute rebalancing successfully', async () => {
      // Setup
      await guardian.updateAllocation(30, 50, 20);
      await guardian.setTargetAllocation(50, 40, 10);
      
      // Execute
      const tx = await guardian.executeRebalance();
      const receipt = await tx.wait();
      
      // Check event
      const event = receipt.events.find(e => e.event === 'RebalanceExecuted');
      expect(event).to.exist;
      expect(event.args.success).to.be.true;
    });
    
    it('should respect rebalance cooldown', async () => {
      // First rebalance
      await guardian.executeRebalance();
      
      // Try immediate second rebalance
      await expect(
        guardian.executeRebalance()
      ).to.be.revertedWith('Cooldown period active');
      
      // Wait for cooldown
      await guardian.incrementTime(1800);
      
      // Should work now
      await guardian.executeRebalance();
    });
    
    it('should log rebalancing history', async () => {
      // Execute multiple rebalances
      await guardian.executeRebalance();
      await guardian.incrementTime(1800);
      await guardian.executeRebalance();
      
      const history = await guardian.getRebalanceHistory();
      expect(history.length).to.equal(2);
      expect(history[0].timestamp).to.be.lessThan(history[1].timestamp);
    });
  });
  
  describe('Risk Tiers', () => {
    it('should apply conservative tier correctly', async () => {
      await guardian.setRiskTier(1); // Conservative
      
      const settings = await guardian.getRiskSettings();
      expect(settings.maxVolatility).to.equal(50);
      expect(settings.minConfidence).to.equal(70);
      expect(settings.rebalanceThreshold).to.equal(10);
    });
    
    it('should apply balanced tier correctly', async () => {
      await guardian.setRiskTier(2); // Balanced
      
      const settings = await guardian.getRiskSettings();
      expect(settings.maxVolatility).to.equal(70);
      expect(settings.minConfidence).to.equal(50);
      expect(settings.rebalanceThreshold).to.equal(15);
    });
    
    it('should apply aggressive tier correctly', async () => {
      await guardian.setRiskTier(3); // Aggressive
      
      const settings = await guardian.getRiskSettings();
      expect(settings.maxVolatility).to.equal(90);
      expect(settings.minConfidence).to.equal(30);
      expect(settings.rebalanceThreshold).to.equal(20);
    });
  });
  
  describe('Emergency Controls', () => {
    it('should pause all operations', async () => {
      await guardian.pause();
      
      await expect(
        guardian.executeRebalance()
      ).to.be.revertedWith('Contract paused');
      
      await expect(
        guardian.updateMarketData(45000, 3000, 1000000000, 35)
      ).to.be.revertedWith('Contract paused');
    });
    
    it('should resume operations after unpause', async () => {
      await guardian.pause();
      await guardian.unpause();
      
      // Should work again
      await guardian.updateMarketData(45000, 3000, 1000000000, 35);
      const data = await guardian.getMarketData();
      expect(data.btcPrice).to.equal(45000);
    });
    
    it('should allow emergency withdrawal', async () => {
      // Only owner can trigger
      await expect(
        guardian.connect(treasury).emergencyWithdraw()
      ).to.be.revertedWith('Owner only');
      
      await guardian.connect(owner).emergencyWithdraw();
      const status = await guardian.getEmergencyStatus();
      expect(status.withdrawn).to.be.true;
    });
  });
});
