-- SentinelAI Database Initialization Script
-- Creates all necessary tables for the demo

-- Treasury table
CREATE TABLE IF NOT EXISTS treasury (
    id SERIAL PRIMARY KEY,
    total_value DECIMAL(20, 2) DEFAULT 1000000.00,
    stablecoin_percentage INTEGER DEFAULT 30,
    major_crypto_percentage INTEGER DEFAULT 50,
    growth_asset_percentage INTEGER DEFAULT 20,
    last_rebalanced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attack simulations table
CREATE TABLE IF NOT EXISTS attack_simulations (
    id SERIAL PRIMARY KEY,
    attack_type VARCHAR(100),
    severity VARCHAR(50),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE
);

-- Market simulations table  
CREATE TABLE IF NOT EXISTS market_simulations (
    id SERIAL PRIMARY KEY,
    simulation_type VARCHAR(50),
    market_condition VARCHAR(50),
    allocation_before JSONB,
    allocation_after JSONB,
    simulated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    risk_score INTEGER,
    risk_profile VARCHAR(50),
    questionnaire_answers JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin settings table
CREATE TABLE IF NOT EXISTS admin_settings (
    id SERIAL PRIMARY KEY,
    section VARCHAR(50) NOT NULL,
    settings JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default treasury data
INSERT INTO treasury (total_value, stablecoin_percentage, major_crypto_percentage, growth_asset_percentage)
VALUES (1000000.00, 30, 50, 20)
ON CONFLICT DO NOTHING;

-- Insert default admin settings
INSERT INTO admin_settings (section, settings) VALUES 
('overview', '{"refreshInterval": 30, "alertThreshold": 1000000, "displayCurrency": "USD"}'),
('watchdog', '{"anomalyThreshold": 15, "maxTransactionSize": 100000, "alertDelay": 5, "circuitBreakerEnabled": true}'),
('guardian', '{"rebalanceThreshold": 5, "marketVolatilityLimit": 30, "autoRebalance": false}'),
('profiler', '{"minStablecoin": 20, "maxStablecoin": 40, "riskUpdateFrequency": "weekly"}')
ON CONFLICT DO NOTHING;
