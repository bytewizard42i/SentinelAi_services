#!/usr/bin/env node

// Interactive CLI for SentinelAI Demo
// Quick testing of all three pillars

import readline from 'readline';
import axios from 'axios';
import chalk from 'chalk';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: chalk.cyan('SentinelAI> ')
});

const MCP_URL = process.env.MCP_URL || 'http://localhost:3000';

class SentinelCLI {
  constructor() {
    this.userProfile = null;
    this.walletConnected = false;
    this.sessionData = {
      transactions: [],
      alerts: [],
      rebalances: []
    };
  }

  async start() {
    console.log(chalk.green.bold('\n🛡️  Welcome to SentinelAI Treasury Management\n'));
    console.log(chalk.yellow('Three-Tier AI Governance for DAO Treasury\n'));
    
    await this.checkConnection();
    
    console.log(chalk.cyan('Available commands:'));
    console.log('  1. profile  - Start risk profile quiz (Pillar 3)');
    console.log('  2. balance  - Check treasury allocation');
    console.log('  3. rebalance - Trigger market-based rebalancing (Pillar 1)');
    console.log('  4. simulate - Simulate anomalous transaction (Pillar 2)');
    console.log('  5. status   - Show system status');
    console.log('  6. help     - Show this help');
    console.log('  7. exit     - Exit CLI\n');
    
    rl.prompt();
    
    rl.on('line', async (line) => {
      const command = line.trim().toLowerCase();
      
      switch (command) {
        case '1':
        case 'profile':
          await this.runProfileQuiz();
          break;
          
        case '2':
        case 'balance':
          await this.checkBalance();
          break;
          
        case '3':
        case 'rebalance':
          await this.triggerRebalance();
          break;
          
        case '4':
        case 'simulate':
          await this.simulateAnomaly();
          break;
          
        case '5':
        case 'status':
          await this.showStatus();
          break;
          
        case '6':
        case 'help':
          this.showHelp();
          break;
          
        case '7':
        case 'exit':
        case 'quit':
          console.log(chalk.green('\nGoodbye! 👋\n'));
          process.exit(0);
          break;
          
        default:
          console.log(chalk.red(`Unknown command: ${command}`));
          this.showHelp();
      }
      
      rl.prompt();
    });
  }

  async checkConnection() {
    try {
      const response = await axios.get(`${MCP_URL}/health`);
      if (response.status === 200) {
        console.log(chalk.green('✓ Connected to MCP Server\n'));
        this.walletConnected = true;
      }
    } catch (error) {
      console.log(chalk.red('✗ MCP Server not running. Please run: docker-compose up -d\n'));
      this.walletConnected = false;
    }
  }

  async runProfileQuiz() {
    console.log(chalk.blue.bold('\n📋 Risk Profile Assessment\n'));
    
    const questions = [
      {
        q: 'What is your age?',
        validate: (a) => parseInt(a) >= 18 && parseInt(a) <= 100
      },
      {
        q: 'Risk tolerance (1-10)?',
        validate: (a) => parseInt(a) >= 1 && parseInt(a) <= 10
      },
      {
        q: 'Primary goal?\n  1. Capital preservation\n  2. Steady income\n  3. Growth\n  4. Maximum returns\nChoice',
        validate: (a) => parseInt(a) >= 1 && parseInt(a) <= 4
      },
      {
        q: 'Investment horizon?\n  1. <1 year\n  2. 1-3 years\n  3. 3-10 years\n  4. >10 years\nChoice',
        validate: (a) => parseInt(a) >= 1 && parseInt(a) <= 4
      },
      {
        q: 'Crypto experience?\n  1. None\n  2. <2 years\n  3. 2-5 years\n  4. >5 years\nChoice',
        validate: (a) => parseInt(a) >= 1 && parseInt(a) <= 4
      }
    ];
    
    const answers = [];
    
    for (const question of questions) {
      const answer = await this.askQuestion(question.q);
      if (!question.validate(answer)) {
        console.log(chalk.red('Invalid answer. Please try again.'));
        return;
      }
      answers.push(parseInt(answer));
    }
    
    // Calculate profile
    const age = answers[0];
    const riskTolerance = answers[1];
    const goal = answers[2];
    const horizon = answers[3];
    const experience = answers[4];
    
    let profileType = 'Balanced';
    let stablePercent = 40;
    let majorPercent = 40;
    let growthPercent = 20;
    
    if (age > 60 || riskTolerance < 4 || goal === 1) {
      profileType = 'Conservative';
      stablePercent = 60;
      majorPercent = 30;
      growthPercent = 10;
    } else if (age < 35 && riskTolerance > 7 && goal >= 3) {
      profileType = 'Aggressive';
      stablePercent = 20;
      majorPercent = 40;
      growthPercent = 40;
    } else if (riskTolerance >= 5 && riskTolerance <= 7) {
      profileType = 'Balanced';
      stablePercent = 40;
      majorPercent = 40;
      growthPercent = 20;
    }
    
    // Check for suspicious profile
    if (age > 65 && riskTolerance > 8) {
      console.log(chalk.red.bold('\n⚠️  ALERT: Suspicious profile detected!'));
      console.log(chalk.yellow('High risk tolerance at advanced age requires verification.\n'));
    }
    
    this.userProfile = {
      age,
      riskTolerance,
      goal,
      horizon,
      experience,
      type: profileType,
      allocation: {
        stablecoins: stablePercent,
        majorAssets: majorPercent,
        growthAssets: growthPercent
      }
    };
    
    console.log(chalk.green.bold(`\n✅ Profile Created: ${profileType}\n`));
    console.log(chalk.white('Recommended Allocation:'));
    console.log(`  • Stablecoins: ${stablePercent}%`);
    console.log(`  • Major Assets (BTC/ETH): ${majorPercent}%`);
    console.log(`  • Growth Assets: ${growthPercent}%\n`);
    
    // Save to MCP
    if (this.walletConnected) {
      try {
        await axios.post(`${MCP_URL}/profile`, this.userProfile);
        console.log(chalk.green('Profile saved to blockchain\n'));
      } catch (error) {
        console.log(chalk.yellow('Profile saved locally (MCP offline)\n'));
      }
    }
  }

  async checkBalance() {
    console.log(chalk.blue.bold('\n💰 Treasury Allocation\n'));
    
    if (!this.walletConnected) {
      // Mock data for demo
      console.log('Current Allocation:');
      console.log('  • Stablecoins: 35%');
      console.log('  • BTC: 30%');
      console.log('  • ETH: 25%');
      console.log('  • Other: 10%');
      console.log('\nTotal Value: $1,234,567\n');
      return;
    }
    
    try {
      const response = await axios.get(`${MCP_URL}/treasury/allocation`);
      const data = response.data;
      
      console.log('Current Allocation:');
      console.log(`  • Stablecoins: ${data.stablecoinPercent}%`);
      console.log(`  • Major Assets: ${data.majorAssetsPercent}%`);
      console.log(`  • Growth Assets: ${data.growthAssetsPercent}%`);
      console.log(`\nLast Rebalance: ${data.lastRebalance || 'Never'}\n`);
    } catch (error) {
      console.log(chalk.red('Failed to fetch balance\n'));
    }
  }

  async triggerRebalance() {
    console.log(chalk.blue.bold('\n🔄 Market Analysis & Rebalancing\n'));
    
    // Simulate market check
    console.log(chalk.yellow('Analyzing market conditions...'));
    await this.sleep(2000);
    
    const marketChange = -7.5; // Simulate 7.5% drop
    console.log(chalk.red(`Market Change: ${marketChange}% (ETH)\n`));
    
    console.log(chalk.yellow('Calculating optimal rebalancing...'));
    await this.sleep(1500);
    
    const currentStable = 35;
    const targetStable = 55;
    
    console.log(chalk.cyan('Rebalancing Plan:'));
    console.log(`  Current: ${currentStable}% stablecoins`);
    console.log(`  Target:  ${targetStable}% stablecoins`);
    console.log(`  Shift:   +${targetStable - currentStable}% to safety\n`);
    
    const confirm = await this.askQuestion('Execute rebalance? (y/n)');
    
    if (confirm.toLowerCase() === 'y') {
      console.log(chalk.yellow('\nExecuting rebalance...'));
      await this.sleep(2000);
      
      console.log(chalk.green('✅ Rebalance completed!'));
      console.log(`Transaction: 0x${Math.random().toString(16).substr(2, 64)}`);
      console.log('Estimated recovery: 4-6 hours\n');
      
      this.sessionData.rebalances.push({
        timestamp: new Date(),
        from: currentStable,
        to: targetStable,
        marketChange: marketChange
      });
    } else {
      console.log(chalk.yellow('Rebalance cancelled\n'));
    }
  }

  async simulateAnomaly() {
    console.log(chalk.blue.bold('\n🚨 Simulating Anomalous Transaction\n'));
    
    const scenarios = [
      {
        name: 'Large Withdrawal',
        amount: 50000,
        type: 'withdraw',
        description: 'Attempting to withdraw 50,000 tokens (5x average)'
      },
      {
        name: 'Rapid Transfers',
        amount: 1000,
        type: 'transfer',
        description: 'Multiple transfers in quick succession'
      },
      {
        name: 'Unusual Hour',
        amount: 10000,
        type: 'withdraw',
        description: 'Large withdrawal at 3 AM'
      }
    ];
    
    console.log('Select anomaly scenario:');
    scenarios.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.name} - ${s.description}`);
    });
    
    const choice = await this.askQuestion('\nChoice (1-3)');
    const scenario = scenarios[parseInt(choice) - 1];
    
    if (!scenario) {
      console.log(chalk.red('Invalid choice\n'));
      return;
    }
    
    console.log(chalk.yellow(`\nSimulating: ${scenario.description}`));
    await this.sleep(1500);
    
    console.log(chalk.red.bold('\n⚠️  ANOMALY DETECTED!\n'));
    
    const anomalyScore = 0.85;
    console.log(`Anomaly Score: ${chalk.red((anomalyScore * 100).toFixed(0) + '%')}`);
    console.log(`Transaction Type: ${scenario.type}`);
    console.log(`Amount: ${scenario.amount} tokens\n`);
    
    console.log(chalk.yellow('Reasons:'));
    console.log('  • Transaction 5x larger than average');
    console.log('  • Unusual time pattern detected');
    console.log('  • User risk profile mismatch\n');
    
    console.log(chalk.cyan.bold('🔐 CHALLENGE REQUIRED\n'));
    console.log('This transaction requires 2/3 admin approval');
    console.log('Challenge ID: challenge_' + Date.now());
    console.log('Expires in: 10 minutes\n');
    
    const approve = await this.askQuestion('Simulate admin approval? (y/n)');
    
    if (approve.toLowerCase() === 'y') {
      console.log(chalk.yellow('\nGathering approvals...'));
      await this.sleep(1000);
      console.log('  Admin 1: ✅ Approved');
      await this.sleep(1000);
      console.log('  Admin 2: ✅ Approved');
      await this.sleep(1000);
      console.log(chalk.green('\n✅ Transaction approved after verification\n'));
    } else {
      console.log(chalk.red('\n❌ Transaction blocked - Insufficient approvals\n'));
    }
    
    this.sessionData.alerts.push({
      timestamp: new Date(),
      scenario: scenario.name,
      score: anomalyScore,
      approved: approve.toLowerCase() === 'y'
    });
  }

  async showStatus() {
    console.log(chalk.blue.bold('\n📊 System Status\n'));
    
    console.log(chalk.green('Services:'));
    console.log(`  • MCP Server: ${this.walletConnected ? '✅ Online' : '❌ Offline'}`);
    console.log(`  • Proof Server: ${this.walletConnected ? '✅ Online' : '❌ Offline'}`);
    console.log(`  • Treasury Watchdog: ✅ Active`);
    console.log(`  • Market Guardian: ✅ Active`);
    console.log(`  • Risk Profiler: ✅ Active\n`);
    
    if (this.userProfile) {
      console.log(chalk.cyan('User Profile:'));
      console.log(`  • Type: ${this.userProfile.type}`);
      console.log(`  • Risk Score: ${this.userProfile.riskTolerance}/10\n`);
    }
    
    console.log(chalk.yellow('Session Activity:'));
    console.log(`  • Rebalances: ${this.sessionData.rebalances.length}`);
    console.log(`  • Alerts: ${this.sessionData.alerts.length}`);
    console.log(`  • Transactions: ${this.sessionData.transactions.length}\n`);
  }

  showHelp() {
    console.log(chalk.cyan('\nCommands:'));
    console.log('  profile   - Take risk assessment quiz');
    console.log('  balance   - View treasury allocation');
    console.log('  rebalance - Trigger market-based rebalancing');
    console.log('  simulate  - Test anomaly detection');
    console.log('  status    - Check system status');
    console.log('  help      - Show this help');
    console.log('  exit      - Exit CLI\n');
  }

  askQuestion(question) {
    return new Promise((resolve) => {
      rl.question(chalk.cyan(question + ': '), (answer) => {
        resolve(answer);
      });
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Start CLI
const cli = new SentinelCLI();
cli.start().catch(console.error);
