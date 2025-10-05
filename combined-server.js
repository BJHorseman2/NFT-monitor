// Combined NFT Monitor + Web Server
// This runs both the monitor AND serves the public dashboard

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const DashboardGenerator = require('./dashboardGenerator');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize services
const dashboardGen = new DashboardGenerator();

// Import and start monitor separately to avoid circular dependency
async function startMonitor() {
  console.log('🚀 Starting NFT monitor in background...');
  const ContinuousMonitor = require('./continuousMonitor');
  const monitor = new ContinuousMonitor();
  await monitor.initialize();

  // Start the scanning loop
  monitor.start().catch(err => {
    console.error('Monitor error (non-fatal):', err);
  });
}

// Serve static files
app.use(express.static('public'));

// Main dashboard route - anyone can access this!
app.get('/', async (req, res) => {
  try {
    console.log(`📊 Dashboard request from ${req.ip}`);

    // Generate fresh dashboard
    await dashboardGen.initialize();
    const { filepath } = await dashboardGen.generateDashboard();
    const content = await fs.readFile(filepath, 'utf8');

    res.send(content);

  } catch (error) {
    console.error('Error serving dashboard:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>NFT Market Intelligence</title>
        <style>
          body {
            background: #0a0b0d;
            color: #00ff88;
            font-family: monospace;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
          .container {
            text-align: center;
            padding: 40px;
          }
          h1 { font-size: 32px; margin-bottom: 20px; }
          p { color: #8892b0; font-size: 16px; }
          .stats {
            margin-top: 30px;
            padding: 20px;
            background: #1a1b1e;
            border-radius: 8px;
            border: 1px solid #00ff88;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔍 NFT Market Intelligence</h1>
          <p>Dashboard is updating with latest OpenSea data...</p>
          <div class="stats">
            <p>Monitoring: Active ✅</p>
            <p>Scan Interval: Every 20 minutes</p>
            <p>Please refresh in a moment</p>
          </div>
        </div>
      </body>
      </html>
    `);
  }
});

// API endpoint for latest data (JSON)
app.get('/api/latest', async (req, res) => {
  try {
    const logData = await fs.readFile('monitoring-log.json', 'utf8');
    const data = JSON.parse(logData);
    res.json({
      status: 'active',
      lastUpdate: data.lastUpdate,
      alertsCount: data.alertHistory?.length || 0,
      highPriority: data.highPriorityAlerts || [],
      message: 'NFT Monitor is actively scanning OpenSea'
    });
  } catch (error) {
    res.json({
      status: 'initializing',
      message: 'Monitor is starting up...'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    monitor: 'active',
    timestamp: new Date().toISOString()
  });
});

// Start everything
async function main() {
  // Start monitor
  await startMonitor();

  // Start web server
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║      🚀 NFT MARKET INTELLIGENCE SYSTEM ONLINE         ║
║                                                        ║
║      Public Dashboard: http://localhost:${PORT}           ║
║                                                        ║
║      Railway will provide public URL:                 ║
║      https://[your-app].railway.app                   ║
║                                                        ║
║      Anyone can view the dashboard!                   ║
║      Updates every 20 minutes automatically           ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
    `);
  });
}

main().catch(console.error);