const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const DashboardGenerator = require('./dashboardGenerator');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize dashboard generator
const dashboardGen = new DashboardGenerator();

// Serve static files
app.use(express.static('public'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Main dashboard route
app.get('/', async (req, res) => {
  try {
    // Check if recent dashboard exists (less than 5 minutes old)
    const dashboardPath = path.join(__dirname, 'dashboard-reports');
    const files = await fs.readdir(dashboardPath).catch(() => []);

    const recentFile = files
      .filter(f => f.endsWith('.html'))
      .sort()
      .pop();

    if (recentFile) {
      const filePath = path.join(dashboardPath, recentFile);
      const stats = await fs.stat(filePath);
      const ageMinutes = (Date.now() - stats.mtime) / 1000 / 60;

      // If dashboard is less than 5 minutes old, serve it
      if (ageMinutes < 5) {
        const content = await fs.readFile(filePath, 'utf8');
        return res.send(content);
      }
    }

    // Generate fresh dashboard
    console.log('Generating fresh dashboard for visitor...');
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
        <title>NFT Monitor - Temporarily Unavailable</title>
        <style>
          body {
            background: #0a0b0d;
            color: #fff;
            font-family: monospace;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
          .error {
            text-align: center;
            padding: 40px;
            background: #1a1b1e;
            border-radius: 8px;
            border: 2px solid #00ff88;
          }
          h1 { color: #00ff88; }
          p { color: #8892b0; }
          .refresh {
            color: #00ff88;
            text-decoration: none;
            border: 1px solid #00ff88;
            padding: 10px 20px;
            display: inline-block;
            margin-top: 20px;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="error">
          <h1>🔄 Dashboard Updating</h1>
          <p>The NFT monitor is currently scanning OpenSea.</p>
          <p>Please refresh in a moment.</p>
          <a href="/" class="refresh">↻ Refresh</a>
        </div>
      </body>
      </html>
    `);
  }
});

// API endpoint for raw data
app.get('/api/data', async (req, res) => {
  try {
    const logData = await fs.readFile('monitoring-log.json', 'utf8');
    res.json(JSON.parse(logData));
  } catch (error) {
    res.status(500).json({ error: 'No data available yet' });
  }
});

// API endpoint for latest alerts
app.get('/api/alerts', async (req, res) => {
  try {
    const logData = await fs.readFile('monitoring-log.json', 'utf8');
    const data = JSON.parse(logData);
    res.json({
      alerts: data.alertHistory || [],
      highPriority: data.highPriorityAlerts || [],
      lastUpdate: data.lastUpdate
    });
  } catch (error) {
    res.status(500).json({ error: 'No alerts available' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║   NFT Market Intelligence Dashboard        ║
║   Public URL: http://localhost:${PORT}        ║
║                                            ║
║   Railway URL will be:                    ║
║   https://[your-app].railway.app          ║
╚═══════════════════════════════════════════╝
  `);
});

module.exports = app;