// Midnight Network Service with Real Integration
// Based on midnight-mcp architecture

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import axios from 'axios';
import { logger } from '../utils/logger.js';

// Midnight Network SDK imports
import { createWalletRoot, Wallet } from '@midnight-ntwrk/wallet';
import { getNetworkId, NetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { 
  ContractAddress,
  LedgerParameters,
  TransactionContext,
  UnprovenTransaction
} from '@midnight-ntwrk/ledger';
import { 
  createZswapConnection,
  getNodeInfo,
  toLedgerStateQueryResult
} from '@midnight-ntwrk/zswap';
import { createIndexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { createLevelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { createNodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { generateSeed } from 'bip39';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class MidnightNetworkService {
  constructor() {
    this.wallet = null;
    this.connection = null;
    this.publicDataProvider = null;
    this.privateStateProvider = null;
    this.zkConfigProvider = null;
    this.proofProvider = null;
    
    this.contracts = {
      watchdog: null,
      guardian: null,
      profiler: null,
      orchestrator: null
    };
    
    this.config = {
      network: process.env.MIDNIGHT_NETWORK || 'testnet',
      nodeUrl: process.env.MN_NODE || 'https://rpc.testnet-02.midnight.network',
      indexerUrl: process.env.INDEXER || 'https://indexer.testnet-02.midnight.network/api/v1/graphql',
      indexerWsUrl: process.env.INDEXER_WS || 'wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws',
      proofServerUrl: process.env.PROOF_SERVER || 'http://localhost:6300',
      storagePath: process.env.STORAGE_BASE_DIR || './storage'
    };
    
    this.connected = false;
    this.agentId = process.env.AGENT_ID || 'sentinel-agent';
  }

  async connect() {
    try {
      logger.info('Initializing Midnight Network connection...');
      
      // Ensure storage directories exist
      await this.ensureStorageDirectories();
      
      // Create network connection
      this.connection = await createZswapConnection(
        this.config.nodeUrl,
        this.config.indexerUrl,
        this.config.indexerWsUrl
      );
      
      // Verify connection
      const nodeInfo = await getNodeInfo(this.connection);
      logger.info(`Connected to Midnight node: ${nodeInfo.network} at block ${nodeInfo.blockHeight}`);
      
      // Initialize providers
      await this.initializeProviders();
      
      // Create or restore wallet
      await this.initializeWallet();
      
      this.connected = true;
      logger.info('Successfully connected to Midnight Network');
      
      return true;
    } catch (error) {
      logger.error('Failed to connect to Midnight Network:', error);
      throw error;
    }
  }

  async initializeProviders() {
    try {
      // Public data provider for indexer queries
      this.publicDataProvider = await createIndexerPublicDataProvider({
        indexerUrl: this.config.indexerUrl,
        websocketUrl: this.config.indexerWsUrl
      });
      
      // Private state provider for local storage
      const privateStatePath = path.join(this.config.storagePath, 'private-state');
      this.privateStateProvider = await createLevelPrivateStateProvider(privateStatePath);
      
      // ZK config provider
      this.zkConfigProvider = createNodeZkConfigProvider(this.config.nodeUrl);
      
      // Proof provider
      this.proofProvider = httpClientProofProvider(this.config.proofServerUrl);
      
      logger.info('All providers initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize providers:', error);
      throw error;
    }
  }

  async initializeWallet() {
    try {
      const walletPath = path.join(this.config.storagePath, 'wallets', this.agentId);
      const seedFile = path.join(walletPath, 'seed.json');
      
      let seed;
      
      // Check if wallet exists
      if (existsSync(seedFile)) {
        logger.info('Loading existing wallet...');
        const seedData = JSON.parse(await fs.readFile(seedFile, 'utf-8'));
        seed = seedData.seed;
      } else {
        logger.info('Creating new wallet...');
        seed = generateSeed(256); // 24-word mnemonic
        
        // Save seed securely
        await fs.mkdir(walletPath, { recursive: true });
        await fs.writeFile(seedFile, JSON.stringify({ seed }, null, 2));
        await fs.chmod(seedFile, 0o600); // Restrict access
      }
      
      // Create wallet from seed
      const walletRoot = await createWalletRoot(seed);
      const networkId = getNetworkId(this.config.network);
      
      this.wallet = await Wallet.restore(walletRoot, {
        connection: this.connection,
        publicDataProvider: this.publicDataProvider,
        privateStateProvider: this.privateStateProvider,
        zkConfigProvider: this.zkConfigProvider,
        proofProvider: this.proofProvider,
        network: networkId
      });
      
      const address = await this.wallet.getAddress();
      logger.info(`Wallet initialized with address: ${address}`);
      
    } catch (error) {
      logger.error('Failed to initialize wallet:', error);
      throw error;
    }
  }

  async deployContracts() {
    try {
      logger.info('Deploying Sentinel AI contracts...');
      
      // Load compiled contracts
      const contractsPath = path.join(__dirname, '../../../contracts');
      
      // Deploy each contract
      for (const contractName of ['TreasuryWatchdog', 'MarketGuardian', 'RiskProfiler', 'TreasuryOrchestrator']) {
        const contractFile = path.join(contractsPath, `${contractName}.compact`);
        
        if (!existsSync(contractFile)) {
          logger.warn(`Contract file not found: ${contractFile}, skipping...`);
          continue;
        }
        
        try {
          const contractCode = await fs.readFile(contractFile, 'utf-8');
          const deployResult = await this.deployContract(contractName, contractCode);
          
          this.contracts[contractName.toLowerCase().replace('treasury', '')] = {
            address: deployResult.address,
            instance: deployResult.instance
          };
          
          logger.info(`${contractName} deployed at: ${deployResult.address}`);
        } catch (error) {
          logger.error(`Failed to deploy ${contractName}:`, error);
        }
      }
      
      logger.info('Contract deployment completed');
      return this.contracts;
      
    } catch (error) {
      logger.error('Failed to deploy contracts:', error);
      throw error;
    }
  }

  async deployContract(name, contractCode) {
    try {
      // Create deployment transaction
      const deployTx = await this.wallet.createContractDeployment({
        code: contractCode,
        initialState: {},
        constructorArgs: []
      });
      
      // Submit transaction
      const result = await this.wallet.submitTransaction(deployTx);
      
      // Wait for confirmation
      const receipt = await this.waitForTransaction(result.txHash);
      
      return {
        address: receipt.contractAddress,
        txHash: result.txHash,
        instance: await this.getContractInstance(receipt.contractAddress)
      };
      
    } catch (error) {
      logger.error(`Failed to deploy contract ${name}:`, error);
      throw error;
    }
  }

  async getContractInstance(address) {
    return {
      address,
      call: async (method, args) => this.callContract(address, method, args),
      send: async (method, args) => this.sendTransaction(address, method, args)
    };
  }

  async callContract(address, method, args = []) {
    try {
      const result = await this.wallet.callContract({
        address,
        method,
        args
      });
      
      return result;
    } catch (error) {
      logger.error(`Contract call failed: ${method}`, error);
      throw error;
    }
  }

  async sendTransaction(address, method, args = []) {
    try {
      const tx = await this.wallet.createContractCall({
        address,
        method,
        args
      });
      
      const result = await this.wallet.submitTransaction(tx);
      const receipt = await this.waitForTransaction(result.txHash);
      
      return receipt;
    } catch (error) {
      logger.error(`Transaction failed: ${method}`, error);
      throw error;
    }
  }

  async waitForTransaction(txHash, timeout = 60000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const receipt = await this.connection.getTransactionReceipt(txHash);
        if (receipt && receipt.status === 'confirmed') {
          return receipt;
        }
      } catch (error) {
        // Transaction not yet available
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error(`Transaction timeout: ${txHash}`);
  }

  async getBalance() {
    try {
      if (!this.wallet) {
        throw new Error('Wallet not initialized');
      }
      
      const balance = await this.wallet.getBalance();
      return balance;
    } catch (error) {
      logger.error('Failed to get balance:', error);
      throw error;
    }
  }

  async ensureStorageDirectories() {
    const dirs = [
      this.config.storagePath,
      path.join(this.config.storagePath, 'wallets'),
      path.join(this.config.storagePath, 'wallets', this.agentId),
      path.join(this.config.storagePath, 'private-state'),
      path.join(this.config.storagePath, 'contracts'),
      path.join(this.config.storagePath, 'logs')
    ];
    
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
    
    logger.info(`Storage directories ensured at ${this.config.storagePath}`);
  }

  async disconnect() {
    try {
      if (this.wallet) {
        await this.wallet.close();
      }
      
      if (this.privateStateProvider) {
        await this.privateStateProvider.close();
      }
      
      if (this.publicDataProvider) {
        await this.publicDataProvider.close();
      }
      
      if (this.connection) {
        await this.connection.close();
      }
      
      this.connected = false;
      logger.info('Disconnected from Midnight Network');
    } catch (error) {
      logger.error('Error during disconnect:', error);
    }
  }

  isConnected() {
    return this.connected;
  }

  getContractAddress(name) {
    return this.contracts[name]?.address;
  }
}
