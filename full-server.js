// Full NFT Monitor with Real-Time Data
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Import monitoring components
let monitoringData = {
  lastUpdate: new Date().toISOString(),
  alertHistory: [],
  highPriorityAlerts: [],
  sessionStartTime: new Date().toISOString(),
  totalScans: 0,
  collectionsTracked: []
};

// Start background monitoring
async function startMonitoring() {
  console.log('🚀 Starting NFT monitoring...');

  // Only start monitor if we have API key
  if (process.env.OPENSEA_API_KEY) {
    try {
      const ContinuousMonitor = require('./continuousMonitor');
      const monitor = new ContinuousMonitor();
      await monitor.initialize();

      // Start monitoring in background
      monitor.start().catch(err => {
        console.error('Monitor error (continuing):', err.message);
      });

      console.log('✅ Monitor started successfully');
    } catch (error) {
      console.error('Monitor startup error:', error.message);
    }
  } else {
    console.log('⚠️  No OpenSea API key - serving cached data only');
  }
}

// Load existing monitoring data
async function loadMonitoringData() {
  try {
    const data = await fs.readFile('monitoring-log.json', 'utf8');
    monitoringData = JSON.parse(data);
    console.log(`📊 Loaded monitoring data: ${monitoringData.alertHistory?.length || 0} alerts`);
  } catch (error) {
    console.log('📝 No existing monitoring data, starting fresh');
  }
}

// Generate HTML dashboard
function generateDashboard(data) {
  const alerts = data.alertHistory || [];
  const highPriority = data.highPriorityAlerts || [];
  const lastUpdate = data.lastUpdate ? new Date(data.lastUpdate).toLocaleString() : 'Never';

  // Get unique collections from alerts
  const collections = {};
  alerts.forEach(alert => {
    if (!collections[alert.collection]) {
      collections[alert.collection] = {
        name: alert.collection,
        alerts: [],
        riskScore: alert.riskScore || 40,
        recommendation: alert.recommendation?.action || 'WATCH'
      };
    }
    collections[alert.collection].alerts.push(alert);
  });

  const collectionList = Object.values(collections)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NFT Market Intelligence - Live Monitor</title>
  <meta http-equiv="refresh" content="60">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
      background: #0a0b0d;
      color: #ffffff;
      line-height: 1.6;
    }

    .dashboard {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .header {
      background: linear-gradient(135deg, #1a1b1e 0%, #2a2b2e 100%);
      padding: 30px;
      border-radius: 10px;
      border: 2px solid #00ff88;
      margin-bottom: 30px;
      text-align: center;
    }

    .header h1 {
      font-size: 32px;
      margin-bottom: 10px;
      color: #00ff88;
    }

    .timestamp {
      color: #8892b0;
      font-size: 14px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: #1a1b1e;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #2a2b2e;
      text-align: center;
    }

    .stat-label {
      color: #8892b0;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }

    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #00ff88;
    }

    .collections {
      background: #1a1b1e;
      padding: 25px;
      border-radius: 10px;
      margin-bottom: 30px;
    }

    .section-title {
      font-size: 20px;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #00ff88;
      color: #ffffff;
    }

    .collection-item {
      background: #0f1114;
      padding: 20px;
      margin-bottom: 15px;
      border-radius: 8px;
      border-left: 4px solid #00ff88;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .collection-item.high-risk {
      border-left-color: #ff4444;
      background: linear-gradient(90deg, rgba(255,68,68,0.1) 0%, #0f1114 100%);
    }

    .collection-info h3 {
      font-size: 18px;
      margin-bottom: 5px;
      color: #ffffff;
    }

    .collection-alerts {
      color: #8892b0;
      font-size: 13px;
      margin-top: 8px;
    }

    .alert-badge {
      background: rgba(255, 68, 68, 0.2);
      color: #ff4444;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      margin-right: 5px;
      display: inline-block;
    }

    .risk-score {
      text-align: center;
    }

    .risk-value {
      font-size: 32px;
      font-weight: bold;
      color: #ffffff;
    }

    .risk-label {
      font-size: 10px;
      color: #8892b0;
      text-transform: uppercase;
    }

    .recommendation {
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      margin-top: 10px;
    }

    .rec-buy { background: #00ff88; color: #0a0b0d; }
    .rec-watch { background: #ffaa00; color: #0a0b0d; }
    .rec-wait { background: #8892b0; color: #0a0b0d; }

    .watch-list {
      background: linear-gradient(135deg, rgba(0, 255, 136, 0.05) 0%, #1a1b1e 100%);
      border: 2px solid #00ff88;
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 30px;
    }

    .watch-list-title {
      color: #00ff88;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 15px;
      font-weight: bold;
    }

    .no-data {
      text-align: center;
      padding: 60px 20px;
      color: #8892b0;
    }

    .no-data h2 {
      color: #00ff88;
      margin-bottom: 20px;
    }

    .footer {
      text-align: center;
      padding: 30px;
      color: #8892b0;
      font-size: 12px;
    }

    .live-indicator {
      display: inline-block;
      width: 10px;
      height: 10px;
      background: #00ff88;
      border-radius: 50%;
      margin-right: 8px;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }

    .refresh-notice {
      background: #2a2b2e;
      padding: 10px;
      border-radius: 5px;
      text-align: center;
      margin-bottom: 20px;
      font-size: 13px;
      color: #00ff88;
    }
  </style>
</head>
<body>
  <div class="dashboard">
    <div class="header">
      <h1>🔍 NFT Market Intelligence</h1>
      <div class="timestamp">
        <span class="live-indicator"></span>
        LIVE - Last Update: ${lastUpdate}
      </div>
    </div>

    <div class="refresh-notice">
      ⚡ Auto-refreshes every 60 seconds | Monitor scans OpenSea every 20 minutes
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Active Alerts</div>
        <div class="stat-value">${alerts.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">High Priority</div>
        <div class="stat-value">${highPriority.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Collections Tracked</div>
        <div class="stat-value">${collectionList.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Scans</div>
        <div class="stat-value">${data.totalScans || 0}</div>
      </div>
    </div>

    ${highPriority.length > 0 ? `
    <div class="watch-list">
      <div class="watch-list-title">🎯 HIGH PRIORITY WATCH LIST</div>
      <div class="collections">
        ${highPriority.map(item => `
          <div class="collection-item high-risk">
            <div class="collection-info">
              <h3>${item.collection}</h3>
              <div class="collection-alerts">
                Risk Score: ${item.riskScore || 'N/A'} |
                Action: ${item.recommendation || 'WATCH'}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <div class="collections">
      <h2 class="section-title">📊 Collections with Unusual Activity</h2>

      ${collectionList.length > 0 ? collectionList.map((col, index) => `
        <div class="collection-item ${col.riskScore > 60 ? 'high-risk' : ''}">
          <div class="collection-info">
            <h3>${index + 1}. ${col.name}</h3>
            <div class="collection-alerts">
              ${col.alerts.slice(0, 2).map(alert =>
                `<span class="alert-badge">${alert.type || 'ALERT'}</span>`
              ).join('')}
              ${col.alerts.length > 2 ? `<span class="alert-badge">+${col.alerts.length - 2} more</span>` : ''}
            </div>
          </div>
          <div class="risk-score">
            <div class="risk-value">${col.riskScore}</div>
            <div class="risk-label">Risk Score</div>
            <div class="recommendation rec-${col.recommendation.toLowerCase()}">${col.recommendation}</div>
          </div>
        </div>
      `).join('') : `
        <div class="no-data">
          <h2>🔄 Monitoring Active</h2>
          <p>The system is scanning OpenSea for unusual NFT activity.</p>
          <p>Data will appear here when interesting patterns are detected.</p>
          <p>Scans run every 20 minutes.</p>
        </div>
      `}
    </div>

    <div class="footer">
      <p>NFT Market Intelligence System | Monitoring OpenSea 24/7</p>
      <p>Detecting volume spikes, floor movements, and whale activity</p>
      <p style="margin-top: 10px; color: #00ff88;">
        ${process.env.OPENSEA_API_KEY ? '✅ Connected to OpenSea' : '⚠️ Using cached data'}
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

// Main route
app.get('/', async (req, res) => {
  console.log(`Dashboard request from ${req.ip}`);

  // Reload latest monitoring data
  await loadMonitoringData();

  // Generate and send dashboard
  const dashboard = generateDashboard(monitoringData);
  res.send(dashboard);
});

// API endpoint for raw data
app.get('/api/data', async (req, res) => {
  await loadMonitoringData();
  res.json({
    success: true,
    data: monitoringData,
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    monitoring: process.env.OPENSEA_API_KEY ? 'active' : 'cached',
    timestamp: new Date().toISOString()
  });
});

// Start server
async function main() {
  console.log('🚀 NFT Market Intelligence System Starting...');

  // Load existing data
  await loadMonitoringData();

  // Start monitoring if API key exists
  if (process.env.OPENSEA_API_KEY) {
    await startMonitoring();
  }

  // Start web server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║     🚀 NFT MARKET INTELLIGENCE - FULL SYSTEM          ║
║                                                        ║
║     Port: ${PORT.toString().padEnd(44)}║
║     Status: ONLINE                                    ║
║     Dashboard: Auto-refreshes every 60 seconds        ║
║     Monitor: Scans OpenSea every 20 minutes           ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
    `);
  });
}

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});

// Start everything
main().catch(console.error);