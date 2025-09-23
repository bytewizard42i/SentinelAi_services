// Test Utilities for Compact Smart Contract Testing
// Shared functions and helpers for all contract tests

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Mock Midnight SDK functions for testing
const mockMidnightSDK = {
  compile: async (contractPath) => {
    // Simulate compilation
    return {
      bytecode: '0x' + '00'.repeat(100),
      abi: JSON.parse(fs.readFileSync(
        path.join(__dirname, '..', '..', 'contracts', 'abi', 
        path.basename(contractPath, '.compact') + '.json')
      ))
    };
  },
  deploy: async (bytecode, abi) => {
    // Simulate deployment
    return {
      address: ethers.utils.getAddress(
        '0x' + Math.random().toString(16).substr(2, 40).padEnd(40, '0')
      ),
      abi: abi
    };
  }
};

// Deploy a contract for testing
async function deployContract(contractName) {
  const contractPath = path.join(
    __dirname, '..', '..', 'contracts', `${contractName}.compact`
  );
  
  const { bytecode, abi } = await mockMidnightSDK.compile(contractPath);
  const deployed = await mockMidnightSDK.deploy(bytecode, abi);
  
  // Create contract interface
  const contract = {
    address: deployed.address,
    abi: deployed.abi,
    
    // Mock contract functions
    initialize: async (...args) => {
      return { wait: async () => ({ status: 1 }) };
    },
    
    // Add common getters
    getContractRegistry: async () => ({
      watchdogAddress: '0x' + '1'.repeat(40),
      guardianAddress: '0x' + '2'.repeat(40),
      profilerAddress: '0x' + '3'.repeat(40),
      isActive: true
    }),
    
    // Add action management
    submitAction: async (source, type, priority, payload) => {
      return '0x' + Math.random().toString(16).substr(2, 64);
    },
    
    getAction: async (id) => ({
      requestId: id,
      sourceContract: 1,
      actionType: 1,
      priority: 1,
      payload: '0x',
      timestamp: Math.floor(Date.now() / 1000),
      status: 1
    }),
    
    // Add queue management
    getQueueDepth: async (priority) => 0,
    
    // Add profile management for RiskProfiler
    submitQuizResponses: async (userId, responses) => {
      return { wait: async () => ({ status: 1 }) };
    },
    
    calculateRiskScore: async (userId) => {
      return Math.floor(Math.random() * 100);
    },
    
    generateRiskProfile: async (userId) => ({
      level: 'Balanced',
      riskAppetite: 2,
      minStablecoin: 30,
      maxStablecoin: 70,
      rebalanceCooldown: 1800,
      circuitBreakerEnabled: true
    }),
    
    // Add market data for MarketGuardian
    updateMarketData: async (btc, eth, volume, volatility) => {
      return { wait: async () => ({ status: 1 }) };
    },
    
    getMarketData: async () => ({
      btcPrice: 45000,
      ethPrice: 3000,
      volume24h: 1000000000,
      volatility: 35
    }),
    
    // Add watchdog functions
    recordTransaction: async (userId, amount, type, category) => {
      return { wait: async () => ({ status: 1 }) };
    },
    
    getUserProfile: async (userId) => ({
      userId: userId,
      transactionCount: 10,
      averageAmount: 1000,
      maxAmount: 5000,
      lastActivity: Math.floor(Date.now() / 1000)
    }),
    
    checkAmountAnomaly: async (userId, amount) => {
      return amount > 10000 ? 85 : 25;
    },
    
    // Time manipulation for testing
    incrementTime: async (seconds) => {
      return { wait: async () => ({ status: 1 }) };
    },
    
    // Generic connect function for multi-user testing
    connect: (signer) => {
      return contract; // Return same contract interface
    }
  };
  
  // Add dynamic function support
  return new Proxy(contract, {
    get(target, prop) {
      if (prop in target) {
        return target[prop];
      }
      // Return a mock async function for any unknown property
      return async (...args) => {
        console.log(`Mock call to ${prop} with args:`, args);
        return null;
      };
    }
  });
}

// Get test accounts
async function getAccount() {
  // Return mock accounts for testing
  return [
    { address: '0x' + '1'.repeat(40) }, // Owner
    { address: '0x' + '2'.repeat(40) }, // User1
    { address: '0x' + '3'.repeat(40) }  // User2
  ];
}

// Utility to generate random bytes
function randomBytes(length) {
  return '0x' + Math.random().toString(16).substr(2, length * 2).padEnd(length * 2, '0');
}

// Utility to generate random address
function randomAddress() {
  return ethers.utils.getAddress(
    '0x' + Math.random().toString(16).substr(2, 40).padEnd(40, '0')
  );
}

// Chai matchers for async testing
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

// Custom matchers
chai.Assertion.addMethod('revertedWith', function(expectedMessage) {
  const obj = this._obj;
  
  return new chai.Assertion(
    Promise.resolve(obj).then(
      () => {
        throw new Error(`Expected transaction to revert with "${expectedMessage}" but it succeeded`);
      },
      (error) => {
        if (!error.message.includes(expectedMessage)) {
          throw new Error(`Expected revert message "${expectedMessage}" but got "${error.message}"`);
        }
        return true;
      }
    )
  );
});

// Export utilities
module.exports = {
  deployContract,
  getAccount,
  randomBytes,
  randomAddress,
  expect: chai.expect
};
