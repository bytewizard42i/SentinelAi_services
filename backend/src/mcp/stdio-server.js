// MCP STDIO Server for Midnight Integration
// Based on Dega workshop best practices

import { Server } from '@modelcontextprotocol/sdk';
import { logger } from '../utils/logger.js';

export class MCPServer {
  constructor(midnightService) {
    this.midnight = midnightService;
    this.server = new Server({
      name: 'sentinel-treasury-mcp',
      version: '1.0.0'
    });
    
    this.tools = this.defineTools();
  }

  defineTools() {
    return {
      // Wallet Management Tools
      wallet_status: {
        description: 'Get wallet sync status and address',
        parameters: {},
        handler: async () => {
          const status = await this.midnight.getWalletStatus();
          return {
            synced: status.synced,
            address: status.address,
            height: status.blockHeight
          };
        }
      },
      
      wallet_balance: {
        description: 'Get token balances including shielded tokens',
        parameters: {
          token: { type: 'string', description: 'Token name or address' }
        },
        handler: async ({ token }) => {
          const balance = await this.midnight.getBalance(token);
          return {
            token: token,
            available: balance.available,
            pending: balance.pending,
            total: balance.total
          };
        }
      },
      
      send_transaction: {
        description: 'Send shielded token transaction',
        parameters: {
          token: { type: 'string', required: true },
          to: { type: 'string', required: true },
          amount: { type: 'number', required: true }
        },
        handler: async ({ token, to, amount }) => {
          logger.info(`Sending ${amount} ${token} to ${to}`);
          const tx = await this.midnight.sendTransaction('guardian', 'transfer', [
            token,
            to,
            amount
          ]);
          return {
            success: true,
            txHash: tx.hash,
            message: `Transaction initiated: ${amount} ${token} to ${to}`
          };
        }
      },
      
      // Treasury Management Tools
      check_treasury_status: {
        description: 'Get current treasury allocation and risk metrics',
        parameters: {},
        handler: async () => {
          const allocation = await this.midnight.callContract('guardian', 'getAllocation');
          return {
            stablecoinPercent: allocation.stablecoinPercent,
            riskAssetPercent: allocation.riskAssetPercent,
            lastRebalance: allocation.lastRebalance,
            rebalanceCount: allocation.rebalanceCount
          };
        }
      },
      
      check_anomaly_score: {
        description: 'Check user anomaly score for security',
        parameters: {
          userId: { type: 'string', required: true }
        },
        handler: async ({ userId }) => {
          const score = await this.midnight.callContract('watchdog', 'getUserRiskScore', [userId]);
          return {
            userId: userId,
            anomalyScore: score,
            status: score > 75 ? 'high_risk' : score > 50 ? 'medium_risk' : 'normal'
          };
        }
      },
      
      get_risk_profile: {
        description: 'Get user risk profile and recommended allocation',
        parameters: {
          userId: { type: 'string', required: true }
        },
        handler: async ({ userId }) => {
          const allocation = await this.midnight.callContract('profiler', 'getUserAllocation', [userId]);
          return allocation;
        }
      },
      
      trigger_rebalance: {
        description: 'Manually trigger treasury rebalancing',
        parameters: {
          targetStablecoin: { type: 'number', description: 'Target stablecoin percentage' }
        },
        handler: async ({ targetStablecoin }) => {
          const result = await this.midnight.sendTransaction('guardian', 'executeRebalance', [
            targetStablecoin,
            50 // Default volatility
          ]);
          return {
            success: true,
            txHash: result.hash,
            message: `Rebalancing to ${targetStablecoin}% stablecoins`
          };
        }
      }
    };
  }

  async start() {
    try {
      // Register all tools
      for (const [name, tool] of Object.entries(this.tools)) {
        this.server.registerTool(name, tool);
      }
      
      // Start STDIO server
      await this.server.listen({
        transport: 'stdio'
      });
      
      logger.info(`MCP Server started with ${Object.keys(this.tools).length} tools`);
      
      // Log available tools for debugging
      logger.debug('Available MCP tools:', Object.keys(this.tools));
      
      return true;
    } catch (error) {
      logger.error('Failed to start MCP server:', error);
      throw error;
    }
  }
  
  async stop() {
    await this.server.close();
    logger.info('MCP Server stopped');
  }
  
  // Method to handle agent requests
  async handleAgentRequest(request) {
    const { tool, parameters } = request;
    
    if (!this.tools[tool]) {
      throw new Error(`Unknown tool: ${tool}`);
    }
    
    try {
      const result = await this.tools[tool].handler(parameters);
      return {
        success: true,
        result: result
      };
    } catch (error) {
      logger.error(`Tool execution failed for ${tool}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Get tool descriptions for AI agents
  getToolDescriptions() {
    const descriptions = {};
    for (const [name, tool] of Object.entries(this.tools)) {
      descriptions[name] = {
        description: tool.description,
        parameters: tool.parameters
      };
    }
    return descriptions;
  }
}
