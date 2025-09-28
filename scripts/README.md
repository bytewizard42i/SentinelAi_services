# 📁 scripts/ Directory

This directory contains all shell scripts for setup, maintenance, and deployment of the SentinelAI project.

## 📂 Script Categories

### 🚀 Setup Scripts
- `setup.sh` - Primary setup script for new installations
- `quick-setup.sh` - Fast setup for development environments
- `setup-midnight.sh` - Midnight Network specific setup

### 🔧 Maintenance Scripts
- `repair-and-setup.sh` - Fixes common issues and re-runs setup
- `fix-critical-issues.sh` - Critical issue resolution script
- `update-midnight-versions.sh` - Updates Midnight SDK versions

### 🧪 Testing Scripts
- `test-midnight-integration.sh` - End-to-end Midnight integration tests

### 📋 Deployment Scripts
- `prepare-deployment.sh` - Pre-deployment preparation and validation

## 🎯 Usage Examples

```bash
# Initial setup
./scripts/setup.sh

# Quick development setup
./scripts/quick-setup.sh

# Fix issues
./scripts/repair-and-setup.sh

# Update dependencies
./scripts/update-midnight-versions.sh

# Test integration
./scripts/test-midnight-integration.sh
```

## ⚠️ Important Notes

- All scripts require execution permissions: `chmod +x scripts/*.sh`
- Scripts may require sudo for system-level operations
- Always run scripts from the project root directory
- Check script output for any required manual interventions

## 🔧 Script Dependencies

Most scripts require:
- Docker and Docker Compose
- Node.js and Yarn
- Git
- Curl and other standard Unix tools

See individual script headers for specific requirements.
