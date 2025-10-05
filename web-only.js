// Simple web server - just serves the dashboard
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Health check for Railway
app.get('/health', (req, res) => {
  res.send('OK');
});

// Main route - serve the latest dashboard
app.get('/', async (req, res) => {
  try {
    // Look for most recent dashboard
    const dir = path.join(__dirname, 'dashboard-reports');

    try {
      const files = await fs.readdir(dir);
      const htmlFiles = files.filter(f => f.endsWith('.html')).sort();

      if (htmlFiles.length > 0) {
        const latestFile = htmlFiles[htmlFiles.length - 1];
        const content = await fs.readFile(path.join(dir, latestFile), 'utf8');
        res.send(content);
      } else {
        throw new Error('No dashboard found');
      }
    } catch (err) {
      // Create a simple dashboard if none exists
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>NFT Market Intelligence</title>
          <style>
            body {
              background: #0a0b0d;
              color: #00ff88;
              font-family: monospace;
              padding: 40px;
              text-align: center;
            }
            h1 { font-size: 32px; }
            p { color: #8892b0; margin: 20px 0; }
            .box {
              background: #1a1b1e;
              border: 2px solid #00ff88;
              border-radius: 8px;
              padding: 30px;
              max-width: 600px;
              margin: 40px auto;
            }
          </style>
        </head>
        <body>
          <h1>🔍 NFT Market Intelligence</h1>
          <div class="box">
            <h2>Welcome to the NFT Monitor</h2>
            <p>This dashboard tracks OpenSea collections for unusual activity:</p>
            <p>✅ Volume spikes</p>
            <p>✅ Floor price movements</p>
            <p>✅ Whale accumulation</p>
            <p>✅ Risk scoring</p>
            <br>
            <p><strong>Status:</strong> Initializing...</p>
            <p>The monitor scans every 20 minutes.</p>
          </div>
        </body>
        </html>
      `;
      res.send(html);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Dashboard loading...');
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║   NFT Dashboard Server Running                        ║
║   Port: ${PORT}                                          ║
║   Ready for Railway!                                  ║
╚════════════════════════════════════════════════════════╝
  `);
});