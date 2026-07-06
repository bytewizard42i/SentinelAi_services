const { runStructuralTests } = require('../../midnight-modules/tests/structural-test-helper.cjs');
const path = require('path');

runStructuralTests('MarketGuardian', path.join(__dirname, '..', 'build', 'MarketGuardian', 'contract', 'index.d.ts'), {
  expected: ['addOracle', 'addWatchedAsset', 'getAllocation', 'initialize', 'triggerRebalance', 'updateMarketData', 'updateRiskSettings', 'verifyAllocationCompliance'],
  mustHave: ['initialize', 'triggerRebalance', 'verifyAllocationCompliance'],
});

runStructuralTests('RiskProfiler', path.join(__dirname, '..', 'build', 'RiskProfiler', 'contract', 'index.d.ts'), {
  expected: ['createProfile', 'getUserAllocation', 'lockProfile', 'updateProfile', 'verifyRiskCompliance'],
  mustHave: ['createProfile', 'verifyRiskCompliance'],
});

runStructuralTests('TreasuryOrchestrator', path.join(__dirname, '..', 'build', 'TreasuryOrchestrator', 'contract', 'index.d.ts'), {
  expected: ['getActionStatus', 'initialize', 'pauseOrchestrator', 'processAction', 'resolveConflict', 'resumeOrchestrator', 'submitAction'],
  mustHave: ['initialize', 'submitAction', 'processAction'],
});

runStructuralTests('TreasuryWatchdog', path.join(__dirname, '..', 'build', 'TreasuryWatchdog', 'contract', 'index.d.ts'), {
  expected: ['approveChallenge', 'createChallenge', 'getUserRiskScore', 'initializeProfile', 'isAccountFrozen', 'recordTransaction', 'unfreezeAccount'],
  mustHave: ['createChallenge', 'recordTransaction', 'isAccountFrozen'],
});
