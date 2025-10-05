// Premium NFT Monitor with Professional Dashboard
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Load monitoring data
async function loadMonitoringData() {
  try {
    const data = await fs.readFile('monitoring-log.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {
      lastUpdate: new Date().toISOString(),
      alertHistory: [],
      highPriorityAlerts: [],
      sessionStartTime: new Date().toISOString(),
      totalScans: 0
    };
  }
}

// Generate premium dashboard HTML
function generatePremiumDashboard(data) {
  const alerts = data.alertHistory || [];
  const highPriority = data.highPriorityAlerts || [];
  const lastUpdate = data.lastUpdate ? new Date(data.lastUpdate) : new Date();

  // Calculate session duration
  const sessionStart = new Date(data.sessionStartTime || Date.now());
  const sessionHours = ((Date.now() - sessionStart) / (1000 * 60 * 60)).toFixed(1);

  // Process collections
  const collections = {};
  const recentAlerts = [];

  alerts.forEach(alert => {
    if (!collections[alert.collection]) {
      collections[alert.collection] = {
        name: alert.collection,
        floor: alert.floor || '0.00',
        volume24h: alert.volume24h || '0',
        sales: alert.sales || 0,
        alerts: [],
        riskScore: alert.riskScore || 40,
        recommendation: alert.recommendation?.action || 'WATCH'
      };
    }
    collections[alert.collection].alerts.push({
      type: alert.type,
      message: alert.message,
      severity: alert.severity || 'medium'
    });

    if (recentAlerts.length < 10) {
      recentAlerts.push(alert);
    }
  });

  const topCollections = Object.values(collections)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 9);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NFT Market Intelligence Report</title>
  <meta http-equiv="refresh" content="120">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: #0a0b0d;
      color: #ffffff;
      line-height: 1.6;
    }

    .dashboard {
      max-width: 900px;
      margin: 0 auto;
      background: #0a0b0d;
    }

    .header {
      background: linear-gradient(135deg, #1a1b1e 0%, #2a2b2e 100%);
      padding: 30px;
      border-bottom: 2px solid #00ff88;
    }

    .header h1 {
      font-size: 24px;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }

    .header .subtitle {
      color: #8892b0;
      font-size: 14px;
    }

    .timestamp {
      color: #00ff88;
      font-size: 12px;
      margin-top: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .live-badge {
      display: inline-block;
      background: #00ff88;
      color: #0a0b0d;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: bold;
      margin-left: 10px;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    .session-info {
      background: #0f1114;
      padding: 20px 30px;
      border-bottom: 1px solid #2a2b2e;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }

    .session-stat {
      text-align: center;
    }

    .session-label {
      color: #8892b0;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 5px;
    }

    .session-value {
      font-size: 20px;
      font-weight: 700;
      color: #00ff88;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      padding: 30px;
      background: #0f1114;
    }

    .metric-card {
      background: #1a1b1e;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #2a2b2e;
      transition: transform 0.2s;
    }

    .metric-card:hover {
      transform: translateY(-2px);
      border-color: #00ff88;
    }

    .metric-label {
      color: #8892b0;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }

    .metric-value {
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 5px;
    }

    .metric-change {
      font-size: 13px;
      font-weight: 500;
      color: #00ff88;
    }

    .section {
      padding: 30px;
      background: #0f1114;
      border-top: 1px solid #1a1b1e;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #2a2b2e;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .section-badge {
      background: #00ff88;
      color: #0a0b0d;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .watch-list {
      background: linear-gradient(135deg, rgba(0, 255, 136, 0.05) 0%, #1a1b1e 100%);
      border: 2px solid #00ff88;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
    }

    .watch-list-title {
      color: #00ff88;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 15px;
      font-weight: 600;
    }

    .watch-list-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
    }

    .watch-item {
      background: #0a0b0d;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #00ff88;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .watch-item.high {
      border-left-color: #ff4444;
      background: linear-gradient(90deg, rgba(255,68,68,0.1) 0%, #0a0b0d 100%);
    }

    .alert-list {
      space-y: 15px;
    }

    .alert-item {
      background: #1a1b1e;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 12px;
      border-left: 4px solid #ff4444;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .alert-item.high {
      border-left-color: #ff4444;
      background: linear-gradient(90deg, rgba(255,68,68,0.1) 0%, #1a1b1e 100%);
    }

    .alert-item.medium {
      border-left-color: #ffaa00;
      background: linear-gradient(90deg, rgba(255,170,0,0.1) 0%, #1a1b1e 100%);
    }

    .alert-content {
      flex: 1;
    }

    .alert-title {
      font-size: 16px;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 4px;
    }

    .alert-message {
      font-size: 13px;
      color: #8892b0;
    }

    .alert-badge {
      background: rgba(255, 68, 68, 0.2);
      color: #ff4444;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .collection-grid {
      display: grid;
      gap: 15px;
    }

    .collection-card {
      background: #1a1b1e;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #2a2b2e;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.3s;
    }

    .collection-card:hover {
      border-color: #00ff88;
      transform: translateX(5px);
    }

    .collection-info {
      flex: 1;
    }

    .collection-name {
      font-size: 16px;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 8px;
    }

    .collection-stats {
      display: flex;
      gap: 20px;
      color: #8892b0;
      font-size: 13px;
    }

    .collection-alerts {
      margin-top: 10px;
    }

    .collection-alert {
      font-size: 11px;
      color: #ff4444;
      margin-top: 4px;
    }

    .collection-action {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .risk-score {
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 4px;
    }

    .risk-label {
      font-size: 11px;
      color: #8892b0;
      text-transform: uppercase;
    }

    .action-badge {
      margin-top: 10px;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .action-buy {
      background: #00ff88;
      color: #0a0b0d;
    }

    .action-watch {
      background: #ffaa00;
      color: #0a0b0d;
    }

    .action-wait {
      background: #8892b0;
      color: #0a0b0d;
    }

    .summary-box {
      background: linear-gradient(135deg, #1a1b1e 0%, #2a2b2e 100%);
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #00ff88;
      margin-bottom: 20px;
    }

    .summary-title {
      font-size: 14px;
      color: #00ff88;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }

    .summary-content {
      color: #ffffff;
      font-size: 15px;
      line-height: 1.6;
    }

    .footer {
      background: #1a1b1e;
      padding: 30px;
      text-align: center;
      border-top: 2px solid #00ff88;
    }

    .footer-text {
      color: #8892b0;
      font-size: 12px;
      margin-bottom: 10px;
    }

    @media (max-width: 600px) {
      .metrics-grid {
        grid-template-columns: 1fr;
      }
      .session-info {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  </style>
</head>
<body>
  <div class="dashboard">
    <div class="header">
      <h1>NFT Market Intelligence <span class="live-badge">LIVE</span></h1>
      <div class="subtitle">Professional Trading Dashboard - OpenSea Activity Monitor</div>
      <div class="timestamp">${lastUpdate.toLocaleString()}</div>
    </div>

    <div class="session-info">
      <div class="session-stat">
        <div class="session-label">Running For</div>
        <div class="session-value">${sessionHours}h</div>
      </div>
      <div class="session-stat">
        <div class="session-label">Total Scans</div>
        <div class="session-value">${data.totalScans || 0}</div>
      </div>
      <div class="session-stat">
        <div class="session-label">High Priority</div>
        <div class="session-value">${highPriority.length}</div>
      </div>
      <div class="session-stat">
        <div class="session-label">Collections</div>
        <div class="session-value">${topCollections.length}</div>
      </div>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Active Alerts</div>
        <div class="metric-value">${alerts.length}</div>
        <div class="metric-change">${alerts.filter(a => a.severity === 'HIGH').length} Critical</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Collections Tracked</div>
        <div class="metric-value">${topCollections.length}</div>
        <div class="metric-change">${topCollections.filter(c => c.riskScore > 60).length} High Risk</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Market Momentum</div>
        <div class="metric-value">${alerts.length > 10 ? 'High' : alerts.length > 5 ? 'Medium' : 'Low'}</div>
        <div class="metric-change">${alerts.length > 10 ? 'Bullish' : 'Neutral'}</div>
      </div>
    </div>

    ${highPriority.length > 0 ? `
    <div class="section">
      <div class="watch-list">
        <div class="watch-list-title">🎯 HIGH PRIORITY WATCH LIST (PERSISTENT)</div>
        <div class="watch-list-grid">
          ${highPriority.slice(0, 4).map(item => `
            <div class="watch-item ${item.riskScore > 60 ? 'high' : ''}">
              <div class="watch-item-info">
                <div class="watch-item-name">${item.collection}</div>
                <div class="watch-item-stats">Score: ${item.riskScore || 'N/A'}</div>
              </div>
              <div class="watch-item-action">
                <div class="watch-item-recommendation">${item.recommendation || 'WATCH'}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    ` : ''}

    <div class="section">
      <div class="summary-box">
        <div class="summary-title">Market Analysis</div>
        <div class="summary-content">
          Detected ${topCollections.length} collections with unusual activity.
          ${alerts.filter(a => a.severity === 'HIGH').length} collections showing critical signals requiring immediate attention.
          Market sentiment appears ${alerts.length > 10 ? 'highly active' : 'moderate'}.
          ${topCollections[0] ? ` Focus on ${topCollections[0].name}.` : ''}
        </div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">
        <span>🔥 High Priority Opportunities</span>
        <span class="section-badge">${topCollections.length} ACTIVE</span>
      </h2>
      <div class="collection-grid">
        ${topCollections.length > 0 ? topCollections.map((col, i) => `
          <div class="collection-card">
            <div class="collection-info">
              <div class="collection-name">${i + 1}. ${col.name}</div>
              <div class="collection-stats">
                <span>Floor: ${col.floor} ETH</span>
                <span>24h Vol: ${col.volume24h}</span>
                <span>Sales: ${col.sales.toLocaleString()}</span>
              </div>
              ${col.alerts.length > 0 ? `
                <div class="collection-alerts">
                  ${col.alerts.slice(0, 2).map(alert => `
                    <div class="collection-alert">
                      ${alert.severity === 'high' ? '🔴' : '🟡'} ${alert.message || alert.type}
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
            <div class="collection-action">
              <div class="risk-score">${col.riskScore}</div>
              <div class="risk-label">Risk Score</div>
              <div class="action-badge action-${col.recommendation.toLowerCase()}">${col.recommendation}</div>
            </div>
          </div>
        `).join('') : `
          <div class="summary-box">
            <div class="summary-content">
              🔄 The monitor is actively scanning OpenSea for unusual NFT activity.
              Data will appear here when interesting patterns are detected.
              The system scans every 20 minutes automatically.
            </div>
          </div>
        `}
      </div>
    </div>

    ${recentAlerts.length > 0 ? `
    <div class="section">
      <h2 class="section-title">⚠️ Active Alerts</h2>
      <div class="alert-list">
        ${recentAlerts.slice(0, 5).map(alert => `
          <div class="alert-item ${alert.severity === 'HIGH' ? 'high' : 'medium'}">
            <div class="alert-content">
              <div class="alert-title">${alert.collection}</div>
              <div class="alert-message">${alert.message}</div>
            </div>
            <div class="alert-badge">${alert.type}</div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <div class="footer">
      <div class="footer-text">
        This dashboard updates automatically every 2 minutes.
        NFT monitoring scans run every 20 minutes.
      </div>
      <div class="footer-text" style="margin-top: 20px; color: #00ff88;">
        System Status: ${process.env.OPENSEA_API_KEY ? '✅ Connected to OpenSea API' : '⚠️ Using cached data'}
      </div>
      <div class="footer-text" style="margin-top: 10px;">
        High risk scores indicate unusual activity that may present opportunities.
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Start monitoring in background
async function startMonitoring() {
  if (process.env.OPENSEA_API_KEY) {
    console.log('🚀 Starting NFT monitoring with OpenSea API...');
    try {
      const ContinuousMonitor = require('./continuousMonitor');
      const monitor = new ContinuousMonitor();
      await monitor.initialize();
      monitor.start().catch(console.error);
      console.log('✅ Monitor started successfully');
    } catch (error) {
      console.error('Monitor startup error:', error.message);
    }
  }
}

// Main route
app.get('/', async (req, res) => {
  const data = await loadMonitoringData();
  const dashboard = generatePremiumDashboard(data);
  res.send(dashboard);
});

// API endpoints
app.get('/api/data', async (req, res) => {
  const data = await loadMonitoringData();
  res.json(data);
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
async function main() {
  // Start monitoring if API key exists
  await startMonitoring();

  // Start web server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║   🚀 PREMIUM NFT DASHBOARD - LIVE                     ║
║   Port: ${PORT}                                          ║
║   Auto-refresh: Every 2 minutes                       ║
╚════════════════════════════════════════════════════════╝
    `);
  });
}

main().catch(console.error);