const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('Starting server on port:', PORT);

// Root route
app.get('/', async (req, res) => {
  console.log('Request received at /');

  // Try to load monitoring data
  let alertData = { highPriorityAlerts: [], alertHistory: [] };
  try {
    const data = await fs.readFile('monitoring-log.json', 'utf8');
    alertData = JSON.parse(data);
  } catch (e) {
    // No data yet
  }

  const alerts = alertData.highPriorityAlerts || [];
  const history = alertData.alertHistory || [];

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>NFT Monitor</title>
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
          background: #1a1b1e;
          border-radius: 10px;
          border: 2px solid #00ff88;
        }
        h1 { margin-bottom: 20px; }
        p { color: #8892b0; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 NFT Monitor Active!</h1>
        <p>Port: ${PORT}</p>
        <p>Status: Running</p>
        <p>This dashboard monitors OpenSea NFT collections.</p>
        <p>Updates every 20 minutes.</p>
      </div>
    </body>
    </html>
  `);
});

// Health check
app.get('/health', (req, res) => {
  res.send('OK');
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
  console.log('Server is ready to accept connections');
});

// Handle errors
server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server');
  server.close(() => {
    console.log('Server closed');
  });
});