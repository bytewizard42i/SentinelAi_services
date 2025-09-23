// RiskProfiler Contract Tests
// Tests for user risk profiling and personalized allocation

const { expect } = require('chai');
const { deployContract, getAccount } = require('../test-utils');

describe('RiskProfiler Contract', () => {
  let profiler;
  let owner;
  let user1;
  let user2;
  
  beforeEach(async () => {
    // Deploy contract
    profiler = await deployContract('RiskProfiler');
    [owner, user1, user2] = await getAccount();
    
    // Initialize contract
    await profiler.initialize();
  });
  
  describe('Quiz Management', () => {
    it('should store quiz responses correctly', async () => {
      const userId = user1.address;
      const responses = {
        q1: 3, // Moderate risk tolerance
        q2: 3, // Medium time horizon
        q3: 2, // Some experience
        q4: 3, // Balanced goals
        q5: 3, // Somewhat uncomfortable with volatility
        q6: 2, // 30-50 age group
        q7: 3  // Moderate crypto comfort
      };
      
      await profiler.submitQuizResponses(userId, responses);
      
      const stored = await profiler.getQuizResponses(userId);
      expect(stored.q1).to.equal(3);
      expect(stored.q7).to.equal(3);
    });
    
    it('should calculate risk score from responses', async () => {
      const userId = user1.address;
      
      // Conservative responses (all 1s)
      const conservativeResponses = {
        q1: 1, q2: 1, q3: 1, q4: 1, q5: 1, q6: 1, q7: 1
      };
      await profiler.submitQuizResponses(userId, conservativeResponses);
      let score = await profiler.calculateRiskScore(userId);
      expect(score).to.be.lessThan(30);
      
      // Aggressive responses (all 5s)
      const aggressiveResponses = {
        q1: 5, q2: 5, q3: 5, q4: 5, q5: 5, q6: 5, q7: 5
      };
      await profiler.submitQuizResponses(user2.address, aggressiveResponses);
      score = await profiler.calculateRiskScore(user2.address);
      expect(score).to.be.greaterThan(70);
    });
    
    it('should weight questions appropriately', async () => {
      const userId = user1.address;
      
      // High weight questions (q1, q4, q5) should impact score more
      const responses = {
        q1: 5, // High weight - risk tolerance
        q2: 1,
        q3: 1,
        q4: 5, // High weight - investment goals
        q5: 5, // High weight - volatility comfort
        q6: 1,
        q7: 1
      };
      
      await profiler.submitQuizResponses(userId, responses);
      const score = await profiler.calculateRiskScore(userId);
      
      // Should be higher due to high-weight questions being 5
      expect(score).to.be.greaterThan(50);
    });
  });
  
  describe('Risk Profile Generation', () => {
    it('should generate conservative profile', async () => {
      const userId = user1.address;
      
      // Submit conservative responses
      const responses = {
        q1: 1, q2: 1, q3: 1, q4: 1, q5: 1, q6: 3, q7: 1
      };
      await profiler.submitQuizResponses(userId, responses);
      
      const profile = await profiler.generateRiskProfile(userId);
      expect(profile.level).to.equal('Conservative');
      expect(profile.riskAppetite).to.equal(1);
      expect(profile.minStablecoin).to.be.at.least(40);
      expect(profile.maxStablecoin).to.be.at.least(70);
      expect(profile.circuitBreakerEnabled).to.be.true;
    });
    
    it('should generate balanced profile', async () => {
      const userId = user1.address;
      
      // Submit balanced responses
      const responses = {
        q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 2, q7: 3
      };
      await profiler.submitQuizResponses(userId, responses);
      
      const profile = await profiler.generateRiskProfile(userId);
      expect(profile.level).to.equal('Balanced');
      expect(profile.riskAppetite).to.equal(2);
      expect(profile.minStablecoin).to.be.within(20, 40);
      expect(profile.maxStablecoin).to.be.within(60, 75);
      expect(profile.circuitBreakerEnabled).to.be.true;
    });
    
    it('should generate aggressive profile', async () => {
      const userId = user1.address;
      
      // Submit aggressive responses
      const responses = {
        q1: 5, q2: 5, q3: 5, q4: 5, q5: 5, q6: 1, q7: 5
      };
      await profiler.submitQuizResponses(userId, responses);
      
      const profile = await profiler.generateRiskProfile(userId);
      expect(profile.level).to.equal('Aggressive');
      expect(profile.riskAppetite).to.equal(3);
      expect(profile.minStablecoin).to.be.at.most(20);
      expect(profile.maxStablecoin).to.be.at.most(50);
      expect(profile.circuitBreakerEnabled).to.be.false;
    });
  });
  
  describe('Age-Based Adjustments', () => {
    it('should adjust for younger users', async () => {
      const userId = user1.address;
      
      // Young user with moderate responses
      const responses = {
        q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 1, q7: 3 // Age < 30
      };
      await profiler.submitQuizResponses(userId, responses);
      
      const profile = await profiler.generateRiskProfile(userId);
      const baseProfile = await profiler.getBaseProfile(55); // Same score, older
      
      // Younger should have slightly more risk tolerance
      expect(profile.maxStablecoin).to.be.lessThanOrEqual(baseProfile.maxStablecoin);
    });
    
    it('should be more conservative for older users', async () => {
      const userId = user1.address;
      
      // Older user with moderate responses
      const responses = {
        q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 5, q7: 3 // Age > 50
      };
      await profiler.submitQuizResponses(userId, responses);
      
      const profile = await profiler.generateRiskProfile(userId);
      
      // Should lean more conservative
      expect(profile.minStablecoin).to.be.at.least(30);
      expect(profile.circuitBreakerEnabled).to.be.true;
    });
  });
  
  describe('Suspicious Profile Detection', () => {
    it('should flag elderly with extreme risk', async () => {
      const userId = user1.address;
      
      // Elderly person with extremely aggressive profile
      const responses = {
        q1: 5, q2: 5, q3: 5, q4: 5, q5: 5, q6: 5, q7: 5 // Age > 50, all aggressive
      };
      await profiler.submitQuizResponses(userId, responses);
      
      const alerts = await profiler.getSuspiciousProfiles();
      expect(alerts).to.include(userId);
      
      const profile = await profiler.getRiskProfile(userId);
      expect(profile.flagged).to.be.true;
      expect(profile.flagReason).to.include('Elderly with extreme risk');
    });
    
    it('should flag sudden profile changes', async () => {
      const userId = user1.address;
      
      // Initial conservative profile
      let responses = {
        q1: 1, q2: 1, q3: 1, q4: 1, q5: 1, q6: 3, q7: 1
      };
      await profiler.submitQuizResponses(userId, responses);
      
      // Wait some time
      await profiler.incrementTime(86400); // 1 day
      
      // Sudden change to aggressive
      responses = {
        q1: 5, q2: 5, q3: 5, q4: 5, q5: 5, q6: 3, q7: 5
      };
      await profiler.updateQuizResponses(userId, responses);
      
      const changeAlert = await profiler.getProfileChangeAlert(userId);
      expect(changeAlert).to.exist;
      expect(changeAlert.severity).to.equal('high');
      expect(changeAlert.previousScore).to.be.lessThan(30);
      expect(changeAlert.newScore).to.be.greaterThan(70);
    });
    
    it('should track profile modification history', async () => {
      const userId = user1.address;
      
      // Multiple profile updates
      const responses1 = { q1: 2, q2: 2, q3: 2, q4: 2, q5: 2, q6: 3, q7: 2 };
      await profiler.submitQuizResponses(userId, responses1);
      
      await profiler.incrementTime(86400);
      const responses2 = { q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 3, q7: 3 };
      await profiler.updateQuizResponses(userId, responses2);
      
      await profiler.incrementTime(86400);
      const responses3 = { q1: 4, q2: 4, q3: 4, q4: 4, q5: 4, q6: 3, q7: 4 };
      await profiler.updateQuizResponses(userId, responses3);
      
      const history = await profiler.getProfileHistory(userId);
      expect(history.length).to.equal(3);
      expect(history[0].score).to.be.lessThan(history[1].score);
      expect(history[1].score).to.be.lessThan(history[2].score);
    });
  });
  
  describe('Allocation Recommendations', () => {
    it('should generate allocation for conservative profile', async () => {
      const userId = user1.address;
      
      // Create conservative profile
      const responses = { q1: 1, q2: 1, q3: 1, q4: 1, q5: 1, q6: 3, q7: 1 };
      await profiler.submitQuizResponses(userId, responses);
      
      const allocation = await profiler.getRecommendedAllocation(userId);
      expect(allocation.stablecoins).to.be.at.least(60);
      expect(allocation.majors).to.be.within(20, 35);
      expect(allocation.altcoins).to.be.at.most(10);
    });
    
    it('should generate allocation for balanced profile', async () => {
      const userId = user1.address;
      
      // Create balanced profile
      const responses = { q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 2, q7: 3 };
      await profiler.submitQuizResponses(userId, responses);
      
      const allocation = await profiler.getRecommendedAllocation(userId);
      expect(allocation.stablecoins).to.be.within(30, 50);
      expect(allocation.majors).to.be.within(35, 50);
      expect(allocation.altcoins).to.be.within(10, 20);
    });
    
    it('should generate allocation for aggressive profile', async () => {
      const userId = user1.address;
      
      // Create aggressive profile
      const responses = { q1: 5, q2: 5, q3: 5, q4: 5, q5: 5, q6: 1, q7: 5 };
      await profiler.submitQuizResponses(userId, responses);
      
      const allocation = await profiler.getRecommendedAllocation(userId);
      expect(allocation.stablecoins).to.be.at.most(30);
      expect(allocation.majors).to.be.within(40, 60);
      expect(allocation.altcoins).to.be.at.least(15);
    });
  });
  
  describe('Goal-Based Adjustments', () => {
    it('should adjust for capital preservation goal', async () => {
      const userId = user1.address;
      
      const responses = {
        q1: 3, q2: 3, q3: 3,
        q4: 1, // Capital preservation goal
        q5: 3, q6: 3, q7: 3
      };
      await profiler.submitQuizResponses(userId, responses);
      
      const allocation = await profiler.getRecommendedAllocation(userId);
      expect(allocation.stablecoins).to.be.at.least(50);
    });
    
    it('should adjust for growth goal', async () => {
      const userId = user1.address;
      
      const responses = {
        q1: 3, q2: 3, q3: 3,
        q4: 5, // Maximum growth goal
        q5: 3, q6: 3, q7: 3
      };
      await profiler.submitQuizResponses(userId, responses);
      
      const allocation = await profiler.getRecommendedAllocation(userId);
      expect(allocation.altcoins).to.be.at.least(15);
      expect(allocation.stablecoins).to.be.at.most(40);
    });
  });
  
  describe('Privacy Features', () => {
    it('should encrypt sensitive profile data', async () => {
      const userId = user1.address;
      
      const responses = { q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 3, q7: 3 };
      await profiler.submitQuizResponses(userId, responses);
      
      // Raw storage should be encrypted
      const rawData = await profiler.getRawProfileData(userId);
      expect(rawData).to.not.include('score');
      expect(rawData).to.match(/^0x[a-fA-F0-9]+$/); // Hex encoded
    });
    
    it('should use DIDs for identity', async () => {
      const userId = user1.address;
      
      const responses = { q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 3, q7: 3 };
      await profiler.submitQuizResponses(userId, responses);
      
      const did = await profiler.getUserDID(userId);
      expect(did).to.match(/^did:midnight:[a-zA-Z0-9]+$/);
    });
  });
  
  describe('Statistics and Analytics', () => {
    it('should track global statistics', async () => {
      // Submit profiles for multiple users
      const responses = { q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 3, q7: 3 };
      await profiler.submitQuizResponses(user1.address, responses);
      await profiler.submitQuizResponses(user2.address, responses);
      
      const stats = await profiler.getGlobalStats();
      expect(stats.totalProfiles).to.equal(2);
      expect(stats.averageRiskScore).to.be.defined;
      expect(stats.distributionByLevel).to.be.an('object');
    });
    
    it('should calculate risk distribution', async () => {
      // Create diverse profiles
      await profiler.submitQuizResponses(user1.address, 
        { q1: 1, q2: 1, q3: 1, q4: 1, q5: 1, q6: 3, q7: 1 }); // Conservative
      await profiler.submitQuizResponses(user2.address,
        { q1: 5, q2: 5, q3: 5, q4: 5, q5: 5, q6: 1, q7: 5 }); // Aggressive
      
      const distribution = await profiler.getRiskDistribution();
      expect(distribution.conservative).to.equal(1);
      expect(distribution.aggressive).to.equal(1);
      expect(distribution.balanced).to.equal(0);
    });
  });
});
