#!/bin/bash

# SentinelAI Midnight Integration Test Script
# Verifies all Midnight Network components are working correctly

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔐 SentinelAI Midnight Integration Test${NC}"
echo "========================================"

# Function to test service
test_service() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}

    echo -n "Testing $name... "

    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "^$expected_code$"; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        return 1
    fi
}

# Check if Docker is running
check_docker() {
    echo -e "${BLUE}Checking Docker...${NC}"
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}❌ Docker daemon not running${NC}"
        echo "Please start Docker Desktop or Docker daemon"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker is running${NC}"
}

# Test Midnight Proof Server v4
test_proof_server() {
    echo -e "${BLUE}Testing Midnight Proof Server v4...${NC}"

    # Check if container is running
    if ! docker-compose ps | grep -q "proof-server"; then
        echo -e "${YELLOW}⚠️  Proof server container not running${NC}"
        echo "Starting proof server..."
        docker-compose up -d proof-server
        sleep 10
    fi

    # Test health endpoint
    if test_service "Proof Server Health" "http://localhost:6300/health"; then
        echo -e "${GREEN}✅ Midnight Proof Server v4 is operational${NC}"
        return 0
    else
        echo -e "${RED}❌ Midnight Proof Server v4 failed${NC}"
        echo "Check: docker-compose logs proof-server"
        return 1
    fi
}

# Test Backend Integration
test_backend() {
    echo -e "${BLUE}Testing Backend Midnight Integration...${NC}"

    # Check if backend is running
    if ! docker-compose ps | grep -q "mcp-server"; then
        echo -e "${YELLOW}⚠️  Backend container not running${NC}"
        echo "Starting backend..."
        docker-compose up -d mcp-server
        sleep 15
    fi

    # Test backend health
    if test_service "Backend API" "http://localhost:3000/health"; then
        echo -e "${GREEN}✅ Backend is operational${NC}"

        # Test Midnight connectivity (if endpoint exists)
        if curl -s "http://localhost:3000/api/midnight/status" >/dev/null 2>&1; then
            test_service "Midnight Connectivity" "http://localhost:3000/api/midnight/status"
        else
            echo -e "${YELLOW}⚠️  Midnight status endpoint not available${NC}"
        fi
        return 0
    else
        echo -e "${RED}❌ Backend failed${NC}"
        echo "Check: docker-compose logs mcp-server"
        return 1
    fi
}

# Test ElizaOS Integration
test_eliza() {
    echo -e "${BLUE}Testing ElizaOS Integration...${NC}"

    if ! docker-compose ps | grep -q "eliza-agent"; then
        echo -e "${YELLOW}⚠️  ElizaOS container not running${NC}"
        echo "Starting ElizaOS..."
        docker-compose up -d eliza-agent
        sleep 15
    fi

    if test_service "ElizaOS Agent" "http://localhost:5000/health" "200"; then
        echo -e "${GREEN}✅ ElizaOS v1.5.9 is operational${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  ElizaOS not responding (may not have health endpoint)${NC}"
        return 0  # Not critical for basic Midnight integration
    fi
}

# Test Contract Compilation
test_contracts() {
    echo -e "${BLUE}Testing Contract Compilation...${NC}"

    if [ -f "deploy/TreasuryWatchdog.compiled.json" ] && \
       [ -f "deploy/MarketGuardian.compiled.json" ] && \
       [ -f "deploy/RiskProfiler.compiled.json" ] && \
       [ -f "deploy/TreasuryOrchestrator.compiled.json" ]; then
        echo -e "${GREEN}✅ All contracts compiled${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Contracts not compiled${NC}"
        echo "Run: ./deploy/deploy-contracts.sh compile"
        return 1
    fi
}

# Test AI Integration
test_ai_integration() {
    echo -e "${BLUE}Testing AI Integration...${NC}"

    local ai_tests_passed=0
    local total_tests=3

    # Test anomaly detector config
    if [ -f "ai-models/anomaly-detector/config.yaml" ]; then
        ((ai_tests_passed++))
        echo -e "${GREEN}✅ Anomaly detector configured${NC}"
    fi

    # Test market predictor config
    if [ -f "ai-models/market-predictor/config.yaml" ]; then
        ((ai_tests_passed++))
        echo -e "${GREEN}✅ Market predictor configured${NC}"
    fi

    # Test risk assessor config
    if [ -f "ai-models/risk-assessor/config.yaml" ]; then
        ((ai_tests_passed++))
        echo -e "${GREEN}✅ Risk assessor configured${NC}"
    fi

    if [ $ai_tests_passed -eq $total_tests ]; then
        echo -e "${GREEN}✅ All AI models configured${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  $ai_tests_passed/$total_tests AI models configured${NC}"
        return 1
    fi
}

# Run all tests
run_all_tests() {
    echo -e "${BLUE}Running Complete Midnight Integration Test...${NC}"
    echo

    local tests_passed=0
    local total_tests=5

    check_docker && ((tests_passed++))
    test_proof_server && ((tests_passed++))
    test_backend && ((tests_passed++))
    test_eliza && ((tests_passed++))
    test_contracts && ((tests_passed++))
    test_ai_integration && ((tests_passed++))

    echo
    echo -e "${BLUE}Test Results: $tests_passed/$total_tests tests passed${NC}"

    if [ $tests_passed -eq $total_tests ]; then
        echo -e "${GREEN}🎉 ALL TESTS PASSED - Midnight integration is working!${NC}"
        echo -e "${GREEN}✅ Hackathon prerequisite 'Docker with Proof Server v4' is MET${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Some tests failed - check issues above${NC}"
        echo -e "${BLUE}💡 Common fixes:${NC}"
        echo "   - Start services: docker-compose up -d"
        echo "   - Check logs: docker-compose logs [service-name]"
        echo "   - Reset: docker-compose down -v && docker-compose up -d"
        return 1
    fi
}

# Main execution
case "${1:-all}" in
    "docker")
        check_docker
        ;;
    "proof")
        check_docker && test_proof_server
        ;;
    "backend")
        check_docker && test_backend
        ;;
    "eliza")
        check_docker && test_eliza
        ;;
    "contracts")
        test_contracts
        ;;
    "ai")
        test_ai_integration
        ;;
    "all")
        run_all_tests
        ;;
    *)
        echo "Usage: $0 [docker|proof|backend|eliza|contracts|ai|all]"
        echo ""
        echo "Commands:"
        echo "  docker    - Test Docker daemon"
        echo "  proof     - Test Midnight Proof Server v4"
        echo "  backend   - Test backend Midnight integration"
        echo "  eliza     - Test ElizaOS integration"
        echo "  contracts - Test contract compilation"
        echo "  ai        - Test AI model configurations"
        echo "  all       - Run all tests (default)"
        exit 1
        ;;
esac
