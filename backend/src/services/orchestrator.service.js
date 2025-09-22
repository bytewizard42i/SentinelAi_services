// Orchestrator Service
// Manages inter-contract communication and conflict resolution

import EventEmitter from 'events';
import { logger } from '../utils/logger.js';

export class OrchestratorService extends EventEmitter {
  constructor(watchdogService, guardianService, profilerService) {
    super();
    this.watchdog = watchdogService;
    this.guardian = guardianService;
    this.profiler = profilerService;
    this.active = false;
    
    // Action queues by priority
    this.criticalQueue = [];
    this.highQueue = [];
    this.mediumQueue = [];
    this.lowQueue = [];
    
    // Pending actions
    this.pendingActions = new Map();
    this.actionCounter = 0;
    
    // Processing state
    this.isProcessing = false;
    this.processingInterval = null;
    
    // Configuration
    this.maxPendingActions = 10;
    this.conflictWindow = 300000; // 5 minutes
    this.processingIntervalMs = 5000; // Process every 5 seconds
    
    // Conflict resolution rules
    // Priority: Watchdog (1) > Guardian (2) > Profiler (3)
    this.conflictRules = [
      {
        id: 1,
        condition: 'freeze_vs_rebalance',
        priority1: 'watchdog',
        priority2: 'guardian',
        resolution: 'watchdog_wins'
      },
      {
        id: 2,
        condition: 'rebalance_vs_profile',
        priority1: 'guardian',
        priority2: 'profiler',
        resolution: 'guardian_wins'
      },
      {
        id: 3,
        condition: 'alert_vs_action',
        priority1: 'watchdog',
        priority2: 'any',
        resolution: 'pause_and_review'
      }
    ];
    
    // Action history
    this.actionHistory = [];
  }

  async initialize() {
    try {
      // Set up event listeners for each service
      this.setupEventListeners();
      
      this.active = true;
      logger.info('Orchestrator service initialized');
    } catch (error) {
      logger.error('Failed to initialize orchestrator:', error);
      throw error;
    }
  }

  setupEventListeners() {
    // Watchdog events
    this.watchdog.on('alert', (alert) => {
      this.handleWatchdogAlert(alert);
    });
    
    this.watchdog.on('accountFrozen', (data) => {
      this.submitAction('watchdog', 'freeze', 1, data); // Critical priority
    });
    
    this.watchdog.on('challengeCreated', (challenge) => {
      this.submitAction('watchdog', 'challenge', 2, challenge); // High priority
    });
    
    // Guardian events
    this.guardian.on('rebalance', (rebalance) => {
      this.submitAction('guardian', 'rebalance', 3, rebalance); // Medium priority
    });
    
    this.guardian.on('marketUpdate', (update) => {
      this.handleMarketUpdate(update);
    });
    
    // Profiler events
    this.profiler.on('profileAlert', (alert) => {
      this.submitAction('profiler', 'profile_alert', 4, alert); // Low priority
    });
    
    this.profiler.on('profileCreated', (data) => {
      this.handleProfileCreated(data);
    });
  }

  async handleWatchdogAlert(alert) {
    // Critical alerts get immediate attention
    if (alert.severity === 'critical') {
      // Pause guardian rebalancing
      this.pauseRebalancing();
      
      // Submit critical action
      this.submitAction('watchdog', 'critical_alert', 1, alert);
      
      // Notify all services
      this.broadcastAlert(alert);
    } else {
      this.submitAction('watchdog', 'alert', 2, alert);
    }
  }

  async handleMarketUpdate(update) {
    // Check if market conditions warrant immediate action
    if (update.data && update.data.volatilityIndex > 90) {
      logger.warn('Extreme market volatility detected');
      
      // Check for conflicts with pending actions
      const hasConflicts = this.checkForMarketConflicts();
      
      if (hasConflicts) {
        this.resolveMarketConflicts();
      }
    }
  }

  async handleProfileCreated(data) {
    const { profile, allocation } = data;
    
    // Check if profile is suspicious
    if (this.profiler.isSuspiciousProfile(profile.age, profile.riskTolerance)) {
      // Notify watchdog for additional monitoring
      await this.watchdog.recordTransaction(
        profile.userId,
        0, // No amount
        Date.now()
      );
    }
    
    // Update guardian with new user preferences
    if (allocation) {
      this.updateGuardianPreferences(profile.userId, allocation);
    }
  }

  submitAction(source, actionType, priority, payload) {
    try {
      const actionId = `action_${++this.actionCounter}_${Date.now()}`;
      
      const action = {
        id: actionId,
        source: source,
        type: actionType,
        priority: priority,
        payload: payload,
        timestamp: Date.now(),
        status: 'pending',
        attempts: 0
      };
      
      // Check pending action limit
      if (this.pendingActions.size >= this.maxPendingActions) {
        logger.warn('Max pending actions reached, dropping lowest priority');
        this.dropLowestPriorityAction();
      }
      
      // Add to pending actions
      this.pendingActions.set(actionId, action);
      
      // Add to priority queue
      this.addToQueue(action);
      
      // Check for conflicts
      this.checkConflicts(action);
      
      // Emit action submitted event
      this.emit('actionSubmitted', action);
      
      logger.debug(`Action submitted: ${actionId} (${source}:${actionType})`);
      
      return actionId;
    } catch (error) {
      logger.error('Failed to submit action:', error);
      throw error;
    }
  }

  addToQueue(action) {
    switch (action.priority) {
      case 1:
        this.criticalQueue.push(action.id);
        break;
      case 2:
        this.highQueue.push(action.id);
        break;
      case 3:
        this.mediumQueue.push(action.id);
        break;
      default:
        this.lowQueue.push(action.id);
    }
  }

  checkConflicts(newAction) {
    const conflicts = [];
    const now = Date.now();
    
    this.pendingActions.forEach((existingAction, id) => {
      // Skip if outside conflict window
      if (now - existingAction.timestamp > this.conflictWindow) {
        return;
      }
      
      // Check for conflicts
      if (this.detectConflict(newAction, existingAction)) {
        conflicts.push(existingAction);
      }
    });
    
    // Resolve conflicts if found
    if (conflicts.length > 0) {
      conflicts.forEach(conflictingAction => {
        this.resolveConflict(newAction, conflictingAction);
      });
    }
  }

  detectConflict(action1, action2) {
    // Freeze conflicts with rebalance
    if ((action1.type === 'freeze' && action2.type === 'rebalance') ||
        (action1.type === 'rebalance' && action2.type === 'freeze')) {
      return true;
    }
    
    // Multiple rebalances conflict
    if (action1.type === 'rebalance' && action2.type === 'rebalance') {
      return true;
    }
    
    // Critical alert conflicts with any execution
    if ((action1.type === 'critical_alert' && action2.status === 'executing') ||
        (action2.type === 'critical_alert' && action1.status === 'executing')) {
      return true;
    }
    
    return false;
  }

  resolveConflict(action1, action2) {
    logger.info(`Resolving conflict between ${action1.id} and ${action2.id}`);
    
    // Priority-based resolution
    if (action1.priority < action2.priority) {
      // action1 has higher priority (lower number)
      this.rejectAction(action2.id, 'Overridden by higher priority action');
    } else if (action2.priority < action1.priority) {
      // action2 has higher priority
      this.rejectAction(action1.id, 'Overridden by higher priority action');
    } else {
      // Same priority - use service hierarchy
      this.applyServiceHierarchy(action1, action2);
    }
  }

  applyServiceHierarchy(action1, action2) {
    const hierarchy = { 'watchdog': 1, 'guardian': 2, 'profiler': 3 };
    
    const priority1 = hierarchy[action1.source] || 99;
    const priority2 = hierarchy[action2.source] || 99;
    
    if (priority1 < priority2) {
      this.rejectAction(action2.id, 'Overridden by watchdog priority');
    } else if (priority2 < priority1) {
      this.rejectAction(action1.id, 'Overridden by higher service priority');
    } else {
      // Same service - keep newer
      this.rejectAction(action2.id, 'Replaced by newer action');
    }
  }

  rejectAction(actionId, reason) {
    const action = this.pendingActions.get(actionId);
    if (action) {
      action.status = 'rejected';
      action.rejectionReason = reason;
      
      // Remove from queue
      this.removeFromQueues(actionId);
      
      // Log to history
      this.logAction(action, false, reason);
      
      // Emit rejection event
      this.emit('actionRejected', { action, reason });
      
      logger.info(`Action ${actionId} rejected: ${reason}`);
    }
  }

  removeFromQueues(actionId) {
    this.criticalQueue = this.criticalQueue.filter(id => id !== actionId);
    this.highQueue = this.highQueue.filter(id => id !== actionId);
    this.mediumQueue = this.mediumQueue.filter(id => id !== actionId);
    this.lowQueue = this.lowQueue.filter(id => id !== actionId);
  }

  startProcessing() {
    if (this.isProcessing) {
      logger.warn('Processing already started');
      return;
    }
    
    this.isProcessing = true;
    
    // Process actions periodically
    this.processingInterval = setInterval(() => {
      this.processActions();
    }, this.processingIntervalMs);
    
    logger.info('Orchestrator processing started');
  }

  stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      logger.info('Orchestrator processing stopped');
    }
  }

  isActive() {
    return this.active;
  }

  async processActions() {
    if (!this.isProcessing) return;
    
    let processed = 0;
    const maxBatch = 5;
    
    // Process in priority order
    const queues = [
      this.criticalQueue,
      this.highQueue,
      this.mediumQueue,
      this.lowQueue
    ];
    
    for (const queue of queues) {
      while (queue.length > 0 && processed < maxBatch) {
        const actionId = queue.shift();
        const action = this.pendingActions.get(actionId);
        
        if (action && action.status === 'pending') {
          await this.executeAction(action);
          processed++;
        }
      }
      
      if (processed >= maxBatch) break;
    }
    
    if (processed > 0) {
      logger.debug(`Processed ${processed} actions`);
    }
  }

  async executeAction(action) {
    try {
      action.status = 'executing';
      action.attempts++;
      
      logger.info(`Executing action ${action.id} (${action.source}:${action.type})`);
      
      let success = false;
      let result = null;
      
      // Execute based on type
      switch (action.type) {
        case 'freeze':
          result = await this.executeFreezeAction(action.payload);
          success = true;
          break;
          
        case 'rebalance':
          result = await this.executeRebalanceAction(action.payload);
          success = true;
          break;
          
        case 'alert':
        case 'critical_alert':
          result = await this.executeAlertAction(action.payload);
          success = true;
          break;
          
        case 'challenge':
          result = await this.executeChallengeAction(action.payload);
          success = true;
          break;
          
        case 'profile_alert':
          result = await this.executeProfileAlertAction(action.payload);
          success = true;
          break;
          
        default:
          logger.warn(`Unknown action type: ${action.type}`);
      }
      
      // Update action status
      action.status = success ? 'completed' : 'failed';
      action.result = result;
      
      // Log action
      this.logAction(action, success, result);
      
      // Remove from pending
      this.pendingActions.delete(action.id);
      
      // Emit completion event
      this.emit('actionCompleted', { action, success, result });
      
    } catch (error) {
      logger.error(`Failed to execute action ${action.id}:`, error);
      
      action.status = 'failed';
      action.error = error.message;
      
      // Retry logic
      if (action.attempts < 3 && action.priority <= 2) {
        action.status = 'pending';
        this.addToQueue(action);
        logger.info(`Retrying action ${action.id} (attempt ${action.attempts})`);
      } else {
        this.pendingActions.delete(action.id);
        this.logAction(action, false, error.message);
      }
    }
  }

  async executeFreezeAction(payload) {
    logger.warn(`Freezing account: ${payload.userId}`);
    // Notify all services
    this.broadcastFreeze(payload);
    return { frozen: true, timestamp: Date.now() };
  }

  async executeRebalanceAction(payload) {
    logger.info(`Executing rebalance: ${payload.from.stablecoinPercent}% → ${payload.to.stablecoinPercent}%`);
    // Update all services with new allocation
    this.broadcastRebalance(payload);
    return { rebalanced: true, allocation: payload.to };
  }

  async executeAlertAction(payload) {
    logger.warn(`Processing alert: ${payload.details}`);
    // Notify relevant services
    this.broadcastAlert(payload);
    return { alerted: true, alertId: payload.id };
  }

  async executeChallengeAction(payload) {
    logger.info(`Creating challenge for admin ${payload.adminId}`);
    // Notify other admins
    this.broadcastChallenge(payload);
    return { challenged: true, challengeId: payload.id };
  }

  async executeProfileAlertAction(payload) {
    logger.info(`Profile alert for user ${payload.userId}`);
    // Notify watchdog for monitoring
    await this.watchdog.recordTransaction(payload.userId, 0, Date.now());
    return { processed: true, alertId: payload.id };
  }

  logAction(action, success, details) {
    const logEntry = {
      id: action.id,
      source: action.source,
      type: action.type,
      priority: action.priority,
      success: success,
      details: details,
      timestamp: Date.now()
    };
    
    this.actionHistory.push(logEntry);
    
    // Keep history limited
    if (this.actionHistory.length > 1000) {
      this.actionHistory.shift();
    }
  }

  // Broadcast methods
  broadcastAlert(alert) {
    this.emit('alert', alert);
  }

  broadcastFreeze(freeze) {
    this.emit('freeze', freeze);
    // Pause guardian rebalancing
    this.pauseRebalancing();
  }

  broadcastRebalance(rebalance) {
    this.emit('rebalance', rebalance);
  }

  broadcastChallenge(challenge) {
    this.emit('challenge', challenge);
  }

  // Helper methods
  pauseRebalancing() {
    logger.info('Pausing rebalancing due to critical event');
    // Would implement actual pause logic
  }

  checkForMarketConflicts() {
    return this.pendingActions.size > 0 && 
           Array.from(this.pendingActions.values()).some(a => a.type === 'rebalance');
  }

  resolveMarketConflicts() {
    this.pendingActions.forEach(action => {
      if (action.type === 'rebalance' && action.status === 'pending') {
        this.rejectAction(action.id, 'Market too volatile');
      }
    });
  }

  updateGuardianPreferences(userId, allocation) {
    // Would update guardian with user preferences
    logger.info(`Updated guardian preferences for user ${userId}`);
  }

  dropLowestPriorityAction() {
    // Find and drop the lowest priority action
    if (this.lowQueue.length > 0) {
      const actionId = this.lowQueue.shift();
      this.rejectAction(actionId, 'Dropped due to queue limit');
    } else if (this.mediumQueue.length > 0) {
      const actionId = this.mediumQueue.shift();
      this.rejectAction(actionId, 'Dropped due to queue limit');
    }
  }

  // Status methods
  isActive() {
    return this.active;
  }

  getStats() {
    return {
      pendingActions: this.pendingActions.size,
      criticalQueue: this.criticalQueue.length,
      highQueue: this.highQueue.length,
      mediumQueue: this.mediumQueue.length,
      lowQueue: this.lowQueue.length,
      totalProcessed: this.actionHistory.length,
      isProcessing: this.isProcessing
    };
  }

  getActionHistory(limit = 10) {
    return this.actionHistory.slice(-limit);
  }

  getPendingActions() {
    return Array.from(this.pendingActions.values());
  }
}
