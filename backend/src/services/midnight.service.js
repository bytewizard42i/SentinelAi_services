// Midnight Network Integration Service
// Handles all blockchain interactions with Midnight

// Midnight Network imports
import { Wallet, createWalletRoot } from '@midnight-ntwrk/wallet';
import { NetworkId } from '@midnight-ntwrk/midnight-js-types';
import { Ledger } from '@midnight-ntwrk/ledger';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class MidnightService {
  constructor() {
    this.wallet = null;
    this.ledger = null;
    this.walletRoot = null;
    this.contracts = {
      watchdog: null,
      guardian: null,
      profiler: null,
      orchestrator: null
    };
    this.connected = false;
    this.networkConfig = {
      nodeUrl: process.env.MIDNIGHT_NODE_URL || 'https://node.testnet.midnight.network',
      indexerUrl: process.env.MIDNIGHT_INDEXER_URL || 'https://indexer.testnet.midnight.network',
      proofServerUrl: process.env.MIDNIGHT_PROOF_SERVER_URL || 'http://localhost:6300',
      networkId: process.env.MIDNIGHT_NETWORK || 'testnet'
    };
    this.agentId = process.env.AGENT_ID || 'sentinel_agent';
    this.storagePath = `./storage/${this.agentId}`;
  }

  async connect() {
    try {
      // Create storage directories
      await this.ensureStorageDirectories();
      
      // Initialize mesh for contract deployment (disabled for demo)
      // const privateKey = this.wallet.getPrivateKey();
      // this.mesh = await MeshWallet.create({
      //   privateKey: privateKey,
      //   network: this.networkConfig.networkId,
      //   fetcher: this.ledger.fetcher,
      //   submitter: this.ledger.submitter
      // });
      
      // Create or restore wallet (disabled for demo)
      // const walletSeed = await this.getOrCreateWalletSeed();
      // this.walletRoot = await createWalletRoot(walletSeed);
      // this.wallet = await Wallet.restore(this.walletRoot, this.ledger);
      
      this.connected = true;
      logger.info('Successfully connected to Midnight Network');
      
      // Log wallet address (disabled for demo)
      // const address = await this.wallet.getAddress();
      // logger.info(`Wallet address: ${address}`);
      logger.info('Mock wallet connected (demo mode)');
      
      return true;
    } catch (error) {
      logger.error('Failed to connect to Midnight:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.mesh) {
      await this.mesh.disconnect();
      this.connected = false;
      logger.info('Disconnected from Midnight Network');
    }
  }

  isConnected() {
    return this.connected;
  }

  async deployContracts() {
    try {
      // Load compiled contracts
      const contractsPath = path.join(__dirname, '../../../contracts/compiled');
      
      // Deploy TreasuryWatchdog
      const watchdogBytecode = await this.loadContractBytecode('TreasuryWatchdog');
      this.contracts.watchdog = await this.deployContract(watchdogBytecode, 'TreasuryWatchdog');
      
      // Deploy MarketGuardian
      const guardianBytecode = await this.loadContractBytecode('MarketGuardian');
      this.contracts.guardian = await this.deployContract(guardianBytecode, 'MarketGuardian');
      
      // Deploy RiskProfiler
      const profilerBytecode = await this.loadContractBytecode('RiskProfiler');
      this.contracts.profiler = await this.deployContract(profilerBytecode, 'RiskProfiler');
      
      // Deploy TreasuryOrchestrator with contract addresses
      const orchestratorBytecode = await this.loadContractBytecode('TreasuryOrchestrator');
      this.contracts.orchestrator = await this.deployContract(
        orchestratorBytecode, 
        'TreasuryOrchestrator',
        [
          this.contracts.watchdog.address,
          this.contracts.guardian.address,
          this.contracts.profiler.address
        ]
      );
      
      logger.info('All contracts deployed successfully');
      return this.contracts;
    } catch (error) {
      logger.error('Failed to deploy contracts:', error);
      // In development, use mock addresses
      if (process.env.NODE_ENV === 'development') {
        return this.useMockContracts();
      }
      throw error;
    }
  }

  async loadContractBytecode(contractName) {
    try {
      const bytecodeFile = path.join(__dirname, `../../../contracts/compiled/${contractName}.json`);
      const data = await fs.readFile(bytecodeFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      logger.warn(`Contract ${contractName} not compiled, using mock`);
      return { bytecode: '0x00', abi: [] };
    }
  }

  async deployContract(bytecode, name, constructorArgs = []) {
    if (process.env.NODE_ENV === 'development') {
      // Return mock contract for development
      return {
        address: `0x${Math.random().toString(16).substring(2, 42)}`,
        name: name,
        call: async (method, args) => this.mockContractCall(name, method, args),
        send: async (method, args) => this.mockContractSend(name, method, args)
      };
    }

    try {
      const contract = await this.mesh.deployContract({
        bytecode: bytecode.bytecode,
        abi: bytecode.abi,
        constructorArgs: constructorArgs
      });
      
      logger.info(`${name} deployed at ${contract.address}`);
      return contract;
    } catch (error) {
      logger.error(`Failed to deploy ${name}:`, error);
      throw error;
    }
  }

  useMockContracts() {
    // Use mock contracts for development
    this.contracts = {
      watchdog: {
        address: '0x1234567890123456789012345678901234567890',
        call: async (method, args) => this.mockContractCall('watchdog', method, args),
        send: async (method, args) => this.mockContractSend('watchdog', method, args)
      },
      guardian: {
        address: '0x2345678901234567890123456789012345678901',
        call: async (method, args) => this.mockContractCall('guardian', method, args),
        send: async (method, args) => this.mockContractSend('guardian', method, args)
      },
      profiler: {
        address: '0x3456789012345678901234567890123456789012',
        call: async (method, args) => this.mockContractCall('profiler', method, args),
        send: async (method, args) => this.mockContractSend('profiler', method, args)
      },
      orchestrator: {
        address: '0x4567890123456789012345678901234567890123',
        call: async (method, args) => this.mockContractCall('orchestrator', method, args),
        send: async (method, args) => this.mockContractSend('orchestrator', method, args)
      }
    };
    return this.contracts;
  }

  async mockContractCall(contract, method, args) {
    // Mock responses for contract calls
    logger.debug(`Mock call: ${contract}.${method}`, args);
    
    const mockResponses = {
      watchdog: {
        getUserRiskScore: () => Math.floor(Math.random() * 100),
        isAccountFrozen: () => false,
        getPendingChallenges: () => Math.floor(Math.random() * 5)
      },
      guardian: {
        getAllocation: () => ({
          stablecoinPercent: 30,
          riskAssetPercent: 70,
          lastRebalance: Date.now()
        }),
        calculateMarketScore: () => Math.floor(Math.random() * 200) - 100,
        verifyAllocationCompliance: () => true
      },
      profiler: {
        getUserAllocation: () => ({
          stablecoinPercent: 30,
          majorAssetsPercent: 50,
          growthAssetsPercent: 20
        }),
        verifyRiskCompliance: () => true
      },
      orchestrator: {
        getActionStatus: () => Math.floor(Math.random() * 4) + 1,
        getPendingActionCount: () => Math.floor(Math.random() * 10),
        getQueueDepth: () => Math.floor(Math.random() * 5)
      }
    };

    if (mockResponses[contract] && mockResponses[contract][method]) {
      return mockResponses[contract][method](args);
    }
    
    return null;
  }

  async mockContractSend(contract, method, args) {
    // Mock transaction sending
    logger.debug(`Mock send: ${contract}.${method}`, args);
    
    return {
      hash: `0x${Math.random().toString(16).substring(2, 66)}`,
      status: 'success',
      gasUsed: Math.floor(Math.random() * 100000) + 21000
    };
  }

  async callContract(contractName, method, args = []) {
    const contract = this.contracts[contractName];
    if (!contract) {
      throw new Error(`Contract ${contractName} not deployed`);
    }
    
    try {
      return await contract.call(method, args);
    } catch (error) {
      logger.error(`Failed to call ${contractName}.${method}:`, error);
      throw error;
    }
  }

  async sendTransaction(contractName, method, args = []) {
    const contract = this.contracts[contractName];
    if (!contract) {
      throw new Error(`Contract ${contractName} not deployed`);
    }
    
    try {
      const tx = await contract.send(method, args);
      logger.info(`Transaction sent: ${tx.hash}`);
      return tx;
    } catch (error) {
      logger.error(`Failed to send transaction ${contractName}.${method}:`, error);
      throw error;
    }
  }

  async generatePrivateKey() {
    // Generate a new private key if none provided
    const wallet = await MeshWallet.create();
    return wallet.getPrivateKey();
  }

  getContractAddress(contractName) {
    return this.contracts[contractName]?.address;
  }

  async getBalance(address) {
    try {
      return await this.mesh.getBalance(address);
    } catch (error) {
      logger.error('Failed to get balance:', error);
      return '0';
    }
  }

  async waitForTransaction(txHash) {
    try {
      return await this.mesh.waitForTransaction(txHash);
    } catch (error) {
      logger.error('Failed to wait for transaction:', error);
      throw error;
    }
  }

  isConnected() {
    return this.connected;
  }

  async ensureStorageDirectories() {
    // Create storage directories for wallet and data
    const dirs = [
      this.storagePath,
      `${this.storagePath}/wallets`,
      `${this.storagePath}/seeds`,
      `${this.storagePath}/logs`,
      `${this.storagePath}/transactions`
    ];

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        if (error.code !== 'EEXIST') {
          throw error;
        }
      }
    }
    
    logger.info(`Storage directories ensured at ${this.storagePath}`);
  }
}
