// Wallet Service for Midnight Integration
// Handles wallet operations and shielded tokens

import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger.js';

export class WalletService {
  constructor(storagePath, agentId) {
    this.storagePath = storagePath;
    this.agentId = agentId;
    this.walletState = null;
    this.tokens = new Map();
    this.syncInterval = null;
  }

  async ensureStorageDirectories() {
    const dirs = [
      this.storagePath,
      path.join(this.storagePath, 'logs'),
      path.join(this.storagePath, 'seeds'),
      path.join(this.storagePath, 'wallets'),
      path.join(this.storagePath, 'transactions')
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
    
    logger.info(`Storage directories created at ${this.storagePath}`);
  }

  async saveWalletState(wallet) {
    try {
      const walletPath = path.join(this.storagePath, 'wallets', 'midnight-wallet.json');
      const state = {
        address: wallet.address,
        publicKey: wallet.publicKey,
        syncHeight: wallet.syncHeight,
        tokens: Array.from(this.tokens.entries()),
        lastBackup: new Date().toISOString()
      };
      
      await fs.writeFile(walletPath, JSON.stringify(state, null, 2));
      logger.info(`Wallet state saved to ${walletPath}`);
      
      return walletPath;
    } catch (error) {
      logger.error('Failed to save wallet state:', error);
      throw error;
    }
  }

  async restoreWalletState() {
    try {
      const walletPath = path.join(this.storagePath, 'wallets', 'midnight-wallet.json');
      const exists = await fs.access(walletPath).then(() => true).catch(() => false);
      
      if (!exists) {
        logger.info('No wallet backup found, creating new wallet');
        return null;
      }
      
      const data = await fs.readFile(walletPath, 'utf-8');
      const state = JSON.parse(data);
      
      // Restore tokens
      if (state.tokens) {
        state.tokens.forEach(([key, value]) => {
          this.tokens.set(key, value);
        });
      }
      
      this.walletState = state;
      logger.info(`Wallet state restored from ${walletPath}`);
      
      return state;
    } catch (error) {
      logger.error('Failed to restore wallet state:', error);
      return null;
    }
  }

  async addShieldedToken(tokenAddress, tokenName) {
    try {
      if (this.tokens.has(tokenAddress)) {
        logger.info(`Token ${tokenName} already registered`);
        return;
      }
      
      this.tokens.set(tokenAddress, {
        name: tokenName,
        address: tokenAddress,
        type: 'shielded',
        addedAt: new Date().toISOString()
      });
      
      logger.info(`Added shielded token: ${tokenName} (${tokenAddress})`);
      
      // Save updated state
      await this.saveWalletState({ address: this.walletState?.address });
      
      return true;
    } catch (error) {
      logger.error('Failed to add shielded token:', error);
      throw error;
    }
  }

  async getTokenBalance(tokenAddress) {
    try {
      // In production, this would query the actual blockchain
      // For now, return mock data
      return {
        available: 1000,
        pending: 0,
        total: 1000
      };
    } catch (error) {
      logger.error('Failed to get token balance:', error);
      throw error;
    }
  }

  async startWalletSync(wallet, ledger) {
    try {
      logger.info('Starting wallet sync...');
      
      // Initial sync
      await this.syncWallet(wallet, ledger);
      
      // Set up periodic sync every 30 seconds
      this.syncInterval = setInterval(async () => {
        await this.syncWallet(wallet, ledger);
      }, 30000);
      
      logger.info('Wallet sync started');
    } catch (error) {
      logger.error('Failed to start wallet sync:', error);
      throw error;
    }
  }

  async syncWallet(wallet, ledger) {
    try {
      const startHeight = wallet.syncHeight || 0;
      const currentHeight = await ledger.getBlockHeight();
      
      if (currentHeight > startHeight) {
        logger.info(`Syncing wallet from block ${startHeight} to ${currentHeight}`);
        
        // In production, this would actually sync blocks
        wallet.syncHeight = currentHeight;
        
        // Save state after sync
        await this.saveWalletState(wallet);
        
        logger.info(`Wallet synced to block ${currentHeight}`);
      }
    } catch (error) {
      logger.error('Wallet sync failed:', error);
    }
  }

  stopWalletSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      logger.info('Wallet sync stopped');
    }
  }

  async backupSeed(seed) {
    try {
      const seedPath = path.join(this.storagePath, 'seeds', `${this.agentId}.seed`);
      
      // Encrypt seed in production
      await fs.writeFile(seedPath, seed, { mode: 0o600 });
      
      logger.info(`Seed backed up to ${seedPath}`);
      logger.warn('IMPORTANT: Keep seed secure and do not share!');
      
      return seedPath;
    } catch (error) {
      logger.error('Failed to backup seed:', error);
      throw error;
    }
  }

  async getTransactionHistory(limit = 10) {
    try {
      const txPath = path.join(this.storagePath, 'transactions', 'history.json');
      const exists = await fs.access(txPath).then(() => true).catch(() => false);
      
      if (!exists) {
        return [];
      }
      
      const data = await fs.readFile(txPath, 'utf-8');
      const history = JSON.parse(data);
      
      return history.slice(-limit);
    } catch (error) {
      logger.error('Failed to get transaction history:', error);
      return [];
    }
  }

  async saveTransaction(tx) {
    try {
      const txPath = path.join(this.storagePath, 'transactions', 'history.json');
      
      let history = await this.getTransactionHistory(1000);
      history.push({
        ...tx,
        timestamp: new Date().toISOString()
      });
      
      await fs.writeFile(txPath, JSON.stringify(history, null, 2));
      
      logger.info(`Transaction saved: ${tx.hash}`);
    } catch (error) {
      logger.error('Failed to save transaction:', error);
    }
  }
}
