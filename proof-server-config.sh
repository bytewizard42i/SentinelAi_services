#!/bin/bash

# SentinelAI Proof Server Configuration Script
# Implements Alice's dual-profile approach: Demo Mode vs Dev Mode

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

MODE=${1:-status}

show_status() {
    echo -e "${BLUE}🔍 Checking Proof Server Status...${NC}"
    
    # Check what's running on port 6300
    if lsof -i :6300 > /dev/null 2>&1; then
        RESPONSE=$(curl -s http://localhost:6300/health 2>/dev/null || echo "{}")
        if echo "$RESPONSE" | grep -q "mock-v4"; then
            echo -e "${YELLOW}📦 DEMO MODE ACTIVE${NC}"
            echo "  • Mock proof server running"
            echo "  • Port: 6300"
            echo "  • Server: HydraJTS Mock"
            echo "  • Status: Simulated proofs only"
        elif echo "$RESPONSE" | grep -q "midnight"; then
            echo -e "${GREEN}🚀 DEV MODE ACTIVE${NC}"
            echo "  • Real Midnight proof server running"
            echo "  • Port: 6300"
            echo "  • Server: Midnight Network v4.0.0"
            echo "  • Status: Real ZK proofs enabled"
        else
            echo -e "${RED}⚠️  Unknown server on port 6300${NC}"
            echo "Response: $RESPONSE"
        fi
    else
        echo -e "${RED}❌ No proof server running on port 6300${NC}"
    fi
}

switch_to_demo() {
    echo -e "${BLUE}🔄 Switching to DEMO MODE...${NC}"
    
    # Stop any Docker proof server
    docker stop midnight-proof-server 2>/dev/null || true
    docker rm midnight-proof-server 2>/dev/null || true
    
    # Kill existing processes on port 6300
    lsof -ti :6300 | xargs kill -9 2>/dev/null || true
    sleep 2
    
    # Start mock proof server
    echo "Starting mock proof server..."
    cd /home/js/utils_Midnight/utils_HydraJTS
    nohup node mock-proof-server.js > /tmp/mock-proof-server.log 2>&1 &
    
    sleep 3
    
    # Verify it's running
    if curl -s http://localhost:6300/health | grep -q "mock-v4"; then
        echo -e "${GREEN}✅ Demo mode activated successfully${NC}"
        echo "Mock server logs: /tmp/mock-proof-server.log"
    else
        echo -e "${RED}❌ Failed to start mock server${NC}"
    fi
    
    # Update backend .env
    sed -i 's|MIDNIGHT_PROOF_SERVER_URL=.*|MIDNIGHT_PROOF_SERVER_URL=http://localhost:6300|' /home/js/utils_Midnight/SentinelAi_services/SentinelAi_services-project/backend/.env
}

switch_to_dev() {
    echo -e "${BLUE}🔄 Switching to DEV MODE...${NC}"
    
    # Kill mock server
    pkill -f "mock-proof-server" 2>/dev/null || true
    lsof -ti :6300 | xargs kill -9 2>/dev/null || true
    sleep 2
    
    # Remove any existing containers
    docker stop midnight-proof-server 2>/dev/null || true
    docker rm midnight-proof-server 2>/dev/null || true
    
    # Start real Midnight proof server
    echo "Starting Midnight proof server v4.0.0..."
    docker run -d \
        --name midnight-proof-server \
        --restart unless-stopped \
        -p 6300:6300 \
        midnightnetwork/proof-server:4.0.0 \
        midnight-proof-server --network testnet
    
    # Wait for it to be ready
    echo "Waiting for proof server to start..."
    for i in {1..30}; do
        if curl -sf http://localhost:6300/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Dev mode activated successfully${NC}"
            docker logs midnight-proof-server --tail 5
            break
        fi
        sleep 2
        echo -n "."
    done
    
    # Update backend .env
    sed -i 's|MIDNIGHT_PROOF_SERVER_URL=.*|MIDNIGHT_PROOF_SERVER_URL=http://localhost:6300|' /home/js/utils_Midnight/SentinelAi_services/SentinelAi_services-project/backend/.env
}

case "$MODE" in
    status)
        show_status
        ;;
    demo)
        switch_to_demo
        ;;
    dev)
        switch_to_dev
        ;;
    *)
        echo "Usage: $0 {status|demo|dev}"
        echo ""
        echo "  status - Show current proof server status"
        echo "  demo   - Switch to mock proof server (Demo Mode)"
        echo "  dev    - Switch to real Midnight proof server (Dev Mode)"
        echo ""
        echo "Current status:"
        show_status
        exit 1
        ;;
esac

# Update the README to reflect current mode
if [ "$MODE" != "status" ]; then
    echo ""
    echo -e "${BLUE}📝 Updating documentation...${NC}"
    CURRENT_MODE=$([ "$MODE" = "demo" ] && echo "DEMO" || echo "DEV")
    echo "Current Mode: $CURRENT_MODE MODE" > /home/js/utils_Midnight/SentinelAi_services/SentinelAi_services-project/PROOF_SERVER_MODE.txt
    echo "Timestamp: $(date)" >> /home/js/utils_Midnight/SentinelAi_services/SentinelAi_services-project/PROOF_SERVER_MODE.txt
fi

echo ""
echo -e "${GREEN}Complete! Use './proof-server-config.sh status' to verify${NC}"
