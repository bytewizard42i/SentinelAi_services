#!/bin/bash

# SentinelAI Repository Repair and Setup Script
# Ensures all dependencies and services are correctly configured
# Based on Dega-Midnight requirements

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 SentinelAI Repository Repair & Setup${NC}"
echo "========================================="
echo ""

# Function to check command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Node.js via NVM
install_node() {
    echo -e "${YELLOW}Installing Node.js v22.15.1...${NC}"
    
    # Check if nvm is installed
    if [ ! -d "$HOME/.nvm" ]; then
        echo "Installing NVM..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    fi
    
    # Load NVM
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    # Install and use Node 22.15.1
    nvm install 22.15.1
    nvm use 22.15.1
    nvm alias default 22.15.1
    
    echo -e "${GREEN}✓ Node.js v22.15.1 installed${NC}"
}

# Check Node.js version
echo -e "${BLUE}Checking Node.js version...${NC}"
if command_exists node; then
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    echo "Current Node.js version: v$NODE_VERSION"
    
    if [[ "$NODE_VERSION" != "22.15.1" ]]; then
        echo -e "${YELLOW}⚠ Node.js v22.15.1 required. Current: v$NODE_VERSION${NC}"
        read -p "Would you like to install Node.js v22.15.1? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_node
        else
            echo -e "${RED}Cannot continue without Node.js v22.15.1${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✓ Node.js v22.15.1 found${NC}"
    fi
else
    echo -e "${RED}Node.js not found${NC}"
    install_node
fi

# Install Yarn v4.1.0
echo ""
echo -e "${BLUE}Installing Yarn v4.1.0...${NC}"
corepack enable
corepack prepare yarn@4.1.0 --activate
echo -e "${GREEN}✓ Yarn v4.1.0 installed${NC}"

# Check Docker
echo ""
echo -e "${BLUE}Checking Docker...${NC}"
if ! command_exists docker; then
    echo -e "${RED}Docker not installed. Please install Docker first.${NC}"
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}Docker is not running or you don't have permissions.${NC}"
    echo "Try: sudo usermod -aG docker $USER"
    echo "Then log out and back in."
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"

# Check Docker Compose
echo ""
echo -e "${BLUE}Checking Docker Compose...${NC}"
if command_exists docker-compose; then
    echo -e "${GREEN}✓ Docker Compose found${NC}"
elif docker compose version >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Docker Compose (plugin) found${NC}"
    # Create alias for consistency
    alias docker-compose='docker compose'
else
    echo -e "${RED}Docker Compose not found. Installing...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
fi

# Clean up any existing containers
echo ""
echo -e "${BLUE}Cleaning up existing containers...${NC}"
docker-compose -f docker-compose.midnight.yml down 2>/dev/null || true
docker-compose down 2>/dev/null || true
echo -e "${GREEN}✓ Cleanup complete${NC}"

# Install backend dependencies
echo ""
echo -e "${BLUE}Installing backend dependencies...${NC}"
cd backend

# Create package-lock.json if it doesn't exist
if [ ! -f package-lock.json ]; then
    npm install
else
    npm ci
fi

# Verify critical Midnight SDK versions
echo "Verifying Midnight SDK versions..."
REQUIRED_VERSION="2.0.2"
for package in $(npm list --json | jq -r '.dependencies | keys[] | select(startswith("@midnight-ntwrk/midnight-js"))'); do
    installed_version=$(npm list "$package" --json | jq -r ".dependencies.\"$package\".version" 2>/dev/null)
    if [[ "$installed_version" != "$REQUIRED_VERSION" ]] && [[ "$installed_version" != "" ]]; then
        echo -e "${YELLOW}Updating $package to v$REQUIRED_VERSION${NC}"
        npm install "$package@$REQUIRED_VERSION"
    fi
done

cd ..
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Install frontend dependencies
echo ""
echo -e "${BLUE}Installing frontend dependencies...${NC}"
cd frontend

if [ ! -f package-lock.json ]; then
    npm install
else
    npm ci
fi

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
    echo -e "${GREEN}✓ Backend environment file created${NC}"
else
    echo -e "${YELLOW}Backend .env already exists${NC}"
fi

# Frontend .env
if [ ! -f frontend/.env ]; then
    cat > frontend/.env << 'EOF'
REACT_APP_API_URL=http://localhost:3000
REACT_APP_WS_URL=ws://localhost:8080
EOF
    echo -e "${GREEN}✓ Frontend environment file created${NC}"
else
    echo -e "${YELLOW}Frontend .env already exists${NC}"
fi

# Create necessary directories
echo ""
echo -e "${BLUE}Creating necessary directories...${NC}"
mkdir -p backend/logs
mkdir -p backend/.storage/wallets
mkdir -p backend/.storage/private-state
mkdir -p backend/.storage/contracts
mkdir -p storage
mkdir -p deploy/ssl
echo -e "${GREEN}✓ Directories created${NC}"

# Start Docker containers using Midnight compose file
echo ""
echo -e "${BLUE}Starting Docker containers...${NC}"
echo "Starting Midnight Proof Server, PostgreSQL, and Redis..."

docker-compose -f docker-compose.midnight.yml up -d proof-server postgres redis

# Wait for services to be ready
echo ""
echo -e "${BLUE}Waiting for services to be ready...${NC}"

# Wait for PostgreSQL
echo -n "Waiting for PostgreSQL..."
for i in {1..30}; do
    if docker exec sentinel-postgres pg_isready -U sentinel >/dev/null 2>&1; then
        echo -e " ${GREEN}Ready!${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Wait for Redis
echo -n "Waiting for Redis..."
for i in {1..30}; do
    if docker exec sentinel-redis redis-cli ping >/dev/null 2>&1; then
        echo -e " ${GREEN}Ready!${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Wait for Proof Server
echo -n "Waiting for Proof Server..."
for i in {1..60}; do
    if curl -f http://localhost:6301/health >/dev/null 2>&1; then
        echo -e " ${GREEN}Ready!${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# Verify services
echo ""
echo -e "${BLUE}Verifying services...${NC}"

# Check Proof Server
if curl -f http://localhost:6301/health >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Midnight Proof Server v4 is running on port 6301${NC}"
else
    echo -e "${RED}✗ Proof Server is not responding${NC}"
    echo "Check logs: docker logs sentinel-proof-server"
fi

# Check PostgreSQL
if docker exec sentinel-postgres pg_isready -U sentinel >/dev/null 2>&1; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
else
    echo -e "${RED}✗ PostgreSQL is not ready${NC}"
    echo "Check logs: docker logs sentinel-postgres"
fi

# Check Redis
if docker exec sentinel-redis redis-cli ping >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis is running${NC}"
else
    echo -e "${RED}✗ Redis is not responding${NC}"
    echo "Check logs: docker logs sentinel-redis"
fi

echo ""
echo "========================================="
echo -e "${GREEN}🎉 Repository Repair Complete!${NC}"
echo ""
echo "📋 Services Status:"
echo "  • Proof Server: http://localhost:6301"
echo "  • PostgreSQL: localhost:5432"
echo "  • Redis: localhost:6379"
echo ""
echo "📦 Next Steps:"
echo "  1. Start the backend:"
echo "     cd backend && npm start"
echo ""
echo "  2. Start the frontend (in another terminal):"
echo "     cd frontend && npm start"
echo ""
echo "  3. Or start everything with Docker:"
echo "     docker-compose -f docker-compose.midnight.yml up"
echo ""
echo "📍 Access Points:"
echo "  • Dashboard: http://localhost:3001"
echo "  • Backend API: http://localhost:3000"
echo "  • Proof Server: http://localhost:6301"
echo ""
echo -e "${BLUE}Run 'docker-compose -f docker-compose.midnight.yml logs -f' to view logs${NC}"
