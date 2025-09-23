#!/bin/bash

# SentinelAI Quick Deploy Script
# Automates parts of the live deployment process

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 SentinelAI Live Deployment Script${NC}"
echo "=================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}Checking prerequisites...${NC}"

    local missing_deps=()

    if ! command_exists node; then
        missing_deps+=("Node.js")
    fi

    if ! command_exists npm; then
        missing_deps+=("npm")
    fi

    if ! command_exists git; then
        missing_deps+=("git")
    fi

    if [ ${#missing_deps[@]} -ne 0 ]; then
        echo -e "${RED}❌ Missing dependencies: ${missing_deps[*]}${NC}"
        echo "Please install missing dependencies and try again."
        exit 1
    fi

    echo -e "${GREEN}✅ All prerequisites met${NC}"
}

# Validate project structure
validate_project() {
    echo -e "${BLUE}Validating project structure...${NC}"

    local required_files=(
        "frontend/package.json"
        "backend/package.json"
        "netlify.toml"
        "deploy/deploy-contracts.sh"
        "README.md"
    )

    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            echo -e "${RED}❌ Missing required file: $file${NC}"
            exit 1
        fi
    done

    echo -e "${GREEN}✅ Project structure valid${NC}"
}

# Check if GitHub repo is set up
check_github() {
    echo -e "${BLUE}Checking GitHub repository...${NC}"

    if ! git remote get-url origin &>/dev/null; then
        echo -e "${YELLOW}⚠️  No GitHub remote found${NC}"
        echo "Please set up your GitHub repository:"
        echo "  git remote add origin https://github.com/yourusername/yourrepo.git"
        echo "  git push -u origin main"
        return 1
    fi

    local remote_url=$(git remote get-url origin)
    if [[ $remote_url == *"github.com"* ]]; then
        echo -e "${GREEN}✅ GitHub repository configured: $remote_url${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Remote is not GitHub: $remote_url${NC}"
        return 1
    fi
}

# Generate environment variables template
generate_env_template() {
    echo -e "${BLUE}Generating environment variables template...${NC}"

    cat > .env.production.template << 'EOF'
# SentinelAI Production Environment Variables
# Copy this to your deployment platforms

# ==========================================
# FRONTEND (Netlify/Vercel)
# ==========================================
REACT_APP_API_URL=https://your-backend-url.onrender.com
REACT_APP_WS_URL=wss://your-backend-url.onrender.com
REACT_APP_ENVIRONMENT=production

# Contract Addresses (after deployment)
REACT_APP_WATCHDOG_CONTRACT=0x0000000000000000000000000000000000000000
REACT_APP_GUARDIAN_CONTRACT=0x0000000000000000000000000000000000000000
REACT_APP_PROFILER_CONTRACT=0x0000000000000000000000000000000000000000
REACT_APP_ORCHESTRATOR_CONTRACT=0x0000000000000000000000000000000000000000

# ==========================================
# BACKEND (Render/Railway)
# ==========================================
NODE_ENV=production
PORT=10000

# Database (from Supabase)
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres

# Redis (from Upstash)
REDIS_URL=rediss://:[password]@usw1-[name]-[id].upstash.io:6379

# Security
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
SESSION_SECRET=your-session-secret-minimum-32-characters

# Midnight Network
MIDNIGHT_NODE_URL=https://midnight-testnet.hyperlane.com
PROOF_SERVER_URL=https://midnight-proof-server.hyperlane.com
MIDNIGHT_SDK_VERSION=2.0.2

# Optional: External APIs
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
COINGECKO_API_KEY=

# Logging
LOG_LEVEL=info

# WebSocket
WS_HEARTBEAT_INTERVAL=30000
EOF

    echo -e "${GREEN}✅ Environment template created: .env.production.template${NC}"
}

# Test local build
test_build() {
    echo -e "${BLUE}Testing local builds...${NC}"

    # Test frontend build
    echo "Testing frontend build..."
    if cd frontend && npm run build >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend build successful${NC}"
        cd ..
    else
        echo -e "${RED}❌ Frontend build failed${NC}"
        cd ..
        return 1
    fi

    # Test backend install
    echo "Testing backend dependencies..."
    if cd backend && npm install >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend dependencies installed${NC}"
        cd ..
    else
        echo -e "${RED}❌ Backend dependencies failed${NC}"
        cd ..
        return 1
    fi
}

# Generate deployment summary
generate_summary() {
    echo -e "${BLUE}Generating deployment summary...${NC}"

    cat > DEPLOYMENT_SUMMARY.md << 'EOF'
# 🚀 SentinelAI Deployment Summary

## 📋 Deployment Checklist

### ✅ Completed Locally:
- [x] Project structure validated
- [x] Frontend build tested
- [x] Backend dependencies checked
- [x] Environment template generated
- [x] Deployment guide created

### 🔄 Next Steps (Manual):

#### 1. Set Up Accounts:
- [ ] Netlify account: https://netlify.com
- [ ] Render account: https://render.com
- [ ] Supabase account: https://supabase.com
- [ ] Upstash account: https://upstash.com

#### 2. Database Setup:
- [ ] Create Supabase PostgreSQL project
- [ ] Run SQL migrations from `backend/sql/init.sql`
- [ ] Create Upstash Redis database
- [ ] Save connection URLs

#### 3. Backend Deployment:
- [ ] Deploy to Render with GitHub integration
- [ ] Set environment variables from template
- [ ] Verify backend URL works
- [ ] Test API endpoints

#### 4. Frontend Deployment:
- [ ] Deploy to Netlify with GitHub integration
- [ ] Set environment variables with backend URL
- [ ] Verify frontend loads
- [ ] Test API connectivity

#### 5. Contract Deployment:
- [ ] Deploy contracts to Midnight testnet
- [ ] Update frontend with contract addresses
- [ ] Test contract interactions

## 🌐 Expected URLs After Deployment:

- **Frontend:** https://[your-project].netlify.app
- **Backend:** https://[your-service].onrender.com
- **Database:** postgresql://... (Supabase)
- **Cache:** redis://... (Upstash)

## 🧪 Testing Commands:

```bash
# Test frontend
curl https://your-frontend.netlify.app

# Test backend
curl https://your-backend.onrender.com/health

# Test API
curl https://your-backend.onrender.com/api/risk/stats

# Test WebSocket (use online tester)
wss://your-backend.onrender.com/ws
```

## 📞 Support:

If you encounter issues:
1. Check deployment logs on each platform
2. Verify environment variables are set
3. Test locally first: `./setup.sh`
4. Check firewall/network settings

## 🎯 Success Criteria:

- [ ] Frontend loads without errors
- [ ] Risk quiz works and saves data
- [ ] Dashboard displays correctly
- [ ] WebSocket connections work
- [ ] All URLs are publicly accessible

---

**Happy Deploying! 🚀**
EOF

    echo -e "${GREEN}✅ Deployment summary created: DEPLOYMENT_SUMMARY.md${NC}"
}

# Main execution
main() {
    echo "This script will prepare your project for live deployment."
    echo ""

    check_prerequisites
    validate_project
    check_github
    generate_env_template
    test_build
    generate_summary

    echo ""
    echo -e "${GREEN}🎉 Pre-deployment preparation complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Follow DEPLOYMENT_SUMMARY.md"
    echo "2. Set up accounts on required platforms"
    echo "3. Deploy in order: Database → Backend → Frontend → Contracts"
    echo "4. Test everything works"
    echo "5. Record demo video"
    echo ""
    echo -e "${BLUE}Ready to deploy! 🚀${NC}"
}

# Run main function
main "$@"
