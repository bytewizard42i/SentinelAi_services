import React, { useState } from 'react';

const SentinelDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminModalContent, setAdminModalContent] = useState('');
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [expertiseLevel, setExpertiseLevel] = useState('newbie'); // 'newbie' or 'expert'
  const [questionnaireStep, setQuestionnaireStep] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [tooltipContent, setTooltipContent] = useState({ title: '', description: '' });
  const [showEmergencyProtection, setShowEmergencyProtection] = useState(false);
  const [protectionAllocations, setProtectionAllocations] = useState({
    stablecoins: 60,
    gold: 20,
    bonds: 15,
    cash: 5
  });
  const [attackCount, setAttackCount] = useState(0);
  const [showMarketMetrics, setShowMarketMetrics] = useState(null); // 'downturn' or 'uptrend'
  
  // Admin settings for each page
  const [adminSettings, setAdminSettings] = useState({
    overview: {
      refreshInterval: 30,
      alertThreshold: 1000000,
      displayCurrency: 'USD'
    },
    watchdog: {
      anomalyThreshold: 15,
      maxTransactionSize: 100000,
      alertDelay: 5,
      circuitBreakerEnabled: true,
      suspiciousPatternDetection: true
    },
    guardian: {
      rebalanceThreshold: 5,
      marketVolatilityLimit: 30,
      autoRebalance: false,
      rebalanceFrequency: 'daily',
      slippageTolerance: 0.5
    },
    profiler: {
      minStablecoin: 20,
      maxStablecoin: 40,
      riskUpdateFrequency: 'weekly',
      autoAdjust: true,
      emergencyMode: false
    }
  });

  // Questionnaire questions based on expertise level
  const getQuestions = () => {
    if (expertiseLevel === 'newbie') {
      return [
        {
          question: "How comfortable are you with potential losses?",
          options: ["Very uncomfortable", "Somewhat uncomfortable", "Neutral", "Comfortable", "Very comfortable"]
        },
        {
          question: "What's your investment timeline?",
          options: ["Less than 1 month", "1-3 months", "3-6 months", "6-12 months", "Over 1 year"]
        },
        {
          question: "How often do you want to check your portfolio?",
          options: ["Multiple times daily", "Daily", "Weekly", "Monthly", "Rarely"]
        },
        {
          question: "What's most important to you?",
          options: ["Safety of funds", "Steady growth", "Balanced approach", "High growth", "Maximum returns"]
        },
        {
          question: "How would you react to a 20% drop in value?",
          options: ["Sell immediately", "Sell some", "Hold", "Buy a little more", "Buy significantly more"]
        }
      ];
    } else {
      // Expert questions
      return [
        {
          question: "Preferred Sharpe ratio target?",
          options: ["< 0.5", "0.5 - 1.0", "1.0 - 1.5", "1.5 - 2.0", "> 2.0"]
        },
        {
          question: "Maximum drawdown tolerance?",
          options: ["5%", "10%", "20%", "30%", "> 30%"]
        },
        {
          question: "Correlation preference for portfolio assets?",
          options: ["High positive", "Low positive", "Near zero", "Negative", "Mixed"]
        },
        {
          question: "Preferred rebalancing strategy?",
          options: ["Threshold-based", "Calendar-based", "Dynamic", "Volatility-triggered", "Hybrid"]
        },
        {
          question: "Position sizing methodology?",
          options: ["Equal weight", "Market cap", "Risk parity", "Kelly criterion", "Custom algorithm"]
        }
      ];
    }
  };

  const calculateRiskScore = () => {
    const answers = Object.values(userAnswers);
    const sum = answers.reduce((acc, val) => acc + val, 0);
    const maxScore = answers.length * 4;
    return Math.round((sum / maxScore) * 100);
  };

  const openAdminSettings = (section) => {
    setAdminModalContent(section);
    setShowAdminModal(true);
  };

  const updateAdminSetting = (section, key, value) => {
    setAdminSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  // Help text for admin settings
  const settingsHelpText = {
    overview: {
      refreshInterval: {
        title: "Refresh Interval",
        description: "Sets how often (in seconds) the dashboard data is refreshed. Lower values provide more real-time updates but may increase server load. Recommended: 30-60 seconds for normal operation, 5-10 seconds for high-frequency trading."
      },
      alertThreshold: {
        title: "Alert Threshold",
        description: "The treasury value threshold (in USD) that triggers notifications. When treasury value exceeds this amount, you'll receive alerts for significant changes. Set based on your treasury size - typically 10-20% of total value."
      },
      displayCurrency: {
        title: "Display Currency",
        description: "Choose the currency for displaying values across the dashboard. Options: USD, EUR, GBP, JPY, etc. This only affects display - all calculations remain in the base currency."
      }
    },
    watchdog: {
      anomalyThreshold: {
        title: "Anomaly Threshold",
        description: "The sensitivity score (0-100) for detecting unusual patterns. Lower values (10-20) detect more anomalies but may have false positives. Higher values (30-50) reduce noise but may miss subtle threats."
      },
      maxTransactionSize: {
        title: "Maximum Transaction Size",
        description: "The largest single transaction allowed (in USD) before requiring additional approval. This prevents large unauthorized withdrawals. Set to 2-5% of treasury for safety."
      },
      alertDelay: {
        title: "Alert Delay",
        description: "Time in minutes before sending duplicate alerts for the same issue. Prevents alert fatigue while ensuring important notifications aren't missed. Range: 5-30 minutes."
      },
      circuitBreakerEnabled: {
        title: "Circuit Breaker",
        description: "Emergency stop mechanism that halts all transactions when critical anomalies are detected. When enabled, protects against flash attacks and cascading failures. Highly recommended to keep ON."
      },
      suspiciousPatternDetection: {
        title: "Suspicious Pattern Detection",
        description: "AI-powered behavioral analysis that learns normal transaction patterns and flags deviations. Includes time-based patterns, amount clustering, and recipient analysis. Keep enabled for maximum security."
      }
    },
    guardian: {
      rebalanceThreshold: {
        title: "Rebalance Threshold",
        description: "Percentage deviation from target allocation that triggers rebalancing. Lower values (3-5%) maintain tighter allocations but increase trading. Higher values (10-15%) reduce costs but allow more drift."
      },
      marketVolatilityLimit: {
        title: "Market Volatility Limit",
        description: "Maximum acceptable market volatility (%) before pausing rebalancing. Prevents rebalancing during extreme market conditions. Typical range: 20-40% based on risk tolerance."
      },
      autoRebalance: {
        title: "Auto Rebalance",
        description: "Enables automatic portfolio rebalancing without manual approval. When ON, executes trades automatically based on strategy. When OFF, only suggests rebalancing actions for manual approval."
      },
      rebalanceFrequency: {
        title: "Rebalance Frequency",
        description: "How often to check and execute rebalancing. Options: hourly (aggressive), daily (balanced), weekly (conservative). More frequent = higher costs but tighter tracking."
      },
      slippageTolerance: {
        title: "Slippage Tolerance",
        description: "Maximum acceptable price slippage (%) during trades. Protects against unfavorable price movements during execution. Range: 0.1-1% for liquid assets, 1-3% for illiquid assets."
      }
    },
    profiler: {
      minStablecoin: {
        title: "Minimum Stablecoin %",
        description: "The minimum percentage of portfolio that must be held in stablecoins for safety. Acts as a buffer against market crashes. Conservative: 40-60%, Balanced: 20-40%, Aggressive: 10-20%."
      },
      maxStablecoin: {
        title: "Maximum Stablecoin %",
        description: "The maximum percentage allowed in stablecoins to ensure growth potential. Prevents over-conservative allocation. Conservative: 80%, Balanced: 60%, Aggressive: 40%."
      },
      riskUpdateFrequency: {
        title: "Risk Update Frequency",
        description: "How often to recalculate and update risk profiles based on market conditions and user behavior. Options: daily (responsive), weekly (balanced), monthly (stable)."
      },
      autoAdjust: {
        title: "Auto Adjust",
        description: "Automatically adjusts risk parameters based on market conditions and AI analysis. When enabled, provides dynamic risk management. Disable for manual control only."
      },
      emergencyMode: {
        title: "Emergency Mode",
        description: "Activates conservative emergency protocols: max stablecoin allocation, no risky trades, enhanced monitoring. Use during black swan events or system issues. Automatically suggests activation during crises."
      }
    }
  };

  const showHelpTooltip = (section, key) => {
    const helpInfo = settingsHelpText[section]?.[key];
    if (helpInfo) {
      setTooltipContent(helpInfo);
      setShowInfoTooltip(true);
    }
  };

  // Info Tooltip Component
  const InfoTooltip = () => {
    if (!showInfoTooltip) return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000
      }}>
        <div style={{
          backgroundColor: '#1a1f2e',
          padding: '30px',
          borderRadius: '12px',
          maxWidth: '500px',
          width: '90%',
          border: '2px solid #00ff88'
        }}>
          <h3 style={{color: '#00ff88', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px'}}>
            <span style={{fontSize: '1.5rem'}}>ℹ️</span> {tooltipContent.title}
          </h3>
          <p style={{color: '#ffffff', lineHeight: '1.6', marginBottom: '20px'}}>
            {tooltipContent.description}
          </p>
          <button
            onClick={() => setShowInfoTooltip(false)}
            style={{
              backgroundColor: '#00ff88',
              color: '#1a1f2e',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              width: '100%'
            }}
          >
            Got it!
          </button>
        </div>
      </div>
    );
  };

  // Admin Settings Modal Component
  const AdminSettingsModal = () => {
    if (!showAdminModal) return null;
    
    const currentSettings = adminSettings[adminModalContent];
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: '#1a1f2e',
          padding: '30px',
          borderRadius: '12px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          border: '2px solid #667eea'
        }}>
          <h2 style={{color: '#667eea', marginBottom: '20px'}}>
            ⚙️ Admin Settings - {adminModalContent.charAt(0).toUpperCase() + adminModalContent.slice(1)}
          </h2>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            {Object.entries(currentSettings || {}).map(([key, value]) => (
              <div key={key} style={{
                backgroundColor: '#242b3d',
                padding: '15px',
                borderRadius: '8px'
              }}>
                <label style={{
                  color: '#a0aec0', 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                  <button
                    onClick={() => showHelpTooltip(adminModalContent, key)}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid #667eea',
                      color: '#667eea',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      padding: 0,
                      marginLeft: '10px'
                    }}
                    title="Click for more information"
                  >
                    i
                  </button>
                </label>
                {typeof value === 'boolean' ? (
                  <button
                    onClick={() => updateAdminSetting(adminModalContent, key, !value)}
                    style={{
                      backgroundColor: value ? '#00ff88' : '#ff3366',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {value ? 'Enabled' : 'Disabled'}
                  </button>
                ) : typeof value === 'number' ? (
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => updateAdminSetting(adminModalContent, key, Number(e.target.value))}
                    style={{
                      backgroundColor: '#1a1f2e',
                      color: '#ffffff',
                      border: '1px solid #667eea',
                      padding: '8px',
                      borderRadius: '4px',
                      width: '100%'
                    }}
                  />
                ) : (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateAdminSetting(adminModalContent, key, e.target.value)}
                    style={{
                      backgroundColor: '#1a1f2e',
                      color: '#ffffff',
                      border: '1px solid #667eea',
                      padding: '8px',
                      borderRadius: '4px',
                      width: '100%'
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          
          <div style={{marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
            <button
              onClick={() => setShowAdminModal(false)}
              style={{
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Save & Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Questionnaire Modal Component
  const QuestionnaireModal = () => {
    if (!showQuestionnaire) return null;
    
    const questions = getQuestions();
    const currentQuestion = questions[questionnaireStep];
    
    if (questionnaireStep >= questions.length) {
      const riskScore = calculateRiskScore();
      let riskProfile = 'Conservative';
      if (riskScore > 70) riskProfile = 'Aggressive';
      else if (riskScore > 40) riskProfile = 'Balanced';
      
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1a1f2e',
            padding: '40px',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center',
            border: '2px solid #00ff88'
          }}>
            <h2 style={{color: '#00ff88', marginBottom: '20px'}}>📊 Profile Complete!</h2>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: '#242b3d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              fontSize: '3rem',
              fontWeight: 'bold',
              color: riskScore > 70 ? '#ff3366' : riskScore > 40 ? '#ffa500' : '#00ff88'
            }}>
              {riskScore}
            </div>
            <h3 style={{color: '#ffffff', marginBottom: '10px'}}>Your Risk Profile: {riskProfile}</h3>
            <p style={{color: '#a0aec0', marginBottom: '30px'}}>
              {riskProfile === 'Conservative' && "Focus on capital preservation with stable returns"}
              {riskProfile === 'Balanced' && "Balanced approach between growth and stability"}
              {riskProfile === 'Aggressive' && "High growth potential with increased volatility"}
            </p>
            <button
              onClick={() => {
                setShowQuestionnaire(false);
                setQuestionnaireStep(0);
                setUserAnswers({});
              }}
              style={{
                backgroundColor: '#00ff88',
                color: '#1a1f2e',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Apply Profile
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: '#1a1f2e',
          padding: '40px',
          borderRadius: '12px',
          maxWidth: '600px',
          width: '90%',
          border: '2px solid #667eea'
        }}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h2 style={{color: '#667eea'}}>Risk Profile Assessment</h2>
            <div style={{display: 'flex', gap: '10px'}}>
              <button
                onClick={() => setExpertiseLevel('newbie')}
                style={{
                  backgroundColor: expertiseLevel === 'newbie' ? '#00ff88' : '#242b3d',
                  color: expertiseLevel === 'newbie' ? '#1a1f2e' : '#a0aec0',
                  border: '1px solid #00ff88',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                👶 Newbie
              </button>
              <button
                onClick={() => setExpertiseLevel('expert')}
                style={{
                  backgroundColor: expertiseLevel === 'expert' ? '#ff3366' : '#242b3d',
                  color: expertiseLevel === 'expert' ? 'white' : '#a0aec0',
                  border: '1px solid #ff3366',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🎓 Expert
              </button>
            </div>
          </div>
          
          <div style={{marginBottom: '30px'}}>
            <div style={{display: 'flex', gap: '5px', marginBottom: '20px'}}>
              {questions.map((_, index) => (
                <div key={index} style={{
                  flex: 1,
                  height: '4px',
                  backgroundColor: index <= questionnaireStep ? '#667eea' : '#242b3d',
                  borderRadius: '2px'
                }}></div>
              ))}
            </div>
            <p style={{color: '#a0aec0', fontSize: '0.9rem'}}>
              Question {questionnaireStep + 1} of {questions.length}
            </p>
          </div>
          
          <h3 style={{color: '#ffffff', marginBottom: '20px'}}>{currentQuestion.question}</h3>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px'}}>
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  setUserAnswers({...userAnswers, [questionnaireStep]: index});
                  setTimeout(() => setQuestionnaireStep(questionnaireStep + 1), 200);
                }}
                style={{
                  backgroundColor: userAnswers[questionnaireStep] === index ? '#667eea' : '#242b3d',
                  color: '#ffffff',
                  border: '1px solid #667eea',
                  padding: '12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                {option}
              </button>
            ))}
          </div>
          
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            {questionnaireStep > 0 && (
              <button
                onClick={() => setQuestionnaireStep(questionnaireStep - 1)}
                style={{
                  backgroundColor: '#242b3d',
                  color: '#a0aec0',
                  border: '1px solid #667eea',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Back
              </button>
            )}
            <button
              onClick={() => {
                setShowQuestionnaire(false);
                setQuestionnaireStep(0);
                setUserAnswers({});
              }}
              style={{
                backgroundColor: '#ff3366',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginLeft: 'auto'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Component sections
  const Overview = () => (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <h2 style={{color: '#667eea'}}>Dashboard Overview</h2>
        <div style={{display: 'flex', gap: '10px'}}>
          <button
            onClick={() => {
              alert('Simulating login attack... Security protocols activated!');
            }}
            style={{
              backgroundColor: '#ff6b6b',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontWeight: 'bold'
            }}
          >
            🔓 Simulate Attack on Login
          </button>
          <button
            onClick={() => {
              alert('Showing market downturn indicators...');
            }}
            style={{
              backgroundColor: '#ff9f40',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontWeight: 'bold'
            }}
          >
            📉 Simulate Market Indicators for Downturn
          </button>
          <button
            onClick={() => openAdminSettings('overview')}
            style={{
              backgroundColor: '#764ba2',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            ⚙️ Admin Settings
          </button>
        </div>
      </div>

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
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <div>
          <h2 style={{color: '#667eea', marginBottom: '5px'}}>🛡️ Treasury Watchdog</h2>
          <p style={{color: '#a0aec0'}}>AI-powered anomaly detection for treasury security</p>
        </div>
        <div style={{display: 'flex', gap: '10px'}}>
          <button
            onClick={() => {
              setAttackCount(prev => prev + 1);
              alert(`🚨 Simulating attack #${attackCount + 1}! Watchdog detecting anomalies...`);
            }}
            style={{
              backgroundColor: '#ff0000',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontWeight: 'bold',
              boxShadow: '0 2px 10px rgba(255, 0, 0, 0.3)'
            }}
          >
            ⚡ Simulate Attack
          </button>
          <button
            onClick={() => {
              alert(`Total attacks simulated: ${attackCount}`);
            }}
            style={{
              backgroundColor: '#ff6600',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontWeight: 'bold'
            }}
          >
            🔢 Number of Attacks: {attackCount}
          </button>
          <button
            onClick={() => openAdminSettings('watchdog')}
            style={{
              backgroundColor: '#764ba2',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            ⚙️ Admin Settings
          </button>
        </div>
      </div>

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

  // Market Metrics Modal for Guardian
  const MarketMetricsModal = () => {
    if (!showMarketMetrics) return null;

    const isDownturn = showMarketMetrics === 'downturn';
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1400
      }}>
        <div style={{
          backgroundColor: '#1a1f2e',
          padding: '30px',
          borderRadius: '12px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          border: isDownturn ? '2px solid #ff3366' : '2px solid #00ff88'
        }}>
          <h2 style={{color: isDownturn ? '#ff3366' : '#00ff88', marginBottom: '20px'}}>
            {isDownturn ? '📉 Market Downturn Metrics' : '📈 Market Uptrend Metrics'}
          </h2>

          <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            <div style={{backgroundColor: '#242b3d', padding: '15px', borderRadius: '8px'}}>
              <h4 style={{color: '#ffffff', marginBottom: '10px'}}>Bitcoin (BTC)</h4>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span style={{color: '#a0aec0'}}>Price Impact:</span>
                <span style={{color: isDownturn ? '#ff3366' : '#00ff88', fontWeight: 'bold'}}>
                  {isDownturn ? '-15.3%' : '+12.7%'}
                </span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span style={{color: '#a0aec0'}}>Volume:</span>
                <span style={{color: '#ffffff'}}>{isDownturn ? '$45B' : '$67B'}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span style={{color: '#a0aec0'}}>RSI:</span>
                <span style={{color: '#ffffff'}}>{isDownturn ? '25' : '72'}</span>
              </div>
            </div>

            <div style={{backgroundColor: '#242b3d', padding: '15px', borderRadius: '8px'}}>
              <h4 style={{color: '#ffffff', marginBottom: '10px'}}>Ethereum (ETH)</h4>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span style={{color: '#a0aec0'}}>Price Impact:</span>
                <span style={{color: isDownturn ? '#ff3366' : '#00ff88', fontWeight: 'bold'}}>
                  {isDownturn ? '-18.9%' : '+15.2%'}
                </span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span style={{color: '#a0aec0'}}>Volume:</span>
                <span style={{color: '#ffffff'}}>{isDownturn ? '$23B' : '$34B'}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span style={{color: '#a0aec0'}}>RSI:</span>
                <span style={{color: '#ffffff'}}>{isDownturn ? '22' : '75'}</span>
              </div>
            </div>

            <div style={{backgroundColor: '#242b3d', padding: '15px', borderRadius: '8px'}}>
              <h4 style={{color: '#ffffff', marginBottom: '10px'}}>Market Indicators</h4>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
                <span style={{color: '#a0aec0'}}>Fear & Greed Index:</span>
                <span style={{color: isDownturn ? '#ff3366' : '#00ff88', fontWeight: 'bold'}}>
                  {isDownturn ? '12 (Extreme Fear)' : '78 (Extreme Greed)'}
                </span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
                <span style={{color: '#a0aec0'}}>Market Cap Change:</span>
                <span style={{color: isDownturn ? '#ff3366' : '#00ff88'}}>
                  {isDownturn ? '-$250B' : '+$180B'}
                </span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span style={{color: '#a0aec0'}}>Recommendation:</span>
                <span style={{color: '#ffa500', fontWeight: 'bold'}}>
                  {isDownturn ? 'Move to Stables' : 'Take Profits'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowMarketMetrics(null)}
            style={{
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              width: '100%',
              marginTop: '20px'
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  // Emergency Market Protection Modal
  const EmergencyProtectionModal = () => {
    if (!showEmergencyProtection) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.9)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1500
      }}>
        <div style={{
          backgroundColor: '#1a1f2e',
          padding: '30px',
          borderRadius: '12px',
          maxWidth: '600px',
          width: '90%',
          border: '3px solid #ff3366',
          boxShadow: '0 0 30px rgba(255, 51, 102, 0.3)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <span style={{fontSize: '2rem', marginRight: '10px'}}>🚨</span>
            <h2 style={{color: '#ff3366', margin: 0}}>Emergency Market Protection</h2>
          </div>

          <div style={{
            backgroundColor: '#2a0a15',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <button
              onClick={() => {
                alert('Emergency protection activated! All funds moved to safe assets.');
                setShowEmergencyProtection(false);
              }}
              style={{
                backgroundColor: '#ff3366',
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                borderRadius: '8px',
                fontSize: '1.2rem',
                cursor: 'pointer',
                width: '100%',
                fontWeight: 'bold',
                boxShadow: '0 4px 15px rgba(255, 51, 102, 0.4)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              🛡️ PROTECT ALL FUNDS
            </button>
            <p style={{color: '#ffa500', marginTop: '10px', fontSize: '0.9rem'}}>
              This will immediately move all assets to safe havens
            </p>
          </div>

          <div style={{marginBottom: '20px'}}>
            <h3 style={{color: '#ffffff', marginBottom: '15px'}}>Safe Asset Allocation</h3>
            
            <div style={{marginBottom: '15px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
                <span style={{color: '#a0aec0'}}>Stablecoins (USDC/USDT)</span>
                <span style={{color: '#00ff88', fontWeight: 'bold'}}>{protectionAllocations.stablecoins}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={protectionAllocations.stablecoins}
                onChange={(e) => setProtectionAllocations(prev => ({...prev, stablecoins: parseInt(e.target.value)}))}
                style={{width: '100%', accentColor: '#00ff88'}}
              />
            </div>

            <div style={{marginBottom: '15px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
                <span style={{color: '#a0aec0'}}>Gold-backed Tokens</span>
                <span style={{color: '#ffd700', fontWeight: 'bold'}}>{protectionAllocations.gold}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={protectionAllocations.gold}
                onChange={(e) => setProtectionAllocations(prev => ({...prev, gold: parseInt(e.target.value)}))}
                style={{width: '100%', accentColor: '#ffd700'}}
              />
            </div>

            <div style={{marginBottom: '15px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
                <span style={{color: '#a0aec0'}}>Treasury Bonds</span>
                <span style={{color: '#667eea', fontWeight: 'bold'}}>{protectionAllocations.bonds}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={protectionAllocations.bonds}
                onChange={(e) => setProtectionAllocations(prev => ({...prev, bonds: parseInt(e.target.value)}))}
                style={{width: '100%', accentColor: '#667eea'}}
              />
            </div>

            <div style={{marginBottom: '15px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
                <span style={{color: '#a0aec0'}}>Cash Reserves</span>
                <span style={{color: '#00bcd4', fontWeight: 'bold'}}>{protectionAllocations.cash}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={protectionAllocations.cash}
                onChange={(e) => setProtectionAllocations(prev => ({...prev, cash: parseInt(e.target.value)}))}
                style={{width: '100%', accentColor: '#00bcd4'}}
              />
            </div>

            <div style={{
              padding: '10px',
              backgroundColor: protectionAllocations.stablecoins + protectionAllocations.gold + protectionAllocations.bonds + protectionAllocations.cash === 100 
                ? '#0a2e0a' 
                : '#2e0a0a',
              borderRadius: '8px',
              marginTop: '10px'
            }}>
              <span style={{color: protectionAllocations.stablecoins + protectionAllocations.gold + protectionAllocations.bonds + protectionAllocations.cash === 100 ? '#00ff88' : '#ff3366'}}>
                Total: {protectionAllocations.stablecoins + protectionAllocations.gold + protectionAllocations.bonds + protectionAllocations.cash}%
                {protectionAllocations.stablecoins + protectionAllocations.gold + protectionAllocations.bonds + protectionAllocations.cash !== 100 && ' (Must equal 100%)'}
              </span>
            </div>
          </div>

          <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
            <button
              onClick={() => setShowEmergencyProtection(false)}
              style={{
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const Guardian = () => (
    <div>
      <div style={{marginBottom: '20px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
          <div>
            <h2 style={{color: '#667eea', marginBottom: '5px'}}>⚖️ Market Guardian</h2>
            <p style={{color: '#a0aec0'}}>Automated rebalancing based on market conditions</p>
          </div>
          <div style={{display: 'flex', gap: '10px'}}>
            <button
              onClick={() => setShowEmergencyProtection(true)}
              style={{
                backgroundColor: '#ff3366',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 'bold',
                boxShadow: '0 2px 10px rgba(255, 51, 102, 0.3)'
              }}
            >
              🚨 Emergency Market Protection
            </button>
            <button
              onClick={() => openAdminSettings('guardian')}
              style={{
                backgroundColor: '#764ba2',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              ⚙️ Admin Settings
            </button>
          </div>
        </div>
        
        {/* Market Simulation Buttons */}
        <div style={{display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '10px'}}>
          <button
            onClick={() => {
              alert('📉 Simulating market downturn... Guardian rebalancing to safe assets!');
            }}
            style={{
              backgroundColor: '#ff3366',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 'bold',
              fontSize: '0.95rem'
            }}
          >
            📉 Simulate Market Downturn
          </button>
          <button
            onClick={() => setShowMarketMetrics('downturn')}
            style={{
              backgroundColor: '#ff6666',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            title="View downturn metrics"
          >
            📊
          </button>
          <button
            onClick={() => {
              alert('📈 Simulating market uptrend... Guardian optimizing for growth!');
            }}
            style={{
              backgroundColor: '#00ff88',
              color: '#1a1f2e',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 'bold',
              fontSize: '0.95rem'
            }}
          >
            📈 Simulate Market Uptrend
          </button>
          <button
            onClick={() => setShowMarketMetrics('uptrend')}
            style={{
              backgroundColor: '#00cc70',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            title="View uptrend metrics"
          >
            📊
          </button>
        </div>
      </div>

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
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <div>
          <h2 style={{color: '#667eea', marginBottom: '5px'}}>👤 Risk Profiler</h2>
          <p style={{color: '#a0aec0'}}>Personalized allocation based on your risk tolerance</p>
        </div>
        <div style={{display: 'flex', gap: '10px'}}>
          <button
            onClick={() => setShowQuestionnaire(true)}
            style={{
              backgroundColor: '#00ff88',
              color: '#1a1f2e',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            🤖 Auto Profile Investor
          </button>
          <button
            onClick={() => openAdminSettings('profiler')}
            style={{
              backgroundColor: '#764ba2',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            ⚙️ Admin Settings
          </button>
        </div>
      </div>

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
      
      {/* Render Modals */}
      <AdminSettingsModal />
      <QuestionnaireModal />
      <InfoTooltip />
      <EmergencyProtectionModal />
      <MarketMetricsModal />
    </div>
  );
};

export default SentinelDashboard;
