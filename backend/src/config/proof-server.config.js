// Proof Server Configuration with Feature Flags
// Implements Alice's dual-mode approach

const useMock = process.env.USE_MOCK_PROOF === 'true';
const isDevelopment = process.env.NODE_ENV === 'development';

// Default to mock in development, real in production
const defaultMode = isDevelopment && !process.env.FORCE_REAL_PROOF;

export const proofServerConfig = {
  // Use mock if explicitly set or in dev mode (unless forced)
  useMock: useMock || defaultMode,
  
  // Base URLs
  mockUrl: process.env.MOCK_PROOF_URL || 'http://localhost:6300',
  realUrl: process.env.PROOF_SERVER_URL || 'http://localhost:6300',
  
  // Get active URL based on mode
  get baseUrl() {
    return this.useMock ? this.mockUrl : this.realUrl;
  },
  
  // Get mode string for logging
  get mode() {
    return this.useMock ? 'MOCK' : 'REAL';
  },
  
  // Timeouts (mock is faster)
  get timeout() {
    return this.useMock ? 5000 : 30000;
  },
  
  // Retry config
  retries: this.useMock ? 1 : 3,
  retryDelay: this.useMock ? 100 : 1000
};

// Log current mode on startup
console.log(`🔧 Proof Server Mode: ${proofServerConfig.mode}`);
console.log(`📡 Proof Server URL: ${proofServerConfig.baseUrl}`);

export default proofServerConfig;
