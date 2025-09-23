// Real contract deployment implementation for Midnight Network
// Uses correct SDK versions and proof server

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';
import { MidnightService } from '../services/midnight.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ContractDeployer {
  constructor() {
    this.midnightService = new MidnightService();
    this.deployedContracts = {};
  }

  async deployContract(contractName, contractPath) {
    try {
      logger.info(`Deploying ${contractName} contract...`);
      
      // Read compiled contract
      const compiledPath = path.join(__dirname, '../../deploy', `${contractName}.compiled.json`);
      const contractData = JSON.parse(await fs.readFile(compiledPath, 'utf8'));
      
      // Connect to Midnight network
      await this.midnightService.connect();
      
      // Deploy contract using Midnight SDK
      const deploymentResult = await this.midnightService.deployContract({
        bytecode: contractData.bytecode,
        abi: contractData.abi,
        name: contractName
      });
      
      // Store deployment info
      this.deployedContracts[contractName] = {
        address: deploymentResult.address,
        txHash: deploymentResult.txHash,
        deployedAt: new Date().toISOString(),
        network: 'midnight-testnet'
      };
      
      logger.info(`${contractName} deployed at: ${deploymentResult.address}`);
      return deploymentResult;
      
    } catch (error) {
      logger.error(`Failed to deploy ${contractName}:`, error);
      throw error;
    }
  }

  async deployAllContracts() {
    try {
      logger.info('Starting deployment of all SentinelAI contracts...');
      
      // Deploy in correct order
      const contractOrder = [
        'TreasuryWatchdog',
        'MarketGuardian', 
        'RiskProfiler',
        'TreasuryOrchestrator'
      ];
      
      for (const contractName of contractOrder) {
        await this.deployContract(contractName);
      }
      
      // Initialize orchestrator with other contract addresses
      await this.initializeOrchestrator();
      
      // Save deployment addresses
      await this.saveDeploymentInfo();
      
      logger.info('All contracts deployed successfully!');
      return this.deployedContracts;
      
    } catch (error) {
      logger.error('Contract deployment failed:', error);
      throw error;
    }
  }

  async initializeOrchestrator() {
    try {
      const orchestratorAddress = this.deployedContracts.TreasuryOrchestrator.address;
      
      await this.midnightService.callContract(orchestratorAddress, 'initialize', {
        watchdogAddress: this.deployedContracts.TreasuryWatchdog.address,
        guardianAddress: this.deployedContracts.MarketGuardian.address,
        profilerAddress: this.deployedContracts.RiskProfiler.address
      });
      
      logger.info('TreasuryOrchestrator initialized with contract addresses');
    } catch (error) {
      logger.error('Failed to initialize orchestrator:', error);
      throw error;
    }
  }

  async saveDeploymentInfo() {
    const deployPath = path.join(__dirname, '../../deploy');
    
    // Save addresses
    const addressesFile = path.join(deployPath, 'contract_addresses.txt');
    const addressesContent = Object.entries(this.deployedContracts)
      .map(([name, info]) => `${name}: ${info.address}`)
      .join('\n');
    await fs.writeFile(addressesFile, addressesContent);
    
    // Save full deployment info
    const deploymentFile = path.join(deployPath, 'deployment.json');
    await fs.writeFile(deploymentFile, JSON.stringify(this.deployedContracts, null, 2));
    
    logger.info('Deployment info saved to deploy/');
  }
}

// CLI deployment script
if (import.meta.url === `file://${process.argv[1]}`) {
  const deployer = new ContractDeployer();
  deployer.deployAllContracts()
    .then(() => {
      console.log('✅ Deployment successful!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Deployment failed:', error);
      process.exit(1);
    });
}
