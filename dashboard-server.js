// NFT Monitor Dashboard Server - Fixed Version
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
    console.log('📝 No monitoring data yet');
    return {
      lastUpdate: new Date().toISOString(),
      alertHistory: [],
      highPriorityAlerts: [],
      sessionStartTime: new Date().toISOString(),
      totalScans: 0,
      collectionsTracked: []
    };
  }
}

// Calculate time difference
function getTimeDiff(start) {
  const diff = Date.now() - new Date(start).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { hours, minutes, total: hours + (minutes / 60) };
}

// Generate dashboard HTML
function generateDashboard(data) {
  // Get latest scan data
  const latestScan = data.alertHistory?.[data.alertHistory.length - 1] || {};
  const alerts = latestScan.alerts || [];

  // Calculate stats
  const sessionStart = data.sessionStartTime || data.alertHistory?.[0]?.timestamp;
  const timeDiff = sessionStart ? getTimeDiff(sessionStart) : { hours: 0, minutes: 0, total: 0 };
  const runningTime = `${timeDiff.total.toFixed(1)}h`;

  const totalScans = data.totalScans || data.alertHistory?.length || 0;
  const highPriorityAlerts = data.highPriorityAlerts?.length || 0;
  const avgAlertsPerScan = totalScans > 0 ? (alerts.length / totalScans).toFixed(1) : '0';

  // Get unique collections from latest alerts
  const collections = {};
  alerts.forEach(alert => {
    if (!collections[alert.collection]) {
      collections[alert.collection] = {
        name: alert.collection,
        alerts: [],
        floor: alert.floor || 'N/A',
        volume24h: alert.volume24h || 0,
        sales: alert.sales || 0,
        riskScore: 40
      };
    }
    collections[alert.collection].alerts.push(alert);

    // Update risk score based on alert type
    if (alert.type === 'FLOOR_PUMP' && alert.message?.includes('8')) {
      collections[alert.collection].riskScore = 80;
    } else if (alert.type === 'SALES_SPIKE') {
      collections[alert.collection].riskScore = Math.max(collections[alert.collection].riskScore, 60);
    }
  });

  const collectionList = Object.values(collections).sort((a, b) => b.riskScore - a.riskScore);
  const criticalCount = collectionList.filter(c => c.riskScore >= 60).length;
  const highRiskCount = collectionList.filter(c => c.riskScore >= 80).length;

  // Format recent alert history
  const recentScans = data.alertHistory?.slice(-5).reverse() || [];

  // Get recommendation based on risk score
  function getRecommendation(score) {
    if (score >= 80) return 'BUY';
    if (score >= 60) return 'WAIT';
    return 'WATCH';
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NFT Continuous Monitor Dashboard</title>
  <meta http-equiv="refresh" content="60">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
      background: #0a0b0d;
      color: #ffffff;
      line-height: 1.6;
      padding: 20px;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      padding: 30px;
      background: linear-gradient(135deg, #1a1b1e 0%, #2a2b2e 100%);
      border-radius: 10px;
      border: 2px solid #00ff88;
      margin-bottom: 30px;
    }

    .header h1 {
      font-size: 32px;
      color: #00ff88;
      margin-bottom: 10px;
    }

    .subtitle {
      color: #8892b0;
      font-size: 14px;
      margin-bottom: 10px;
    }

    .scan-time {
      color: #ffffff;
      font-size: 16px;
      margin-bottom: 20px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
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
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #00ff88;
    }

    .stat-value.critical { color: #ff4444; }
    .stat-value.warning { color: #ffaa00; }

    .priority-section {
      background: linear-gradient(135deg, rgba(0, 255, 136, 0.05) 0%, #1a1b1e 100%);
      border: 2px solid #00ff88;
      padding: 25px;
      border-radius: 10px;
      margin-bottom: 30px;
    }

    .section-title {
      color: #00ff88;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 20px;
      font-weight: bold;
    }

    .priority-item {
      background: #0f1114;
      padding: 15px 20px;
      margin-bottom: 15px;
      border-radius: 8px;
      border-left: 4px solid #00ff88;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .priority-item.high-risk {
      border-left-color: #ff4444;
    }

    .collection-info h3 {
      font-size: 16px;
      color: #ffffff;
      margin-bottom: 5px;
    }

    .collection-meta {
      color: #8892b0;
      font-size: 12px;
    }

    .risk-badge {
      text-align: center;
    }

    .risk-score {
      font-size: 24px;
      font-weight: bold;
      color: #ffffff;
    }

    .recommendation {
      padding: 6px 12px;
      border-radius: 15px;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      margin-top: 8px;
      display: inline-block;
    }

    .rec-buy { background: #00ff88; color: #0a0b0d; }
    .rec-wait { background: #ffaa00; color: #0a0b0d; }
    .rec-watch { background: #8892b0; color: #0a0b0d; }

    .activity-section {
      background: #1a1b1e;
      padding: 25px;
      border-radius: 10px;
      margin-bottom: 30px;
    }

    .activity-header {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    }

    .activity-title {
      font-size: 20px;
      color: #ffffff;
      flex: 1;
    }

    .live-indicator {
      display: inline-block;
      padding: 5px 10px;
      background: rgba(0, 255, 136, 0.2);
      color: #00ff88;
      border-radius: 20px;
      font-size: 11px;
      font-weight: bold;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    .collection-item {
      background: #0f1114;
      padding: 20px;
      margin-bottom: 15px;
      border-radius: 8px;
      border-left: 4px solid #2a2b2e;
    }

    .collection-item.critical {
      border-left-color: #ff4444;
      background: linear-gradient(90deg, rgba(255,68,68,0.05) 0%, #0f1114 100%);
    }

    .collection-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 10px;
    }

    .collection-name {
      font-size: 18px;
      font-weight: bold;
      color: #ffffff;
    }

    .collection-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 10px;
      padding: 10px 0;
      border-top: 1px solid #2a2b2e;
      border-bottom: 1px solid #2a2b2e;
    }

    .collection-stat {
      text-align: center;
    }

    .stat-label-small {
      color: #8892b0;
      font-size: 10px;
      text-transform: uppercase;
    }

    .stat-value-small {
      color: #ffffff;
      font-size: 14px;
      font-weight: bold;
      margin-top: 2px;
    }

    .alert-tags {
      margin-top: 10px;
    }

    .alert-tag {
      display: inline-block;
      padding: 4px 10px;
      background: rgba(255, 68, 68, 0.1);
      color: #ff4444;
      border-radius: 12px;
      font-size: 11px;
      margin-right: 8px;
      margin-bottom: 5px;
    }

    .alert-tag.warning {
      background: rgba(255, 170, 0, 0.1);
      color: #ffaa00;
    }

    .history-section {
      background: #1a1b1e;
      padding: 25px;
      border-radius: 10px;
      margin-bottom: 30px;
    }

    .scan-history {
      margin-top: 20px;
    }

    .scan-item {
      padding: 15px;
      background: #0f1114;
      border-radius: 8px;
      margin-bottom: 10px;
      border-left: 3px solid #2a2b2e;
    }

    .scan-time {
      color: #00ff88;
      font-size: 13px;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .scan-summary {
      color: #8892b0;
      font-size: 12px;
      margin-bottom: 8px;
    }

    .scan-details {
      color: #ffffff;
      font-size: 11px;
      line-height: 1.6;
    }

    .footer {
      text-align: center;
      padding: 30px;
      color: #8892b0;
      font-size: 12px;
      line-height: 1.8;
    }

    .next-scan {
      background: #2a2b2e;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      margin: 30px 0;
      color: #00ff88;
      font-size: 14px;
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔍 NFT Continuous Monitor Dashboard</h1>
      <div class="subtitle">OpenSea Activity Monitor</div>
      <div class="scan-time">SCAN TIME: ${new Date(latestScan.timestamp || Date.now()).toLocaleString()}</div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">RUNNING FOR</div>
        <div class="stat-value">${runningTime}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">TOTAL SCANS</div>
        <div class="stat-value">${totalScans}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">HIGH PRIORITY ALERTS</div>
        <div class="stat-value warning">${highPriorityAlerts}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">AVG ALERTS/SCAN</div>
        <div class="stat-value">${avgAlertsPerScan}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">ACTIVE ALERTS</div>
        <div class="stat-value">${alerts.length}</div>
        <div style="color: #8892b0; font-size: 11px; margin-top: 5px;">${criticalCount} Critical</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">COLLECTIONS TRACKED</div>
        <div class="stat-value">${collectionList.length}</div>
        <div style="color: #8892b0; font-size: 11px; margin-top: 5px;">${highRiskCount} High Risk</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">MARKET MOMENTUM</div>
        <div class="stat-value">${criticalCount > 5 ? 'High' : criticalCount > 2 ? 'Medium' : 'Low'}</div>
        <div style="color: #8892b0; font-size: 11px; margin-top: 5px;">Neutral</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">NEXT SCAN</div>
        <div class="stat-value">20min</div>
        <div style="color: #8892b0; font-size: 11px; margin-top: 5px;">Automatic</div>
      </div>
    </div>

    ${data.highPriorityAlerts?.length > 0 ? `
    <div class="priority-section">
      <div class="section-title">🎯 HIGH PRIORITY WATCH LIST (PERSISTENT)</div>
      ${data.highPriorityAlerts.map(alert => `
        <div class="priority-item ${alert.riskScore >= 80 ? 'high-risk' : ''}">
          <div class="collection-info">
            <h3>${alert.collection}</h3>
            <div class="collection-meta">First seen: ${new Date(alert.firstSeen || Date.now()).toLocaleString()}</div>
          </div>
          <div class="risk-badge">
            <div class="risk-score">${alert.riskScore || 60}</div>
            <div class="recommendation rec-${(alert.recommendation || getRecommendation(alert.riskScore || 60)).toLowerCase()}">${alert.recommendation || getRecommendation(alert.riskScore || 60)}</div>
          </div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <div class="activity-section">
      <div class="activity-header">
        <div class="activity-title">📊 Current Activity (Found ${collectionList.length} collections with unusual activity)</div>
        <div class="live-indicator">LIVE</div>
      </div>

      ${collectionList.length > 0 ? collectionList.map((col, index) => `
        <div class="collection-item ${col.riskScore >= 60 ? 'critical' : ''}">
          <div class="collection-header">
            <div>
              <div class="collection-name">${index + 1}. ${col.name}</div>
            </div>
            <div class="risk-badge">
              <div class="risk-score">${col.riskScore}</div>
              <div style="color: #8892b0; font-size: 10px; text-transform: uppercase;">RISK SCORE</div>
              <div class="recommendation rec-${getRecommendation(col.riskScore).toLowerCase()}">${getRecommendation(col.riskScore)}</div>
            </div>
          </div>

          <div class="collection-stats">
            <div class="collection-stat">
              <div class="stat-label-small">Floor</div>
              <div class="stat-value-small">${col.floor} ETH</div>
            </div>
            <div class="collection-stat">
              <div class="stat-label-small">24h Vol</div>
              <div class="stat-value-small">${(col.volume24h || 0).toFixed(2)} ETH</div>
            </div>
            <div class="collection-stat">
              <div class="stat-label-small">Sales</div>
              <div class="stat-value-small">${col.sales >= 1000 ? (col.sales / 1000).toFixed(1) + 'K' : col.sales}</div>
            </div>
          </div>

          <div class="alert-tags">
            ${col.alerts.map(alert => `
              <span class="alert-tag ${alert.severity === 'HIGH' ? '' : 'warning'}">
                ${alert.type === 'FLOOR_PUMP' ? '🔴' : alert.type === 'FLOOR_DUMP' ? '🟡' : '🔴'} ${alert.message}
              </span>
            `).join('')}
          </div>
        </div>
      `).join('') : `
        <div class="no-data">
          <h2>🔄 Monitoring Active</h2>
          <p>Scanning OpenSea for unusual NFT activity...</p>
          <p>Data will appear when patterns are detected.</p>
        </div>
      `}
    </div>

    ${recentScans.length > 0 ? `
    <div class="history-section">
      <div class="activity-title">📈 Recent Alert History</div>
      <div style="color: #8892b0; font-size: 12px; margin-top: 5px;">${data.alertHistory?.length || 0} ALERTS</div>

      <div class="scan-history">
        <div style="color: #ffffff; font-size: 14px; margin-bottom: 15px; text-transform: uppercase;">LAST ${recentScans.length} SCANS</div>
        ${recentScans.map(scan => `
          <div class="scan-item">
            <div class="scan-time">${new Date(scan.timestamp).toLocaleTimeString()}</div>
            <div class="scan-summary">Found ${scan.alerts?.length || 0} alerts (${scan.highPriorityCount || 0} high priority)</div>
            <div class="scan-details">
              ${(scan.alerts || []).slice(0, 3).map(alert =>
                `• ${alert.collection}: ${alert.message}`
              ).join('<br>')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <div class="next-scan">
      ⚡ Next automatic scan in 20 minutes
    </div>

    <div class="footer">
      <p>Continuous monitoring active since ${sessionStart ? new Date(sessionStart).toLocaleString() : 'now'}.</p>
      <p>This dashboard updates every 20 minutes with fresh OpenSea data.</p>
      <p style="margin-top: 10px; color: #00ff88;">High risk scores indicate unusual activity. BUY = Strong bullish signals | WAIT = Price volatility | WATCH = Monitor for confirmation</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Main route
app.get('/', async (req, res) => {
  console.log(`Dashboard request from ${req.ip}`);

  const data = await loadMonitoringData();
  const dashboard = generateDashboard(data);
  res.send(dashboard);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║     🚀 NFT CONTINUOUS MONITOR DASHBOARD               ║
║                                                        ║
║     Port: ${PORT.toString().padEnd(44)}║
║     Status: ONLINE                                    ║
║     Dashboard: Auto-refreshes every 60 seconds        ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
});

// Handle shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});