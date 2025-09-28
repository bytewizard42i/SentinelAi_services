#!/bin/bash

# Setup script for SentinelAI with Real Midnight Network Integration
set -e

echo "🚀 SentinelAI Midnight Network Setup"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}✗ $1 not found${NC}"
        echo "Please install $1 first"
        exit 1
    else
        echo -e "${GREEN}✓ $1 found${NC}"
    fi
}

echo "Checking prerequisites..."
check_command docker
check_command docker-compose
check_command node
check_command npm

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2)
echo "Node.js version: $NODE_VERSION"
if [[ "$NODE_VERSION" != "22.15.1" ]]; then
    echo -e "${YELLOW}⚠ Warning: Node.js v22.15.1 is recommended${NC}"
fi

# Create required directories
echo ""
echo "Creating storage directories..."
mkdir -p storage/{wallets,private-state,contracts,logs}
mkdir -p frontend/public
mkdir -p backend/dist
mkdir -p deploy/{prometheus,grafana/dashboards}

# Set up environment files
echo ""
echo "Setting up environment configuration..."

if [ ! -f backend/.env ]; then
    cat > backend/.env << 'EOF'
# Midnight Network Configuration
MIDNIGHT_NETWORK=testnet
MN_NODE=https://rpc.testnet-02.midnight.network
INDEXER=https://indexer.testnet-02.midnight.network/api/v1/graphql
INDEXER_WS=wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws
PROOF_SERVER=http://localhost:6300
STORAGE_BASE_DIR=./storage

# Agent Configuration
AGENT_ID=sentinel-agent
AGENT_NAME=SentinelAI
PORT=3000

# Wallet Configuration (will be auto-generated if not provided)
MIDNIGHT_SEED=
MIDNIGHT_MNEMONIC=

# AI Provider (optional)
OPENAI_API_KEY=
DISCORD_APPLICATION_ID=
DISCORD_TOKEN=

# Database
POSTGRES_USER=sentinel
POSTGRES_PASSWORD=sentinelpass
POSTGRES_DB=sentineldb
REDIS_URL=redis://localhost:6379

# Docker Network
DOCKER_NETWORK=sentinel-network
PROOF_SERVER_PORT=6300
EOF
    echo -e "${GREEN}✓ Created backend/.env${NC}"
else
    echo -e "${YELLOW}⚠ backend/.env already exists${NC}"
fi

# Install dependencies
echo ""
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

echo ""
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Pull Docker images
echo ""
echo "Pulling Midnight Network Docker images..."
docker pull midnightnetwork/proof-server:4.0.0 || {
    echo -e "${YELLOW}⚠ Could not pull proof server image, will try during docker-compose${NC}"
}

# Start Docker services
echo ""
echo "Starting Midnight Network services..."
docker-compose down 2>/dev/null || true

# Start only the essential services first
docker-compose up -d proof-server redis postgres

# Wait for proof server to be healthy
echo "Waiting for proof server to start..."
for i in {1..30}; do
    if curl -sf http://localhost:6300/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Proof server is healthy${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# Check if proof server is running
if ! curl -sf http://localhost:6300/health > /dev/null 2>&1; then
    echo -e "${RED}✗ Proof server failed to start${NC}"
    echo "Check logs with: docker logs sentinel-proof-server"
    exit 1
fi

# Start backend and frontend
echo ""
echo "Starting application services..."

# Start backend
echo "Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo "Waiting for backend to start..."
for i in {1..30}; do
    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is running${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# Start frontend
echo "Starting frontend..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

# Wait for frontend
echo "Waiting for frontend to start..."
for i in {1..30}; do
    if curl -sf http://localhost:3001 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend is running${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

echo ""
echo "===================================="
echo -e "${GREEN}✅ SentinelAI Midnight Setup Complete!${NC}"
echo ""
echo "🌐 Access Points:"
echo "   Dashboard: http://localhost:3001"
echo "   Backend API: http://localhost:3000"
echo "   WebSocket: ws://localhost:8080"
echo "   Proof Server: http://localhost:6300"
echo ""
echo "📊 Monitoring:"
echo "   Health Check: http://localhost:3000/health"
echo "   Dashboard Stats: http://localhost:3000/api/dashboard/stats"
echo ""
echo "🔧 Useful Commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop all: docker-compose down"
echo "   Restart: docker-compose restart"
echo ""
echo "📚 Documentation:"
echo "   README.md - Project overview"
echo "   MIDNIGHT_INTEGRATION.md - Midnight Network details"
echo "   HACKATHON_SUBMISSION.md - Submission details"
echo ""
echo -e "${YELLOW}⚠ Note: This is running with real Midnight Network integration${NC}"
echo -e "${YELLOW}  Transactions will use testnet tDUST tokens${NC}"
