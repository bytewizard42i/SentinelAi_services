// TreasuryWatchdog Contract Tests
// Tests for anomaly detection and behavioral profiling

const { expect } = require('chai');
const { deployContract, getAccount } = require('../test-utils');

describe('TreasuryWatchdog Contract', () => {
  let watchdog;
  let owner;
  let user1;
  let user2;
  
  beforeEach(async () => {
    // Deploy contract
    watchdog = await deployContract('TreasuryWatchdog');
    [owner, user1, user2] = await getAccount();
    
    // Initialize contract
    await watchdog.initialize();
  });
  
  describe('Behavioral Profiling', () => {
    it('should create user profile on first transaction', async () => {
      const userId = user1.address;
      
      // Record first transaction
      await watchdog.recordTransaction(userId, 1000, 1, 'transfer');
      
      // Check profile exists
      const profile = await watchdog.getUserProfile(userId);
      expect(profile).to.exist;
      expect(profile.transactionCount).to.equal(1);
      expect(profile.averageAmount).to.equal(1000);
    });
    
    it('should update profile statistics on new transactions', async () => {
      const userId = user1.address;
      
      // Record multiple transactions
      await watchdog.recordTransaction(userId, 1000, 1, 'transfer');
      await watchdog.recordTransaction(userId, 2000, 1, 'transfer');
      await watchdog.recordTransaction(userId, 1500, 1, 'transfer');
      
      const profile = await watchdog.getUserProfile(userId);
      expect(profile.transactionCount).to.equal(3);
      expect(profile.averageAmount).to.equal(1500);
      expect(profile.maxAmount).to.equal(2000);
    });
    
    it('should track transaction patterns over time', async () => {
      const userId = user1.address;
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Record transactions at different times
      await watchdog.recordTransaction(userId, 1000, 1, 'transfer');
      await watchdog.recordTransaction(userId, 1000, 1, 'transfer');
      
      const profile = await watchdog.getUserProfile(userId);
      expect(profile.lastActivity).to.be.closeTo(currentTime, 10);
      expect(profile.activityWindows).to.include(Math.floor(currentTime / 3600));
    });
  });
  
  describe('Anomaly Detection', () => {
    it('should detect amount anomalies', async () => {
      const userId = user1.address;
      
      // Build normal pattern
      for (let i = 0; i < 10; i++) {
        await watchdog.recordTransaction(userId, 1000, 1, 'transfer');
      }
      
      // Test anomaly detection
      const anomalyScore = await watchdog.checkAmountAnomaly(userId, 10000);
      expect(anomalyScore).to.be.greaterThan(80); // High anomaly score
      
      const normalScore = await watchdog.checkAmountAnomaly(userId, 1100);
      expect(normalScore).to.be.lessThan(30); // Low anomaly score
    });
    
    it('should detect frequency anomalies', async () => {
      const userId = user1.address;
      
      // Normal: 2 transactions per day
      await watchdog.recordTransaction(userId, 1000, 1, 'transfer');
      await watchdog.recordTransaction(userId, 1000, 1, 'transfer');
      
      // Wait a day (simulated)
      await watchdog.incrementTime(86400);
      
      // Anomaly: 10 transactions in short period
      for (let i = 0; i < 10; i++) {
        await watchdog.recordTransaction(userId, 1000, 1, 'transfer');
      }
      
      const anomalyScore = await watchdog.getFrequencyAnomaly(userId);
      expect(anomalyScore).to.be.greaterThan(70);
    });
    
    it('should detect recipient anomalies', async () => {
      const userId = user1.address;
      const regularRecipient = '0x123...';
      const newRecipient = '0x999...';
      
      // Build pattern with regular recipient
      for (let i = 0; i < 10; i++) {
        await watchdog.recordTransactionWithRecipient(
          userId, 1000, regularRecipient
        );
      }
      
      // Check anomaly for new recipient
      const anomalyScore = await watchdog.checkRecipientAnomaly(
        userId, newRecipient
      );
      expect(anomalyScore).to.be.greaterThan(60);
    });
  });
  
  describe('Alert Generation', () => {
    it('should create alert for high anomaly scores', async () => {
      const userId = user1.address;
      
      // Build normal pattern
      for (let i = 0; i < 5; i++) {
        await watchdog.recordTransaction(userId, 1000, 1, 'transfer');
      }
      
      // Trigger anomaly
      await watchdog.recordTransaction(userId, 100000, 1, 'transfer');
      
      const alerts = await watchdog.getActiveAlerts();
      expect(alerts.length).to.be.greaterThan(0);
      expect(alerts[0].userId).to.equal(userId);
      expect(alerts[0].severity).to.equal('critical');
    });
    
    it('should categorize alerts by severity', async () => {
      const userId = user1.address;
      
      // Low severity (score 40-60)
      await watchdog.generateAlert(userId, 45, 'frequency');
      let alert = await watchdog.getLatestAlert(userId);
      expect(alert.severity).to.equal('low');
      
      // Medium severity (score 60-80)
      await watchdog.generateAlert(userId, 70, 'amount');
      alert = await watchdog.getLatestAlert(userId);
      expect(alert.severity).to.equal('medium');
      
      // Critical severity (score > 80)
      await watchdog.generateAlert(userId, 90, 'recipient');
      alert = await watchdog.getLatestAlert(userId);
      expect(alert.severity).to.equal('critical');
    });
  });
  
  describe('Challenge Mechanism', () => {
    it('should create challenge for critical anomalies', async () => {
      const userId = owner.address;
      const actionId = '0xabc123';
      
      // Create challenge
      await watchdog.createChallenge(
        actionId, userId, 'Suspicious withdrawal', 95
      );
      
      const challenge = await watchdog.getChallenge(actionId);
      expect(challenge).to.exist;
      expect(challenge.status).to.equal('pending');
      expect(challenge.requiredApprovals).to.equal(2);
    });
    
    it('should track challenge approvals', async () => {
      const actionId = '0xdef456';
      
      await watchdog.createChallenge(
        actionId, owner.address, 'Large transfer', 85
      );
      
      // First approval
      await watchdog.connect(user1).approveChallenge(actionId);
      let challenge = await watchdog.getChallenge(actionId);
      expect(challenge.approvalCount).to.equal(1);
      expect(challenge.status).to.equal('pending');
      
      // Second approval - should complete
      await watchdog.connect(user2).approveChallenge(actionId);
      challenge = await watchdog.getChallenge(actionId);
      expect(challenge.approvalCount).to.equal(2);
      expect(challenge.status).to.equal('approved');
    });
    
    it('should reject challenge on denial', async () => {
      const actionId = '0xghi789';
      
      await watchdog.createChallenge(
        actionId, owner.address, 'Unauthorized access', 90
      );
      
      // Deny challenge
      await watchdog.connect(user1).denyChallenge(actionId);
      const challenge = await watchdog.getChallenge(actionId);
      expect(challenge.status).to.equal('rejected');
    });
  });
  
  describe('Freeze Mechanism', () => {
    it('should freeze account on critical anomaly', async () => {
      const userId = user1.address;
      
      // Trigger critical anomaly (score > 90)
      await watchdog.triggerCriticalAnomaly(userId, 95);
      
      const status = await watchdog.getAccountStatus(userId);
      expect(status.frozen).to.be.true;
      expect(status.freezeReason).to.include('Critical anomaly');
    });
    
    it('should require admin approval to unfreeze', async () => {
      const userId = user1.address;
      
      // Freeze account
      await watchdog.freezeAccount(userId, 'Suspicious activity');
      
      // Try to unfreeze as non-admin (should fail)
      await expect(
        watchdog.connect(user2).unfreezeAccount(userId)
      ).to.be.revertedWith('Admin only');
      
      // Unfreeze as admin (should succeed)
      await watchdog.connect(owner).unfreezeAccount(userId);
      const status = await watchdog.getAccountStatus(userId);
      expect(status.frozen).to.be.false;
    });
  });
  
  describe('Statistics and Reporting', () => {
    it('should track global statistics', async () => {
      // Record various transactions
      await watchdog.recordTransaction(user1.address, 1000, 1, 'transfer');
      await watchdog.recordTransaction(user2.address, 2000, 1, 'swap');
      await watchdog.recordTransaction(user1.address, 1500, 1, 'transfer');
      
      const stats = await watchdog.getGlobalStats();
      expect(stats.totalTransactions).to.equal(3);
      expect(stats.totalVolume).to.equal(4500);
      expect(stats.uniqueUsers).to.equal(2);
    });
    
    it('should generate anomaly reports', async () => {
      // Generate some anomalies
      await watchdog.recordTransaction(user1.address, 100000, 1, 'transfer');
      await watchdog.recordTransaction(user2.address, 50000, 1, 'transfer');
      
      const report = await watchdog.generateAnomalyReport(
        Math.floor(Date.now() / 1000) - 86400,
        Math.floor(Date.now() / 1000)
      );
      
      expect(report.totalAnomalies).to.be.greaterThan(0);
      expect(report.criticalCount).to.be.defined;
      expect(report.averageScore).to.be.defined;
    });
  });
});
