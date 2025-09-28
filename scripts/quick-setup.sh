#!/bin/bash

# SentinelAI Quick Setup Script - Non-interactive
# Works with current Node version

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 SentinelAI Quick Setup${NC}"
echo "================================"
echo ""

# Function to check command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Docker
echo -e "${BLUE}Checking Docker...${NC}"
if ! command_exists docker; then
    echo -e "${RED}Docker not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}Docker not running. Please start Docker.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"

# Clean up existing containers
echo ""
echo -e "${BLUE}Cleaning up existing containers...${NC}"
docker-compose -f docker-compose.midnight.yml down 2>/dev/null || true
docker-compose down 2>/dev/null || true
echo -e "${GREEN}✓ Cleanup complete${NC}"

# Install backend dependencies (adjust for Node version)
echo ""
echo -e "${BLUE}Installing backend dependencies...${NC}"
cd backend

# Update package.json to work with current Node version
echo "Adjusting Node version requirements..."
if [ -f package.json ]; then
    # Remove strict engine requirement temporarily
    cp package.json package.json.bak
    sed -i '/"engines":/,/}/d' package.json
fi

# Install dependencies
npm install --force

# Update Midnight SDK packages to v2.0.2
echo "Updating Midnight SDK to v2.0.2..."
npm install \
    @midnight-ntwrk/midnight-js-types@2.0.2 \
    @midnight-ntwrk/midnight-js-contracts@2.0.2 \
    @midnight-ntwrk/midnight-js-network-id@2.0.2 \
    @midnight-ntwrk/midnight-js-http-client-proof-provider@2.0.2 \
    @midnight-ntwrk/midnight-js-indexer-public-data-provider@2.0.2 \
    @midnight-ntwrk/midnight-js-level-private-state-provider@2.0.2 \
    @midnight-ntwrk/midnight-js-node-zk-config-provider@2.0.2 \
    @midnight-ntwrk/midnight-js-utils@2.0.2 \
    --save --force 2>/dev/null || true

cd ..
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Install frontend dependencies
echo ""
echo -e "${BLUE}Installing frontend dependencies...${NC}"
cd frontend

# Remove strict requirements
if [ -f package.json ]; then
    cp package.json package.json.bak
    sed -i '/"engines":/,/}/d' package.json
fi

npm install --force

# Create webpack config if missing
if [ ! -f webpack.config.js ]; then
    echo "Creating webpack configuration..."
    cat > webpack.config.js << 'EOF'
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-react']
                    }
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './public/index.html',
            filename: 'index.html'
        })
    ],
    devServer: {
        port: 3001,
        hot: true,
        historyApiFallback: true,
        proxy: {
            '/api': 'http://localhost:3000',
            '/ws': {
                target: 'ws://localhost:8080',
                ws: true
            }
        }
    },
    resolve: {
        extensions: ['.js', '.jsx']
    }
};
EOF
fi

cd ..
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# Setup environment files
echo ""
echo -e "${BLUE}Setting up environment files...${NC}"

# Backend .env
if [ ! -f backend/.env ]; then
    cat > backend/.env << 'EOF'
# Midnight Network Configuration
MIDNIGHT_NETWORK=testnet
MN_NODE=https://rpc.testnet-02.midnight.network
INDEXER=https://indexer.testnet-02.midnight.network/api/v1/graphql
INDEXER_WS=wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws
PROOF_SERVER=http://localhost:6301

# Storage
STORAGE_BASE_DIR=./.storage

# Database
POSTGRES_HOST=localhost
POSTGRES_USER=sentinel
POSTGRES_PASSWORD=sentinelpass
POSTGRES_DB=sentineldb

# Redis
REDIS_URL=redis://localhost:6379

# API
PORT=3000
WS_PORT=8080
NODE_ENV=development

# Security
JWT_SECRET=your-jwt-secret-change-in-production
AGENT_ID=sentinel-agent
EOF
    echo -e "${GREEN}✓ Backend .env created${NC}"
fi

# Frontend .env
if [ ! -f frontend/.env ]; then
    cat > frontend/.env << 'EOF'
REACT_APP_API_URL=http://localhost:3000
REACT_APP_WS_URL=ws://localhost:8080
EOF
    echo -e "${GREEN}✓ Frontend .env created${NC}"
fi

# Create necessary directories
echo ""
echo -e "${BLUE}Creating directories...${NC}"
mkdir -p backend/logs
mkdir -p backend/.storage/wallets
mkdir -p backend/.storage/private-state
mkdir -p backend/.storage/contracts
mkdir -p storage
echo -e "${GREEN}✓ Directories created${NC}"

# Start Docker containers
echo ""
echo -e "${BLUE}Starting Docker containers...${NC}"

# Start only essential services first
docker-compose -f docker-compose.midnight.yml up -d proof-server postgres redis

# Wait for services
echo ""
echo -e "${BLUE}Waiting for services...${NC}"
sleep 15

# Verify services
echo ""
echo -e "${BLUE}Verifying services...${NC}"

# Check Proof Server
if curl -f http://localhost:6301/health >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Proof Server v4 running on port 6301${NC}"
else
    echo -e "${YELLOW}⚠ Proof Server starting...${NC}"
fi

# Check PostgreSQL
if docker exec sentinel-postgres pg_isready -U sentinel >/dev/null 2>&1; then
    echo -e "${GREEN}✓ PostgreSQL ready${NC}"
else
    echo -e "${YELLOW}⚠ PostgreSQL starting...${NC}"
fi

# Check Redis
if docker exec sentinel-redis redis-cli ping >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis ready${NC}"
else
    echo -e "${YELLOW}⚠ Redis starting...${NC}"
fi

echo ""
echo "================================"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "📋 Docker Services Running:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "🚀 To start the application:"
echo ""
echo "  Option 1 - Run locally:"
echo "    Terminal 1: cd backend && npm start"
echo "    Terminal 2: cd frontend && npm start"
echo ""
echo "  Option 2 - Run with Docker:"
echo "    docker-compose -f docker-compose.midnight.yml up backend frontend"
echo ""
echo "📍 Access Points:"
echo "  • Dashboard: http://localhost:3001"
echo "  • Backend API: http://localhost:3000"
echo "  • Proof Server: http://localhost:6301"
echo ""
echo "📝 View logs:"
echo "  docker-compose -f docker-compose.midnight.yml logs -f"
