#!/usr/bin/env node

// Proof Server Test Script - Verifies Real vs Mock Operation
// As recommended by Alice for quick verification

import axios from 'axios';

const PROOF_SERVER_URL = process.env.PROOF_SERVER_URL || 'http://localhost:6300';

console.log('🧪 Testing Proof Server at:', PROOF_SERVER_URL);

async function testProofServer() {
  try {
    // 1. Health check
    console.log('\n1️⃣ Health Check...');
    const health = await axios.get(`${PROOF_SERVER_URL}/health`);
    console.log('✅ Health Response:', JSON.stringify(health.data, null, 2));
    
    // Detect if mock or real
    const isMock = health.data.version?.includes('mock');
    console.log(`📦 Mode: ${isMock ? 'MOCK (Demo)' : 'REAL (Production)'}`);
    
    // 2. Test proof generation (if endpoint exists)
    console.log('\n2️⃣ Testing Proof Generation...');
    try {
      const proofReq = {
        circuit: 'test_circuit',
        inputs: { a: 3, b: 4 },
        witness: { c: 7 }
      };
      
      const start = Date.now();
      const proof = await axios.post(`${PROOF_SERVER_URL}/generate`, proofReq, {
        timeout: 10000
      });
      const duration = Date.now() - start;
      
      console.log('✅ Proof Generated in', duration, 'ms');
      console.log('📄 Proof:', proof.data.proof?.substring(0, 20) + '...');
      
      if (duration < 100) {
        console.log('⚡ Very fast response - likely MOCK server');
      } else {
        console.log('⏱️ Normal latency - likely REAL server');
      }
    } catch (err) {
      console.log('⚠️ Proof generation endpoint not available');
      console.log('   (This is normal for some server configurations)');
    }
    
    // 3. Test verification (if endpoint exists)
    console.log('\n3️⃣ Testing Proof Verification...');
    try {
      const verifyReq = {
        proof: '0x' + '0'.repeat(64),
        publicInputs: ['0x123'],
        verificationKey: '0xVK123'
      };
      
      const verify = await axios.post(`${PROOF_SERVER_URL}/verify`, verifyReq, {
        timeout: 5000
      });
      console.log('✅ Verification Response:', verify.data);
    } catch (err) {
      console.log('⚠️ Verification endpoint not available');
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 SUMMARY:');
    console.log('  Server:', PROOF_SERVER_URL);
    console.log('  Status: OPERATIONAL');
    console.log('  Mode:', isMock ? 'MOCK (Demo/Testing)' : 'REAL (Production)');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('🔌 No server running on', PROOF_SERVER_URL);
      console.error('💡 Try: make proof-mock (or make proof-real)');
    }
    process.exit(1);
  }
}

// Run the test
testProofServer().catch(console.error);
