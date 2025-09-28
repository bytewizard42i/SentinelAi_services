# SentinelAI Makefile - Alice's Clean Toggle System
.PHONY: help proof-real proof-mock proof-logs proof-stop proof-status clean

help:
	@echo "SentinelAI Proof Server Management"
	@echo ""
	@echo "Available commands:"
	@echo "  make proof-real    - Start real Midnight proof server"
	@echo "  make proof-mock    - Start mock proof server (demo mode)"
	@echo "  make proof-logs    - View proof server logs"
	@echo "  make proof-stop    - Stop all proof servers"
	@echo "  make proof-status  - Check current proof server status"
	@echo "  make clean         - Clean up containers and processes"

proof-real:
	@echo "🚀 Starting REAL Midnight proof server..."
	@pkill -f mock-proof-server.js 2>/dev/null || true
	@docker compose -f docker-compose.profiles.yml --profile real up -d
	@sleep 3
	@echo "✅ Real proof server started on http://localhost:6300"
	@curl -s http://localhost:6300/health || echo "⏳ Server still starting..."

proof-mock:
	@echo "📦 Starting MOCK proof server (demo mode)..."
	@docker compose -f docker-compose.profiles.yml down 2>/dev/null || true
	@docker compose -f docker-compose.profiles.yml --profile mock up -d
	@sleep 3
	@echo "✅ Mock server started on http://localhost:6300"
	@curl -s http://localhost:6300/health || echo "⏳ Server still starting..."

proof-logs:
	@docker logs -f midnight-proof 2>/dev/null || docker logs -f mock-proof-server 2>/dev/null || echo "❌ No proof server running"

proof-stop:
	@echo "🛑 Stopping all proof servers..."
	@docker compose -f docker-compose.profiles.yml down
	@pm2 delete mock-proof-server 2>/dev/null || true
	@pkill -f mock-proof-server.js 2>/dev/null || true
	@echo "✅ All proof servers stopped"

proof-status:
	@echo "🔍 Checking proof server status..."
	@if curl -s http://localhost:6300/health | grep -q "mock-v4"; then \
		echo "📦 MOCK server running (demo mode)"; \
	elif curl -s http://localhost:6300/health > /dev/null 2>&1; then \
		echo "🚀 REAL Midnight proof server running"; \
	else \
		echo "❌ No proof server running on port 6300"; \
	fi

clean:
	@echo "🧹 Cleaning up..."
	@docker compose -f docker-compose.profiles.yml down -v
	@docker rm -f midnight-proof mock-proof-server 2>/dev/null || true
	@pkill -f mock-proof-server.js 2>/dev/null || true
	@echo "✅ Cleanup complete"

# Development shortcuts
dev: proof-mock
	@echo "Starting development environment with mock server..."
	cd frontend && npm start

prod: proof-real
	@echo "Starting production environment with real proof server..."
	cd frontend && npm start
