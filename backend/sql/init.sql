-- PostgreSQL initialization script for SentinelAI

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS sentinelai;
\c sentinelai;

-- Create tables
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address VARCHAR(42) UNIQUE NOT NULL,
    did VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS risk_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    level VARCHAR(20) NOT NULL,
    risk_appetite INTEGER NOT NULL,
    min_stablecoin INTEGER NOT NULL,
    max_stablecoin INTEGER NOT NULL,
    rebalance_cooldown INTEGER NOT NULL,
    circuit_breaker_enabled BOOLEAN DEFAULT true,
    responses JSONB,
    flagged BOOLEAN DEFAULT false,
    flag_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS treasury_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_value DECIMAL(20, 8) NOT NULL,
    stablecoin_percentage DECIMAL(5, 2) NOT NULL,
    majors_percentage DECIMAL(5, 2) NOT NULL,
    altcoins_percentage DECIMAL(5, 2) NOT NULL,
    btc_price DECIMAL(10, 2),
    eth_price DECIMAL(10, 2),
    market_sentiment INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS anomaly_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    severity VARCHAR(20) NOT NULL,
    type VARCHAR(50) NOT NULL,
    score INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    metadata JSONB,
    status VARCHAR(20) DEFAULT 'active',
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rebalancing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    from_allocation JSONB NOT NULL,
    to_allocation JSONB NOT NULL,
    reason VARCHAR(100),
    market_conditions JSONB,
    success BOOLEAN DEFAULT true,
    transaction_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id VARCHAR(66) NOT NULL,
    user_id UUID REFERENCES users(id),
    description TEXT NOT NULL,
    anomaly_score INTEGER NOT NULL,
    required_approvals INTEGER DEFAULT 2,
    current_approvals INTEGER DEFAULT 0,
    approvers JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'pending',
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS action_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id VARCHAR(66) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    source_contract INTEGER NOT NULL,
    priority INTEGER NOT NULL,
    payload JSONB,
    status VARCHAR(20) NOT NULL,
    result BOOLEAN,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_address ON users(address);
CREATE INDEX idx_risk_profiles_user_id ON risk_profiles(user_id);
CREATE INDEX idx_anomaly_alerts_user_id ON anomaly_alerts(user_id);
CREATE INDEX idx_anomaly_alerts_status ON anomaly_alerts(status);
CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_action_logs_action_id ON action_logs(action_id);
CREATE INDEX idx_treasury_snapshots_created ON treasury_snapshots(created_at);

-- Create views
CREATE VIEW user_profiles AS
SELECT 
    u.id,
    u.address,
    u.did,
    rp.score as risk_score,
    rp.level as risk_level,
    rp.risk_appetite,
    rp.flagged,
    COUNT(DISTINCT aa.id) as active_alerts,
    COUNT(DISTINCT c.id) as pending_challenges
FROM users u
LEFT JOIN risk_profiles rp ON u.id = rp.user_id
LEFT JOIN anomaly_alerts aa ON u.id = aa.user_id AND aa.status = 'active'
LEFT JOIN challenges c ON u.id = c.user_id AND c.status = 'pending'
GROUP BY u.id, u.address, u.did, rp.score, rp.level, rp.risk_appetite, rp.flagged;

-- Create functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_risk_profiles_updated_at
    BEFORE UPDATE ON risk_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE sentinelai TO sentinel;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sentinel;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sentinel;
