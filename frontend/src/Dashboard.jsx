import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './dashboard.css';

// Import Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3000';

// WebSocket connection for real-time updates
let ws = null;

// Main Dashboard Component
const SentinelDashboard = () => {
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [userData, setUserData] = useState(null);
  const [treasuryData, setTreasuryData] = useState({
    totalValue: 1000000,
    allocation: {
      stablecoins: 30,
      majors: 50,
      altcoins: 20
    },
    performance: {
      day: 2.3,
      week: -1.5,
      month: 8.7
    }
  });
  
  const [watchdogAlerts, setWatchdogAlerts] = useState([]);
  const [marketData, setMarketData] = useState({
    btc: 45000,
    eth: 3000,
    marketSentiment: 65
  });
  
  const [riskProfile, setRiskProfile] = useState({
    score: 0,
    level: 'Not Set',
    settings: null
  });

  // WebSocket connection
  useEffect(() => {
    connectWebSocket();
    loadUserProfile();
    
    return () => {
      if (ws) ws.close();
    };
  }, []);

  const connectWebSocket = () => {
    ws = new WebSocket('ws://localhost:8080');
    
    ws.onopen = () => {
      console.log('Connected to SentinelAI WebSocket');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'init':
        if (data.data.treasury) setTreasuryData(data.data.treasury);
        if (data.data.alerts) setWatchdogAlerts(data.data.alerts);
        if (data.data.market) setMarketData(data.data.market);
        break;
      case 'action':
        // Handle orchestrator actions
        console.log('Orchestrator action:', data.data);
        break;
      case 'alert':
        setWatchdogAlerts(prev => [data.data, ...prev].slice(0, 10));
        break;
      case 'rebalance':
        setTreasuryData(data.data);
        break;
      default:
        break;
    }
  };

  const loadUserProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/api/profiler/profile`);
      const data = await response.json();
      setUserData(data);
      if (data.profile) {
        setRiskProfile(data.profile);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  // Chart configurations
  const portfolioChartData = {
    labels: ['Stablecoins', 'Major Cryptos', 'Altcoins'],
    datasets: [{
      data: [
        treasuryData.allocation.stablecoins,
        treasuryData.allocation.majors,
        treasuryData.allocation.altcoins
      ],
      backgroundColor: ['#00ff88', '#667eea', '#764ba2'],
      borderWidth: 0
    }]
  };

  const performanceChartData = {
    labels: ['1 Day', '1 Week', '1 Month'],
    datasets: [{
      label: 'Performance %',
      data: [
        treasuryData.performance.day,
        treasuryData.performance.week,
        treasuryData.performance.month
      ],
      backgroundColor: (context) => {
        const value = context.parsed.y;
        return value >= 0 ? '#00ff88' : '#ff3366';
      },
      borderColor: '#667eea',
      borderWidth: 2
    }]
  };

  const marketTrendData = {
    labels: ['12h', '10h', '8h', '6h', '4h', '2h', 'Now'],
    datasets: [{
      label: 'Market Sentiment',
      data: [58, 62, 65, 61, 68, 70, marketData.marketSentiment],
      fill: true,
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
      borderColor: '#667eea',
      tension: 0.4
    }]
  };

  // Component sections
  const Overview = () => (
    <div className="overview-section">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <h3>Total Treasury Value</h3>
            <span className="stat-badge positive">+{treasuryData.performance.day}%</span>
          </div>
          <div className="stat-value">${(treasuryData.totalValue / 1000000).toFixed(2)}M</div>
          <div className="stat-subtitle">24h Change: ${(treasuryData.totalValue * treasuryData.performance.day / 100).toFixed(0)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <h3>Risk Level</h3>
            <span className={`risk-badge ${riskProfile.level.toLowerCase()}`}>
              {riskProfile.level}
            </span>
          </div>
          <div className="stat-value">{riskProfile.score}/100</div>
          <div className="stat-subtitle">
            {riskProfile.level === 'Conservative' && 'Safety First Strategy'}
            {riskProfile.level === 'Balanced' && 'Moderate Risk/Reward'}
            {riskProfile.level === 'Aggressive' && 'High Growth Focus'}
            {riskProfile.level === 'Not Set' && 'Take Risk Assessment'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <h3>Active Alerts</h3>
            <span className="stat-badge alert">{watchdogAlerts.length}</span>
          </div>
          <div className="stat-value">{watchdogAlerts.filter(a => a.severity === 'critical').length} Critical</div>
          <div className="stat-subtitle">Last check: 2 minutes ago</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <h3>Market Guardian</h3>
            <span className="stat-badge active">Active</span>
          </div>
          <div className="stat-value">{marketData.marketSentiment}%</div>
          <div className="stat-subtitle">Market Sentiment Score</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Portfolio Allocation</h3>
          <Doughnut data={portfolioChartData} options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom' }
            }
          }} />
        </div>

        <div className="chart-card">
          <h3>Performance Overview</h3>
          <Bar data={performanceChartData} options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            }
          }} />
        </div>

        <div className="chart-card wide">
          <h3>Market Sentiment Trend</h3>
          <Line data={marketTrendData} options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            }
          }} />
        </div>
      </div>
    </div>
  );

  const Watchdog = () => (
    <div className="watchdog-section">
      <div className="section-header">
        <h2>🛡️ Treasury Watchdog</h2>
        <p>AI-powered anomaly detection for treasury security</p>
      </div>

      <div className="alerts-container">
        <div className="alerts-header">
          <h3>Recent Alerts</h3>
          <button className="btn-secondary">Clear All</button>
        </div>

        {watchdogAlerts.length === 0 ? (
          <div className="no-alerts">
            <span className="success-icon">✓</span>
            <p>No suspicious activity detected</p>
          </div>
        ) : (
          <div className="alerts-list">
            {watchdogAlerts.map((alert, index) => (
              <div key={index} className={`alert-item ${alert.severity}`}>
                <div className="alert-icon">
                  {alert.severity === 'critical' && '🚨'}
                  {alert.severity === 'warning' && '⚠️'}
                  {alert.severity === 'info' && 'ℹ️'}
                </div>
                <div className="alert-content">
                  <h4>{alert.title}</h4>
                  <p>{alert.description}</p>
                  <span className="alert-time">{alert.timestamp}</span>
                </div>
                <div className="alert-actions">
                  <button className="btn-small">Review</button>
                  {alert.severity === 'critical' && (
                    <button className="btn-small danger">Freeze</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="behavior-analysis">
        <h3>Behavioral Analysis</h3>
        <div className="analysis-grid">
          <div className="analysis-card">
            <h4>Transaction Patterns</h4>
            <div className="metric">
              <span className="label">Average Size:</span>
              <span className="value">$12,450</span>
            </div>
            <div className="metric">
              <span className="label">Frequency:</span>
              <span className="value">3.2/day</span>
            </div>
            <div className="metric">
              <span className="label">Anomaly Score:</span>
              <span className="value safe">12/100</span>
            </div>
          </div>

          <div className="analysis-card">
            <h4>User Activity</h4>
            <div className="metric">
              <span className="label">Active Users:</span>
              <span className="value">24</span>
            </div>
            <div className="metric">
              <span className="label">New Patterns:</span>
              <span className="value">2</span>
            </div>
            <div className="metric">
              <span className="label">Risk Level:</span>
              <span className="value medium">Medium</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const Guardian = () => (
    <div className="guardian-section">
      <div className="section-header">
        <h2>⚖️ Market Guardian</h2>
        <p>Automated rebalancing based on market conditions</p>
      </div>

      <div className="market-overview">
        <div className="market-stats">
          <div className="market-stat">
            <span className="coin-icon">₿</span>
            <div>
              <h4>Bitcoin</h4>
              <div className="price">${marketData.btc.toLocaleString()}</div>
              <span className="change positive">+2.4%</span>
            </div>
          </div>
          <div className="market-stat">
            <span className="coin-icon">Ξ</span>
            <div>
              <h4>Ethereum</h4>
              <div className="price">${marketData.eth.toLocaleString()}</div>
              <span className="change negative">-1.2%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rebalancing-section">
        <h3>Rebalancing Strategy</h3>
        <div className="strategy-cards">
          <div className="strategy-card">
            <h4>Current Allocation</h4>
            <div className="allocation-bars">
              <div className="allocation-bar">
                <span>Stablecoins</span>
                <div className="bar">
                  <div className="fill" style={{width: `${treasuryData.allocation.stablecoins}%`}}></div>
                </div>
                <span>{treasuryData.allocation.stablecoins}%</span>
              </div>
              <div className="allocation-bar">
                <span>Major Cryptos</span>
                <div className="bar">
                  <div className="fill" style={{width: `${treasuryData.allocation.majors}%`}}></div>
                </div>
                <span>{treasuryData.allocation.majors}%</span>
              </div>
              <div className="allocation-bar">
                <span>Altcoins</span>
                <div className="bar">
                  <div className="fill" style={{width: `${treasuryData.allocation.altcoins}%`}}></div>
                </div>
                <span>{treasuryData.allocation.altcoins}%</span>
              </div>
            </div>
          </div>

          <div className="strategy-card">
            <h4>Recommended Adjustment</h4>
            <div className="recommendation">
              {marketData.marketSentiment < 40 ? (
                <>
                  <span className="action sell">Increase Stablecoins</span>
                  <p>Market conditions suggest defensive positioning</p>
                </>
              ) : marketData.marketSentiment > 70 ? (
                <>
                  <span className="action buy">Increase Risk Assets</span>
                  <p>Favorable conditions for growth assets</p>
                </>
              ) : (
                <>
                  <span className="action hold">Maintain Current</span>
                  <p>Market conditions are neutral</p>
                </>
              )}
            </div>
            <button className="btn-primary">Execute Rebalancing</button>
          </div>
        </div>
      </div>
    </div>
  );

  const Profiler = () => (
    <div className="profiler-section">
      <div className="section-header">
        <h2>👤 Risk Profiler</h2>
        <p>Personalized allocation based on your risk tolerance</p>
      </div>

      {riskProfile.level === 'Not Set' ? (
        <div className="quiz-prompt">
          <h3>Complete Your Risk Assessment</h3>
          <p>Take our quick quiz to determine your optimal treasury allocation</p>
          <button 
            className="btn-primary large"
            onClick={() => window.location.href = '/risk-tolerance-quiz.html'}
          >
            Start Risk Assessment
          </button>
        </div>
      ) : (
        <div className="profile-details">
          <div className="profile-header">
            <div className="profile-score">
              <div className="score-circle">
                <span className="score">{riskProfile.score}</span>
                <span className="max">/100</span>
              </div>
            </div>
            <div className="profile-info">
              <h3>Your Risk Profile: {riskProfile.level}</h3>
              <p>Last updated: 2 days ago</p>
            </div>
          </div>

          {riskProfile.settings && (
            <div className="settings-grid">
              <div className="setting-card">
                <h4>Risk Appetite</h4>
                <div className="setting-value">{riskProfile.settings.riskAppetite}</div>
              </div>
              <div className="setting-card">
                <h4>Min Stablecoin %</h4>
                <div className="setting-value">{riskProfile.settings.minStablecoin}%</div>
              </div>
              <div className="setting-card">
                <h4>Max Stablecoin %</h4>
                <div className="setting-value">{riskProfile.settings.maxStablecoin}%</div>
              </div>
              <div className="setting-card">
                <h4>Rebalance Cooldown</h4>
                <div className="setting-value">{riskProfile.settings.rebalanceCooldown / 3600}h</div>
              </div>
              <div className="setting-card">
                <h4>Circuit Breaker</h4>
                <div className="setting-value">
                  {riskProfile.settings.circuitBreakerEnabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
            </div>
          )}

          <button className="btn-secondary">Update Profile</button>
        </div>
      )}
    </div>
  );

  // Main render
  return (
    <div className="sentinel-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo">
            <h1>🛡️ SentinelAI</h1>
            <span className="tagline">AI DAO Treasury Management</span>
          </div>
          <nav className="nav-tabs">
            <button 
              className={activeTab === 'overview' ? 'active' : ''}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={activeTab === 'watchdog' ? 'active' : ''}
              onClick={() => setActiveTab('watchdog')}
            >
              Watchdog
            </button>
            <button 
              className={activeTab === 'guardian' ? 'active' : ''}
              onClick={() => setActiveTab('guardian')}
            >
              Guardian
            </button>
            <button 
              className={activeTab === 'profiler' ? 'active' : ''}
              onClick={() => setActiveTab('profiler')}
            >
              Profiler
            </button>
          </nav>
          <div className="header-actions">
            <span className="connection-status connected">
              <span className="dot"></span> Midnight Network
            </span>
            <button className="btn-icon">⚙️</button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {activeTab === 'overview' && <Overview />}
        {activeTab === 'watchdog' && <Watchdog />}
        {activeTab === 'guardian' && <Guardian />}
        {activeTab === 'profiler' && <Profiler />}
      </main>
    </div>
  );
};

// Mount the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<SentinelDashboard />);

export default SentinelDashboard;
