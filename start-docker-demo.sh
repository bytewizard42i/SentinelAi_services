#!/bin/bash

# ==============================================================================
# 🚀 SentinelAI One-Button Docker Launcher
# ==============================================================================
# This script starts the entire SentinelAI demo stack with a single command
# No dependencies needed except Docker!
# ==============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Banner
echo -e "${PURPLE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║             🛡️  SentinelAI Services v2.1  🛡️                    ║"
echo "║         AI-Powered DAO Treasury Management                    ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if Docker is installed
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    # Try docker compose (newer version)
    if ! docker compose version &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose.${NC}"
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

echo -e "${GREEN}✅ Docker is installed${NC}"

# Stop any existing containers
echo -e "${YELLOW}🔄 Stopping any existing containers...${NC}"
$COMPOSE_CMD -f docker-compose.all-in-one.yml down 2>/dev/null || true

# Pull latest images
echo -e "${YELLOW}📦 Pulling latest Docker images...${NC}"
$COMPOSE_CMD -f docker-compose.all-in-one.yml pull

# Start the stack
echo -e "${YELLOW}🚀 Starting SentinelAI Services...${NC}"
$COMPOSE_CMD -f docker-compose.all-in-one.yml up -d

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 5

# Check service health
echo -e "${YELLOW}🔍 Checking service health...${NC}"

# Check backend
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health | grep -q "200"; then
    echo -e "${GREEN}✅ Backend API is running${NC}"
else
    echo -e "${YELLOW}⚠️  Backend is still starting...${NC}"
fi

# Check frontend
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 | grep -q "200"; then
    echo -e "${GREEN}✅ Frontend Dashboard is running${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend is still starting...${NC}"
fi

# Check proof server
if curl -s http://localhost:6300/health 2>/dev/null | grep -q "healthy"; then
    echo -e "${GREEN}✅ Proof Server is running${NC}"
else
    echo -e "${YELLOW}⚠️  Proof Server is still starting...${NC}"
fi

# Display access information
echo ""
echo -e "${PURPLE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║                     🎉 Setup Complete! 🎉                      ║${NC}"
echo -e "${PURPLE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 Access the Dashboard:${NC}"
echo -e "   ${GREEN}http://localhost:3001${NC}"
echo ""
echo -e "${BLUE}🔗 Service URLs:${NC}"
echo -e "   Frontend:     ${GREEN}http://localhost:3001${NC}"
echo -e "   Backend API:  ${GREEN}http://localhost:3000${NC}"
echo -e "   Proof Server: ${GREEN}http://localhost:6300${NC}"
echo -e "   Nginx Proxy:  ${GREEN}http://localhost${NC}"
echo ""
echo -e "${BLUE}📝 Available Features:${NC}"
echo -e "   • Market Simulations with animated allocations"
echo -e "   • Attack simulations with counter"
echo -e "   • Emergency Protection modal"
echo -e "   • Risk Profiler questionnaire"
echo -e "   • Admin settings with help tooltips"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo -e "   • View logs:     ${PURPLE}$COMPOSE_CMD -f docker-compose.all-in-one.yml logs -f${NC}"
echo -e "   • Stop services: ${PURPLE}$COMPOSE_CMD -f docker-compose.all-in-one.yml down${NC}"
echo -e "   • Restart:       ${PURPLE}$COMPOSE_CMD -f docker-compose.all-in-one.yml restart${NC}"
echo ""
echo -e "${GREEN}🚀 SentinelAI is ready for demo!${NC}"
