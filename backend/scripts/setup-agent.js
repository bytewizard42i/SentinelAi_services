#!/usr/bin/env node

// Setup script for Midnight MCP Agent
// Based on Dega workshop instructions

import { randomBytes } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateSeed() {
  // Generate 32-byte seed for Midnight wallet
  return randomBytes(32).toString('hex');
}

async function generateMnemonic() {
  // In production, use proper BIP39 mnemonic generation
  const words = [
    'abandon', 'ability', 'able', 'about', 'above', 'absent',
    'absorb', 'abstract', 'absurd', 'abuse', 'access', 'accident'
  ];
  
  // Generate 12-word mnemonic (simplified for demo)
  const mnemonic = [];
  for (let i = 0; i < 12; i++) {
    mnemonic.push(words[Math.floor(Math.random() * words.length)]);
  }
  
  return mnemonic.join(' ');
}

async function setupAgent(agentId) {
  console.log('🚀 Setting up Midnight MCP Agent...\n');
  
  const seed = await generateSeed();
  const mnemonic = await generateMnemonic();
  
  console.log('📝 Generated wallet credentials:');
  console.log('================================');
  console.log(`MIDNIGHT_SEED=${seed}`);
  console.log(`MIDNIGHT_MNEMONIC="${mnemonic}"`);
  console.log('================================');
  console.log('⚠️  IMPORTANT: Save these credentials securely!');
  console.log('⚠️  DO NOT share or commit them to version control!\n');
  
  // Generate MCP server configuration
  const mcpConfig = {
    mcpServers: {
      'midnight-mcp': {
        command: 'node',
        args: ['./src/mcp/stdio-server.js'],
        env: {
          AGENT_ID: agentId,
          MIDNIGHT_NETWORK: 'testnet'
        }
      }
    }
  };
  
  console.log('📋 MCP Server Configuration (for Eliza/AI agent):');
  console.log('================================================');
  console.log(JSON.stringify(mcpConfig, null, 2));
  console.log('================================================\n');
  
  // Create .env file if it doesn't exist
  const envPath = path.join(__dirname, '..', '.env');
  const envExample = path.join(__dirname, '..', '.env.example');
  
  try {
    await fs.access(envPath);
    console.log('✅ .env file already exists');
  } catch {
    // Copy .env.example to .env
    const exampleContent = await fs.readFile(envExample, 'utf-8');
    const envContent = exampleContent
      .replace('MIDNIGHT_SEED=', `MIDNIGHT_SEED=${seed}`)
      .replace('MIDNIGHT_MNEMONIC=', `MIDNIGHT_MNEMONIC="${mnemonic}"`)
      .replace('AGENT_ID=sentinel_treasury_agent', `AGENT_ID=${agentId}`);
    
    await fs.writeFile(envPath, envContent);
    console.log('✅ Created .env file with generated credentials');
  }
  
  console.log('\n📌 Next steps:');
  console.log('1. Update .env with your API keys (OpenAI, Discord if needed)');
  console.log('2. Add any shielded token addresses to TOKEN_1, TOKEN_2, etc.');
  console.log('3. Run "yarn dev" to start the MCP server');
  console.log('4. Configure your AI agent (Eliza) with the MCP config above');
  console.log('5. Test with natural language: "What is my wallet address?"');
  
  return {
    seed,
    mnemonic,
    mcpConfig
  };
}

// Parse command line arguments
const args = process.argv.slice(2);
const agentId = args[0] || 'sentinel_treasury_agent';

// Run setup
setupAgent(agentId).catch(console.error);
