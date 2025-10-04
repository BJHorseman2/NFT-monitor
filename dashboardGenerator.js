const fs = require('fs').promises;
const path = require('path');
const OpenSeaMonitor = require('./openSeaMonitor');
require('dotenv').config();

class DashboardGenerator {
  constructor() {
    this.monitor = new OpenSeaMonitor(process.env.OPENSEA_API_KEY);
    this.outputDir = 'dashboard-reports';
    this.monitoringLogFile = 'monitoring-log.json';
  }

  async initialize() {
    await fs.mkdir(this.outputDir, { recursive: true });
  }

  async loadMonitoringHistory() {
    try {
      const data = await fs.readFile(this.monitoringLogFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return { alertHistory: [], highPriorityAlerts: [] };
    }
  }

  formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  formatPercent(value) {
    const num = parseFloat(value);
    const color = num > 0 ? '#00ff88' : '#ff4444';
    const arrow = num > 0 ? '▲' : '▼';
    return `<span style="color: ${color}">${arrow} ${Math.abs(num).toFixed(1)}%</span>`;
  }

  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  }

  calculateSessionStats(history) {
    const totalScans = history.alertHistory?.length || 0;
    const totalHighAlerts = history.highPriorityAlerts?.length || 0;
    const recentAlerts = history.alertHistory?.slice(-5) || [];
    const avgAlertsPerScan = totalScans > 0 ?
      (history.alertHistory.reduce((sum, scan) => sum + scan.totalAlerts, 0) / totalScans).toFixed(1) : 0;

    const firstScan = history.alertHistory?.[0]?.timestamp;
    const runningHours = firstScan ?
      ((new Date() - new Date(firstScan)) / (1000 * 60 * 60)).toFixed(1) : 0;

    return {
      totalScans,
      totalHighAlerts,
      recentAlerts,
      avgAlertsPerScan,
      runningHours
    };
  }

  generateHTML(data) {
    const {
      topMovers,
      alerts,
      trending,
      timestamp,
      summary,
      persistentWatchList,
      sessionStats,
      historicalAlerts
    } = data;

    const timeOfDay = this.getTimeOfDay();

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NFT Market Intelligence Report - Continuous Monitor</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
      background: #0a0b0d;
      color: #ffffff;
      line-height: 1.6;
    }

    .dashboard {
      max-width: 1200px;
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

    .session-info {
      background: #0f1114;
      padding: 20px 30px;
      border-bottom: 1px solid #2a2b2e;
      display: flex;
      justify-content: space-between;
      align-items: center;
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
      grid-template-columns: repeat(4, 1fr);
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
      align-items: center;
      justify-content: space-between;
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

    .watch-item.buy {
      border-left-color: #00ff88;
      background: linear-gradient(90deg, rgba(0,255,136,0.1) 0%, #0a0b0d 100%);
    }

    .watch-item.wait {
      border-left-color: #ffaa00;
      background: linear-gradient(90deg, rgba(255,170,0,0.1) 0%, #0a0b0d 100%);
    }

    .watch-item-info {
      flex: 1;
    }

    .watch-item-name {
      font-size: 14px;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 4px;
    }

    .watch-item-stats {
      font-size: 11px;
      color: #8892b0;
    }

    .watch-item-action {
      text-align: right;
    }

    .watch-item-score {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
    }

    .watch-item-recommendation {
      font-size: 10px;
      color: #00ff88;
      text-transform: uppercase;
      font-weight: 600;
      margin-top: 4px;
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

    .alert-time {
      font-size: 10px;
      color: #5a6278;
      margin-top: 4px;
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

    .timeline-section {
      background: #1a1b1e;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .timeline-header {
      font-size: 14px;
      color: #00ff88;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 15px;
      font-weight: 600;
    }

    .timeline-item {
      display: flex;
      align-items: start;
      margin-bottom: 15px;
      padding-left: 20px;
      position: relative;
    }

    .timeline-item:before {
      content: '';
      position: absolute;
      left: 0;
      top: 8px;
      width: 8px;
      height: 8px;
      background: #00ff88;
      border-radius: 50%;
    }

    .timeline-time {
      color: #8892b0;
      font-size: 11px;
      min-width: 100px;
      margin-right: 20px;
    }

    .timeline-content {
      flex: 1;
      font-size: 13px;
      color: #ffffff;
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

    @media (max-width: 768px) {
      .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .session-info {
        flex-direction: column;
        gap: 20px;
      }

      .collection-stats {
        flex-direction: column;
        gap: 5px;
      }
    }
  </style>
</head>
<body>
  <div class="dashboard">
    <div class="header">
      <h1>🔍 NFT Continuous Monitor Dashboard</h1>
      <div class="subtitle">${timeOfDay} Report - OpenSea Activity Monitor</div>
      <div class="timestamp">SCAN TIME: ${new Date(timestamp).toLocaleString()}</div>
    </div>

    <div class="session-info">
      <div class="session-stat">
        <div class="session-label">Running For</div>
        <div class="session-value">${sessionStats.runningHours}h</div>
      </div>
      <div class="session-stat">
        <div class="session-label">Total Scans</div>
        <div class="session-value">${sessionStats.totalScans}</div>
      </div>
      <div class="session-stat">
        <div class="session-label">High Priority Alerts</div>
        <div class="session-value">${sessionStats.totalHighAlerts}</div>
      </div>
      <div class="session-stat">
        <div class="session-label">Avg Alerts/Scan</div>
        <div class="session-value">${sessionStats.avgAlertsPerScan}</div>
      </div>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Active Alerts</div>
        <div class="metric-value">${alerts.high + alerts.medium}</div>
        <div class="metric-change">${alerts.high} Critical</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Collections Tracked</div>
        <div class="metric-value">${topMovers.length}</div>
        <div class="metric-change">${topMovers.filter(m => m.riskScore >= 60).length} High Risk</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Market Momentum</div>
        <div class="metric-value">${summary.momentum}</div>
        <div class="metric-change">${summary.trend}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Next Scan</div>
        <div class="metric-value">20min</div>
        <div class="metric-change">Automatic</div>
      </div>
    </div>

    ${persistentWatchList && persistentWatchList.length > 0 ? `
    <div class="section">
      <div class="watch-list">
        <div class="watch-list-title">🎯 HIGH PRIORITY WATCH LIST (PERSISTENT)</div>
        <div class="watch-list-grid">
          ${persistentWatchList.map(item => `
            <div class="watch-item ${item.action.toLowerCase()}">
              <div class="watch-item-info">
                <div class="watch-item-name">${item.collection}</div>
                <div class="watch-item-stats">First seen: ${new Date(item.firstSeen).toLocaleString()}</div>
              </div>
              <div class="watch-item-action">
                <div class="watch-item-score">${item.riskScore}</div>
                <div class="watch-item-recommendation">${item.action}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    ` : ''}

    ${summary.insights ? `
    <div class="section">
      <div class="summary-box">
        <div class="summary-title">Market Analysis</div>
        <div class="summary-content">${summary.insights}</div>
      </div>
    </div>
    ` : ''}

    <div class="section">
      <h2 class="section-title">
        <span>📊 Current Activity (Found ${topMovers.length} collections with unusual activity)</span>
        <span class="section-badge">LIVE</span>
      </h2>
      <div class="collection-grid">
        ${topMovers.slice(0, 10).map((mover, index) => `
          <div class="collection-card">
            <div class="collection-info">
              <div class="collection-name">${index + 1}. ${mover.collection}</div>
              <div class="collection-stats">
                <span>Floor: ${mover.floor} ETH</span>
                <span>24h Vol: ${this.formatNumber(mover.volume)} ETH</span>
                <span>Sales: ${this.formatNumber(mover.sales)}</span>
                ${mover.changePercent ? `<span>${this.formatPercent(mover.changePercent)}</span>` : ''}
              </div>
              ${mover.alerts && mover.alerts.length > 0 ? `
                <div style="margin-top: 10px;">
                  ${mover.alerts.slice(0, 2).map(alert => `
                    <div style="font-size: 11px; color: ${alert.severity === 'HIGH' ? '#ff4444' : '#ffaa00'}; margin-top: 4px;">
                      ${alert.severity === 'HIGH' ? '🔴' : '🟡'} ${alert.message}
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
            <div class="collection-action">
              <div class="risk-score">${mover.riskScore}</div>
              <div class="risk-label">Risk Score</div>
              <div class="action-badge action-${mover.action.toLowerCase()}">${mover.action}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    ${historicalAlerts && historicalAlerts.length > 0 ? `
    <div class="section">
      <h2 class="section-title">
        <span>📈 Recent Alert History</span>
        <span class="section-badge">${historicalAlerts.length} ALERTS</span>
      </h2>
      <div class="timeline-section">
        <div class="timeline-header">Last 5 Scans</div>
        ${historicalAlerts.slice(-5).reverse().map(scan => `
          <div class="timeline-item">
            <div class="timeline-time">${new Date(scan.timestamp).toLocaleTimeString()}</div>
            <div class="timeline-content">
              Found ${scan.totalAlerts} alerts (${scan.highPriorityCount} high priority)
              ${scan.alerts && scan.alerts.length > 0 ? `
                <div style="margin-top: 8px; font-size: 11px; color: #8892b0;">
                  ${scan.alerts.slice(0, 3).map(a => `• ${a.collection}: ${a.message}`).join('<br>')}
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    ${alerts.items && alerts.items.length > 0 ? `
    <div class="section">
      <h2 class="section-title">⚠️ Active Alerts</h2>
      <div class="alert-list">
        ${alerts.items.slice(0, 10).map(alert => `
          <div class="alert-item ${alert.severity.toLowerCase()}">
            <div class="alert-content">
              <div class="alert-title">${alert.collection}</div>
              <div class="alert-message">${alert.message}</div>
              ${alert.time ? `<div class="alert-time">${new Date(alert.time).toLocaleTimeString()}</div>` : ''}
            </div>
            <div class="alert-badge">${alert.type}</div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <div class="footer">
      <div class="footer-text">
        Continuous monitoring active since ${sessionStats.runningHours} hours ago.
        This dashboard updates every 20 minutes with fresh OpenSea data.
      </div>
      <div class="footer-text" style="margin-top: 20px; color: #00ff88;">
        Next automatic scan in 20 minutes
      </div>
      <div class="footer-text" style="margin-top: 10px; font-size: 10px; color: #5a6278;">
        High risk scores indicate unusual activity. BUY = Strong bullish signals | WAIT = Price volatility | WATCH = Monitor for confirmation
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  async generateDashboard() {
    console.log('Generating comprehensive dashboard...');

    try {
      // Load monitoring history
      const monitoringHistory = await this.loadMonitoringHistory();

      // Calculate session stats
      const sessionStats = this.calculateSessionStats(monitoringHistory);

      // Scan for unusual activity
      const unusual = await this.monitor.scanTopCollections(50);

      // Get trending collections
      const trending = await this.monitor.findTrendingCollections();

      // Process data for dashboard with more details
      const topMovers = unusual.map(item => ({
        collection: item.collection,
        riskScore: item.riskScore,
        floor: item.stats?.floorPrice?.toFixed(3) || 'N/A',
        volume: item.stats?.oneDayVolume || 0,
        sales: item.stats?.oneDaySales || 0,
        changePercent: item.stats?.oneDayChange || 0,
        action: item.recommendation.action,
        alerts: item.alerts
      }));

      const alertCount = {
        high: unusual.filter(u => u.alerts.some(a => a.severity === 'HIGH')).length,
        medium: unusual.filter(u => u.alerts.some(a => a.severity === 'MEDIUM')).length,
        items: unusual.flatMap(u => u.alerts.map(a => ({
          collection: u.collection,
          type: a.type,
          severity: a.severity,
          message: a.message,
          time: new Date().toISOString()
        }))).slice(0, 20)
      };

      // Get persistent watch list from monitoring history
      const persistentWatchList = monitoringHistory.highPriorityAlerts?.map(alert => ({
        collection: alert.collection,
        riskScore: alert.riskScore,
        action: alert.recommendation?.action || 'WATCH',
        firstSeen: alert.firstSeen
      })) || [];

      const summary = {
        momentum: unusual.length > 15 ? 'High' : unusual.length > 8 ? 'Medium' : 'Low',
        trend: unusual.filter(u => u.riskScore >= 60).length > 3 ? 'Bullish' : 'Neutral',
        insights: `Detected ${unusual.length} collections with unusual activity. ${alertCount.high} collections showing critical signals. ` +
                 `Monitor running for ${sessionStats.runningHours} hours with ${sessionStats.totalScans} scans completed. ` +
                 `Top focus: ${topMovers[0]?.collection || 'Various collections'} with risk score ${topMovers[0]?.riskScore || 'N/A'}.`
      };

      const dashboardData = {
        topMovers,
        alerts: alertCount,
        trending: trending.slice(0, 5),
        timestamp: new Date().toISOString(),
        summary,
        persistentWatchList,
        sessionStats,
        historicalAlerts: monitoringHistory.alertHistory || []
      };

      // Generate HTML
      const html = this.generateHTML(dashboardData);

      // Save to file
      const filename = `dashboard-${new Date().toISOString().split('T')[0]}-${new Date().getHours() < 12 ? 'morning' : 'evening'}.html`;
      const filepath = path.join(this.outputDir, filename);
      await fs.writeFile(filepath, html);

      console.log(`Comprehensive dashboard saved to: ${filepath}`);
      return { filepath, data: dashboardData };

    } catch (error) {
      console.error('Error generating dashboard:', error);
      throw error;
    }
  }
}

module.exports = DashboardGenerator;