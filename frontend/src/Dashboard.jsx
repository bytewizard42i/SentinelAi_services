import React, { useState } from 'react';

const SentinelDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Component sections
  const Overview = () => (
    <div>
      <h2 style={{color: '#667eea', marginBottom: '20px'}}>Dashboard Overview</h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          backgroundColor: '#242b3d',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{color: '#ffffff', marginBottom: '10px'}}>Treasury Value</h3>
          <div style={{fontSize: '2rem', fontWeight: 'bold', color: '#00ff88'}}>$1.0M</div>
          <div style={{color: '#a0aec0', fontSize: '0.9rem'}}>+2.3% 24h change</div>
        </div>

        <div style={{
          backgroundColor: '#242b3d',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{color: '#ffffff', marginBottom: '10px'}}>Risk Profile</h3>
          <div style={{fontSize: '2rem', fontWeight: 'bold', color: '#ffa500'}}>Balanced</div>
          <div style={{color: '#a0aec0', fontSize: '0.9rem'}}>65/100 score</div>
        </div>

        <div style={{
          backgroundColor: '#242b3d',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{color: '#ffffff', marginBottom: '10px'}}>Active Alerts</h3>
          <div style={{fontSize: '2rem', fontWeight: 'bold', color: '#ff3366'}}>0</div>
          <div style={{color: '#a0aec0', fontSize: '0.9rem'}}>No threats detected</div>
        </div>

        <div style={{
          backgroundColor: '#242b3d',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{color: '#ffffff', marginBottom: '10px'}}>Market Sentiment</h3>
          <div style={{fontSize: '2rem', fontWeight: 'bold', color: '#00ff88'}}>65%</div>
          <div style={{color: '#a0aec0', fontSize: '0.9rem'}}>Neutral conditions</div>
        </div>
      </div>
    </div>
  );

  const Watchdog = () => (
    <div>
      <h2 style={{color: '#667eea', marginBottom: '20px'}}>🛡️ Treasury Watchdog</h2>
      <p style={{color: '#a0aec0', marginBottom: '20px'}}>AI-powered anomaly detection for treasury security</p>

      <div style={{
        backgroundColor: '#242b3d',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{color: '#ffffff', marginBottom: '15px'}}>Security Status</h3>
        <div style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}>
          <span style={{color: '#00ff88', fontSize: '1.5rem', marginRight: '10px'}}>✓</span>
          <span style={{color: '#a0aec0'}}>No suspicious activity detected</span>
        </div>
        <p style={{color: '#a0aec0', fontSize: '0.9rem'}}>All transactions are within normal parameters</p>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px'}}>
        <div style={{
          backgroundColor: '#242b3d',
          padding: '15px',
          borderRadius: '8px'
        }}>
          <h4 style={{color: '#ffffff', marginBottom: '10px'}}>Transaction Patterns</h4>
          <div style={{marginBottom: '8px'}}>
            <span style={{color: '#a0aec0'}}>Average Size: </span>
            <span style={{color: '#00ff88'}}>$12,450</span>
          </div>
          <div style={{marginBottom: '8px'}}>
            <span style={{color: '#a0aec0'}}>Frequency: </span>
            <span style={{color: '#00ff88'}}>3.2/day</span>
          </div>
          <div>
            <span style={{color: '#a0aec0'}}>Anomaly Score: </span>
            <span style={{color: '#00ff88'}}>12/100</span>
          </div>
        </div>

        <div style={{
          backgroundColor: '#242b3d',
          padding: '15px',
          borderRadius: '8px'
        }}>
          <h4 style={{color: '#ffffff', marginBottom: '10px'}}>User Activity</h4>
          <div style={{marginBottom: '8px'}}>
            <span style={{color: '#a0aec0'}}>Active Users: </span>
            <span style={{color: '#00ff88'}}>24</span>
          </div>
          <div style={{marginBottom: '8px'}}>
            <span style={{color: '#a0aec0'}}>New Patterns: </span>
            <span style={{color: '#00ff88'}}>2</span>
          </div>
          <div>
            <span style={{color: '#a0aec0'}}>Risk Level: </span>
            <span style={{color: '#ffa500'}}>Medium</span>
          </div>
        </div>
      </div>
    </div>
  );

  const Guardian = () => (
    <div>
      <h2 style={{color: '#667eea', marginBottom: '20px'}}>⚖️ Market Guardian</h2>
      <p style={{color: '#a0aec0', marginBottom: '20px'}}>Automated rebalancing based on market conditions</p>

      <div style={{
        backgroundColor: '#242b3d',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{color: '#ffffff', marginBottom: '15px'}}>Market Overview</h3>
        <div style={{display: 'flex', gap: '30px', flexWrap: 'wrap'}}>
          <div>
            <div style={{color: '#a0aec0', marginBottom: '5px'}}>₿ Bitcoin</div>
            <div style={{color: '#ffffff', fontSize: '1.2rem', fontWeight: 'bold'}}>$45,000</div>
            <div style={{color: '#00ff88'}}>+2.4%</div>
          </div>
          <div>
            <div style={{color: '#a0aec0', marginBottom: '5px'}}>Ξ Ethereum</div>
            <div style={{color: '#ffffff', fontSize: '1.2rem', fontWeight: 'bold'}}>$3,000</div>
            <div style={{color: '#ff3366'}}>-1.2%</div>
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: '#242b3d',
        padding: '20px',
        borderRadius: '8px'
      }}>
        <h3 style={{color: '#ffffff', marginBottom: '15px'}}>Portfolio Allocation</h3>
        <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
              <span style={{color: '#a0aec0'}}>Stablecoins</span>
              <span style={{color: '#ffffff'}}>30%</span>
            </div>
            <div style={{
              height: '8px',
              backgroundColor: '#1a1f2e',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: '30%',
                height: '100%',
                backgroundColor: '#00ff88'
              }}></div>
            </div>
          </div>
          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
              <span style={{color: '#a0aec0'}}>Major Cryptos</span>
              <span style={{color: '#ffffff'}}>50%</span>
            </div>
            <div style={{
              height: '8px',
              backgroundColor: '#1a1f2e',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: '50%',
                height: '100%',
                backgroundColor: '#667eea'
              }}></div>
            </div>
          </div>
          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
              <span style={{color: '#a0aec0'}}>Altcoins</span>
              <span style={{color: '#ffffff'}}>20%</span>
            </div>
            <div style={{
              height: '8px',
              backgroundColor: '#1a1f2e',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: '20%',
                height: '100%',
                backgroundColor: '#764ba2'
              }}></div>
            </div>
          </div>
        </div>

        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#1a1f2e',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{color: '#00ff88', marginBottom: '10px'}}>🟢 Maintain Current Allocation</div>
          <p style={{color: '#a0aec0', fontSize: '0.9rem'}}>Market conditions are neutral - no rebalancing needed</p>
        </div>
      </div>
    </div>
  );

  const Profiler = () => (
    <div>
      <h2 style={{color: '#667eea', marginBottom: '20px'}}>👤 Risk Profiler</h2>
      <p style={{color: '#a0aec0', marginBottom: '20px'}}>Personalized allocation based on your risk tolerance</p>

      <div style={{
        backgroundColor: '#242b3d',
        padding: '30px',
        borderRadius: '8px',
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: '#1a1f2e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 15px auto',
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#ffa500'
        }}>
          65
        </div>
        <h3 style={{color: '#ffffff', marginBottom: '10px'}}>Your Risk Profile: Balanced</h3>
        <p style={{color: '#a0aec0'}}>Moderate risk/reward strategy</p>
      </div>

      <div style={{
        backgroundColor: '#242b3d',
        padding: '20px',
        borderRadius: '8px'
      }}>
        <h3 style={{color: '#ffffff', marginBottom: '15px'}}>Profile Settings</h3>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px'}}>
          <div style={{textAlign: 'center'}}>
            <div style={{color: '#a0aec0', fontSize: '0.9rem'}}>Risk Appetite</div>
            <div style={{color: '#ffffff', fontWeight: 'bold'}}>Moderate</div>
          </div>
          <div style={{textAlign: 'center'}}>
            <div style={{color: '#a0aec0', fontSize: '0.9rem'}}>Min Stablecoin</div>
            <div style={{color: '#ffffff', fontWeight: 'bold'}}>20%</div>
          </div>
          <div style={{textAlign: 'center'}}>
            <div style={{color: '#a0aec0', fontSize: '0.9rem'}}>Max Stablecoin</div>
            <div style={{color: '#ffffff', fontWeight: 'bold'}}>40%</div>
          </div>
          <div style={{textAlign: 'center'}}>
            <div style={{color: '#a0aec0', fontSize: '0.9rem'}}>Circuit Breaker</div>
            <div style={{color: '#00ff88', fontWeight: 'bold'}}>Enabled</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#0f1419',
      color: '#ffffff',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <header style={{
        backgroundColor: '#1a1f2e',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{color: '#667eea', margin: '0 0 5px 0'}}>🛡️ SentinelAI</h1>
          <span style={{color: '#a0aec0'}}>AI DAO Treasury Management</span>
        </div>
        <div style={{color: '#00ff88'}}>
          <span style={{marginRight: '5px'}}>●</span> Midnight Network
        </div>
      </header>

      <nav style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '30px',
        flexWrap: 'wrap'
      }}>
        <button
          style={{
            backgroundColor: activeTab === 'overview' ? '#667eea' : '#242b3d',
            color: activeTab === 'overview' ? 'white' : '#a0aec0',
            border: activeTab === 'overview' ? 'none' : '1px solid #667eea',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: activeTab === 'overview' ? 'bold' : 'normal'
          }}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          style={{
            backgroundColor: activeTab === 'watchdog' ? '#667eea' : '#242b3d',
            color: activeTab === 'watchdog' ? 'white' : '#a0aec0',
            border: activeTab === 'watchdog' ? 'none' : '1px solid #667eea',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: activeTab === 'watchdog' ? 'bold' : 'normal'
          }}
          onClick={() => setActiveTab('watchdog')}
        >
          Watchdog
        </button>
        <button
          style={{
            backgroundColor: activeTab === 'guardian' ? '#667eea' : '#242b3d',
            color: activeTab === 'guardian' ? 'white' : '#a0aec0',
            border: activeTab === 'guardian' ? 'none' : '1px solid #667eea',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: activeTab === 'guardian' ? 'bold' : 'normal'
          }}
          onClick={() => setActiveTab('guardian')}
        >
          Guardian
        </button>
        <button
          style={{
            backgroundColor: activeTab === 'profiler' ? '#667eea' : '#242b3d',
            color: activeTab === 'profiler' ? 'white' : '#a0aec0',
            border: activeTab === 'profiler' ? 'none' : '1px solid #667eea',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: activeTab === 'profiler' ? 'bold' : 'normal'
          }}
          onClick={() => setActiveTab('profiler')}
        >
          Profiler
        </button>
      </nav>

      <main style={{
        backgroundColor: '#1a1f2e',
        padding: '30px',
        borderRadius: '8px'
      }}>
        {activeTab === 'overview' && <Overview />}
        {activeTab === 'watchdog' && <Watchdog />}
        {activeTab === 'guardian' && <Guardian />}
        {activeTab === 'profiler' && <Profiler />}

        <div style={{
          backgroundColor: '#242b3d',
          padding: '30px',
          borderRadius: '8px',
          textAlign: 'center',
          marginTop: '30px'
        }}>
          <h3 style={{color: '#667eea', marginBottom: '15px'}}>
            🛡️ SentinelAI AI Governance System
          </h3>
          <p style={{color: '#a0aec0', marginBottom: '20px'}}>
            Complete Charles Hoskinson 3-Level AI Framework for DAO Treasury Management
          </p>
          <div style={{display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap'}}>
            <div 
              style={{
                backgroundColor: '#1a1f2e',
                padding: '15px',
                borderRadius: '8px',
                minWidth: '200px',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                border: activeTab === 'guardian' ? '2px solid #00ff88' : '2px solid transparent'
              }}
              onClick={() => setActiveTab('guardian')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 255, 136, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <h4 style={{color: '#00ff88', marginBottom: '8px'}}>Level 1: Strategic Planning</h4>
              <p style={{color: '#a0aec0', fontSize: '0.9rem'}}>Market Guardian AI</p>
            </div>
            <div 
              style={{
                backgroundColor: '#1a1f2e',
                padding: '15px',
                borderRadius: '8px',
                minWidth: '200px',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                border: activeTab === 'profiler' ? '2px solid #ffa500' : '2px solid transparent'
              }}
              onClick={() => setActiveTab('profiler')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 165, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <h4 style={{color: '#ffa500', marginBottom: '8px'}}>Level 2: Budget Estimation</h4>
              <p style={{color: '#a0aec0', fontSize: '0.9rem'}}>Risk Profiler AI</p>
            </div>
            <div 
              style={{
                backgroundColor: '#1a1f2e',
                padding: '15px',
                borderRadius: '8px',
                minWidth: '200px',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                border: activeTab === 'watchdog' ? '2px solid #667eea' : '2px solid transparent'
              }}
              onClick={() => setActiveTab('watchdog')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <h4 style={{color: '#667eea', marginBottom: '8px'}}>Level 3: Distribution Regulation</h4>
              <p style={{color: '#a0aec0', fontSize: '0.9rem'}}>Treasury Watchdog AI</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SentinelDashboard;
