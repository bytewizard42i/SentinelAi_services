// TreasuryOrchestrator Contract Tests
// Tests for inter-contract communication and conflict resolution

const { expect } = require('chai');
const { deployContract, getAccount } = require('../test-utils');

describe('TreasuryOrchestrator Contract', () => {
  let orchestrator;
  let watchdog;
  let guardian;
  let profiler;
  let owner;
  
  beforeEach(async () => {
    // Deploy all contracts
    orchestrator = await deployContract('TreasuryOrchestrator');
    watchdog = await deployContract('TreasuryWatchdog');
    guardian = await deployContract('MarketGuardian');
    profiler = await deployContract('RiskProfiler');
    [owner] = await getAccount();
    
    // Initialize orchestrator with contract addresses
    await orchestrator.initialize(
      watchdog.address,
      guardian.address,
      profiler.address
    );
  });
  
  describe('Contract Registry', () => {
    it('should register all three contracts', async () => {
      const registry = await orchestrator.getContractRegistry();
      
      expect(registry.watchdogAddress).to.equal(watchdog.address);
      expect(registry.guardianAddress).to.equal(guardian.address);
      expect(registry.profilerAddress).to.equal(profiler.address);
      expect(registry.isActive).to.be.true;
    });
    
    it('should verify source contracts', async () => {
      // Watchdog should be verified (sourceContract = 1)
      const isWatchdogValid = await orchestrator.verifySource(1);
      expect(isWatchdogValid).to.be.true;
      
      // Guardian should be verified (sourceContract = 2)
      const isGuardianValid = await orchestrator.verifySource(2);
      expect(isGuardianValid).to.be.true;
      
      // Profiler should be verified (sourceContract = 3)
      const isProfilerValid = await orchestrator.verifySource(3);
      expect(isProfilerValid).to.be.true;
      
      // Unknown source should fail
      const isUnknownValid = await orchestrator.verifySource(99);
      expect(isUnknownValid).to.be.false;
    });
  });
  
  describe('Action Submission', () => {
    it('should submit action from watchdog', async () => {
      const actionType = 2; // Freeze
      const priority = 1; // Critical
      const payload = '0x123abc';
      
      const requestId = await orchestrator.submitAction(
        1, // Watchdog
        actionType,
        priority,
        payload
      );
      
      expect(requestId).to.exist;
      
      const action = await orchestrator.getAction(requestId);
      expect(action.sourceContract).to.equal(1);
      expect(action.actionType).to.equal(actionType);
      expect(action.priority).to.equal(priority);
      expect(action.status).to.equal(1); // Pending
    });
    
    it('should submit action from guardian', async () => {
      const actionType = 1; // Rebalance
      const priority = 2; // High
      const payload = '0x456def';
      
      const requestId = await orchestrator.submitAction(
        2, // Guardian
        actionType,
        priority,
        payload
      );
      
      const action = await orchestrator.getAction(requestId);
      expect(action.sourceContract).to.equal(2);
      expect(action.actionType).to.equal(actionType);
    });
    
    it('should reject unauthorized sources', async () => {
      await expect(
        orchestrator.submitAction(99, 1, 1, '0x000')
      ).to.be.revertedWith('Unauthorized source contract');
    });
  });
  
  describe('Priority Queues', () => {
    it('should add critical actions to critical queue', async () => {
      await orchestrator.submitAction(1, 2, 1, '0x111'); // Critical
      
      const queueDepth = await orchestrator.getQueueDepth(1);
      expect(queueDepth).to.equal(1);
    });
    
    it('should add high priority to high queue', async () => {
      await orchestrator.submitAction(2, 1, 2, '0x222'); // High
      
      const queueDepth = await orchestrator.getQueueDepth(2);
      expect(queueDepth).to.equal(1);
    });
    
    it('should add medium priority to medium queue', async () => {
      await orchestrator.submitAction(3, 4, 3, '0x333'); // Medium
      
      const queueDepth = await orchestrator.getQueueDepth(3);
      expect(queueDepth).to.equal(1);
    });
    
    it('should add low priority to low queue', async () => {
      await orchestrator.submitAction(3, 4, 4, '0x444'); // Low
      
      const queueDepth = await orchestrator.getQueueDepth(4);
      expect(queueDepth).to.equal(1);
    });
  });
  
  describe('Conflict Detection', () => {
    it('should detect freeze vs rebalance conflict', async () => {
      // Submit freeze from watchdog
      const freezeId = await orchestrator.submitAction(
        1, 2, 1, '0xfreeze' // Watchdog, Freeze, Critical
      );
      
      // Submit rebalance from guardian
      const rebalanceId = await orchestrator.submitAction(
        2, 1, 2, '0xrebalance' // Guardian, Rebalance, High
      );
      
      // Check that conflict was detected
      const freezeAction = await orchestrator.getAction(freezeId);
      const rebalanceAction = await orchestrator.getAction(rebalanceId);
      
      // Watchdog should win (freeze overrides rebalance)
      expect(freezeAction.status).to.not.equal(3); // Not rejected
      expect(rebalanceAction.status).to.equal(3); // Rejected
    });
    
    it('should detect multiple rebalances conflict', async () => {
      // First rebalance
      const rebalance1 = await orchestrator.submitAction(
        2, 1, 2, '0xreb1'
      );
      
      // Second rebalance shortly after
      const rebalance2 = await orchestrator.submitAction(
        2, 1, 2, '0xreb2'
      );
      
      // Only one should be active
      const action1 = await orchestrator.getAction(rebalance1);
      const action2 = await orchestrator.getAction(rebalance2);
      
      const activeCount = [action1, action2].filter(a => a.status !== 3).length;
      expect(activeCount).to.equal(1);
    });
    
    it('should handle alert conflicts', async () => {
      // Execute an action
      const actionId = await orchestrator.submitAction(2, 1, 2, '0xaction');
      await orchestrator.processAction(actionId);
      
      // Submit alert that conflicts with execution
      const alertId = await orchestrator.submitAction(
        1, 3, 1, '0xalert' // Watchdog, Alert, Critical
      );
      
      const alert = await orchestrator.getAction(alertId);
      expect(alert).to.exist; // Alert should still exist but may pause others
    });
  });
  
  describe('Conflict Resolution Rules', () => {
    it('should apply watchdog > guardian rule', async () => {
      // Watchdog action
      const watchdogId = await orchestrator.submitAction(
        1, 2, 2, '0xwatch' // Same priority
      );
      
      // Guardian action conflicting
      const guardianId = await orchestrator.submitAction(
        2, 1, 2, '0xguard' // Same priority
      );
      
      await orchestrator.applyConflictRules(watchdogId, guardianId);
      
      const watchdogAction = await orchestrator.getAction(watchdogId);
      const guardianAction = await orchestrator.getAction(guardianId);
      
      // Watchdog should win
      expect(watchdogAction.status).to.not.equal(3);
      expect(guardianAction.status).to.equal(3);
    });
    
    it('should apply guardian > profiler rule', async () => {
      // Guardian action
      const guardianId = await orchestrator.submitAction(
        2, 1, 3, '0xguard'
      );
      
      // Profiler action conflicting
      const profilerId = await orchestrator.submitAction(
        3, 4, 3, '0xprofile'
      );
      
      await orchestrator.applyConflictRules(guardianId, profilerId);
      
      const guardianAction = await orchestrator.getAction(guardianId);
      const profilerAction = await orchestrator.getAction(profilerId);
      
      // Guardian should win
      expect(guardianAction.status).to.not.equal(3);
      expect(profilerAction.status).to.equal(3);
    });
    
    it('should apply critical priority override', async () => {
      // Critical action from profiler
      const criticalId = await orchestrator.submitAction(
        3, 4, 1, '0xcrit' // Profiler but critical
      );
      
      // High priority from watchdog
      const highId = await orchestrator.submitAction(
        1, 2, 2, '0xhigh' // Watchdog but high priority
      );
      
      await orchestrator.resolveConflict(criticalId, highId);
      
      const criticalAction = await orchestrator.getAction(criticalId);
      const highAction = await orchestrator.getAction(highId);
      
      // Critical should win regardless of source
      expect(criticalAction.status).to.not.equal(3);
      expect(highAction.status).to.equal(3);
    });
    
    it('should merge compatible actions', async () => {
      // Alert from watchdog
      const alertId = await orchestrator.submitAction(
        1, 3, 2, '0xalert'
      );
      
      // Non-conflicting action from guardian
      const actionId = await orchestrator.submitAction(
        2, 1, 3, '0xaction'
      );
      
      await orchestrator.applyConflictRules(alertId, actionId);
      
      const alertAction = await orchestrator.getAction(alertId);
      const normalAction = await orchestrator.getAction(actionId);
      
      // Both should be approved with modifications
      expect(alertAction.status).to.equal(2); // Approved with mods
      expect(normalAction.status).to.equal(2); // Approved with mods
    });
  });
  
  describe('Action Processing', () => {
    it('should process actions in priority order', async () => {
      // Submit actions of different priorities
      await orchestrator.submitAction(3, 4, 4, '0xlow');    // Low
      await orchestrator.submitAction(2, 1, 3, '0xmed');    // Medium
      await orchestrator.submitAction(2, 1, 2, '0xhigh');   // High
      await orchestrator.submitAction(1, 2, 1, '0xcrit');   // Critical
      
      const processedCount = await orchestrator.processActions();
      expect(processedCount).to.be.greaterThan(0);
      
      // Critical should be processed first
      const criticalQueue = await orchestrator.getQueueDepth(1);
      expect(criticalQueue).to.equal(0); // Processed
    });
    
    it('should validate actions before execution', async () => {
      const actionId = await orchestrator.submitAction(2, 1, 2, '0xold');
      
      // Fast forward time to make action expire
      await orchestrator.incrementTime(3700); // > 1 hour
      
      const result = await orchestrator.processAction(actionId);
      const action = await orchestrator.getAction(actionId);
      
      // Should be rejected due to timeout
      expect(action.status).to.equal(3); // Rejected
    });
    
    it('should execute different action types', async () => {
      // Rebalance action
      const rebalanceId = await orchestrator.submitAction(2, 1, 2, '0xreb');
      await orchestrator.processAction(rebalanceId);
      let action = await orchestrator.getAction(rebalanceId);
      expect(action.status).to.equal(4); // Executed
      
      // Freeze action
      const freezeId = await orchestrator.submitAction(1, 2, 1, '0xfreeze');
      await orchestrator.processAction(freezeId);
      action = await orchestrator.getAction(freezeId);
      expect(action.status).to.equal(4); // Executed
      
      // Alert action
      const alertId = await orchestrator.submitAction(1, 3, 2, '0xalert');
      await orchestrator.processAction(alertId);
      action = await orchestrator.getAction(alertId);
      expect(action.status).to.equal(4); // Executed
      
      // Update action
      const updateId = await orchestrator.submitAction(3, 4, 3, '0xupdate');
      await orchestrator.processAction(updateId);
      action = await orchestrator.getAction(updateId);
      expect(action.status).to.equal(4); // Executed
    });
  });
  
  describe('Action History', () => {
    it('should log executed actions', async () => {
      const actionId = await orchestrator.submitAction(2, 1, 2, '0xlog');
      await orchestrator.processAction(actionId);
      
      const history = await orchestrator.getActionHistory();
      expect(history.length).to.be.greaterThan(0);
      
      const lastLog = history[history.length - 1];
      expect(lastLog.actionId).to.equal(actionId);
      expect(lastLog.result).to.be.true;
    });
    
    it('should track action counter', async () => {
      const initialCount = await orchestrator.getActionCounter();
      
      // Process multiple actions
      const id1 = await orchestrator.submitAction(1, 2, 1, '0x1');
      const id2 = await orchestrator.submitAction(2, 1, 2, '0x2');
      await orchestrator.processAction(id1);
      await orchestrator.processAction(id2);
      
      const finalCount = await orchestrator.getActionCounter();
      expect(finalCount).to.equal(initialCount + 2);
    });
  });
  
  describe('Emergency Controls', () => {
    it('should pause orchestrator', async () => {
      await orchestrator.pauseOrchestrator();
      
      const registry = await orchestrator.getContractRegistry();
      expect(registry.isActive).to.be.false;
      
      // Actions should fail when paused
      await expect(
        orchestrator.submitAction(1, 2, 1, '0xpaused')
      ).to.be.revertedWith('Orchestrator paused');
    });
    
    it('should resume orchestrator', async () => {
      await orchestrator.pauseOrchestrator();
      await orchestrator.resumeOrchestrator();
      
      const registry = await orchestrator.getContractRegistry();
      expect(registry.isActive).to.be.true;
      
      // Should work again
      const actionId = await orchestrator.submitAction(1, 2, 1, '0xresumed');
      expect(actionId).to.exist;
    });
    
    it('should require admin for emergency controls', async () => {
      const [, nonAdmin] = await getAccount();
      
      await expect(
        orchestrator.connect(nonAdmin).pauseOrchestrator()
      ).to.be.revertedWith('Admin only');
      
      await expect(
        orchestrator.connect(nonAdmin).resumeOrchestrator()
      ).to.be.revertedWith('Admin only');
    });
  });
  
  describe('Query Functions', () => {
    it('should get action status', async () => {
      const actionId = await orchestrator.submitAction(1, 2, 1, '0xquery');
      
      const status = await orchestrator.getActionStatus(actionId);
      expect(status).to.equal(1); // Pending
      
      await orchestrator.processAction(actionId);
      const newStatus = await orchestrator.getActionStatus(actionId);
      expect(newStatus).to.equal(4); // Executed
    });
    
    it('should get pending action count', async () => {
      const initialCount = await orchestrator.getPendingActionCount();
      
      // Add some pending actions
      await orchestrator.submitAction(1, 2, 2, '0xa');
      await orchestrator.submitAction(2, 1, 3, '0xb');
      await orchestrator.submitAction(3, 4, 4, '0xc');
      
      const newCount = await orchestrator.getPendingActionCount();
      expect(newCount).to.equal(initialCount + 3);
    });
    
    it('should get queue depths', async () => {
      // Add to different queues
      await orchestrator.submitAction(1, 2, 1, '0xcrit');
      await orchestrator.submitAction(2, 1, 2, '0xhigh');
      await orchestrator.submitAction(3, 4, 3, '0xmed');
      await orchestrator.submitAction(3, 4, 4, '0xlow');
      
      expect(await orchestrator.getQueueDepth(1)).to.equal(1); // Critical
      expect(await orchestrator.getQueueDepth(2)).to.equal(1); // High
      expect(await orchestrator.getQueueDepth(3)).to.equal(1); // Medium
      expect(await orchestrator.getQueueDepth(4)).to.equal(1); // Low
    });
  });
  
  describe('Conflict Window', () => {
    it('should only check conflicts within window', async () => {
      // First action
      const oldId = await orchestrator.submitAction(2, 1, 2, '0xold');
      
      // Wait beyond conflict window (> 5 minutes)
      await orchestrator.incrementTime(400);
      
      // New conflicting action
      const newId = await orchestrator.submitAction(2, 1, 2, '0xnew');
      
      // Both should be pending (no conflict detected)
      const oldAction = await orchestrator.getAction(oldId);
      const newAction = await orchestrator.getAction(newId);
      
      expect(oldAction.status).to.equal(1); // Still pending
      expect(newAction.status).to.equal(1); // Also pending
    });
  });
});
