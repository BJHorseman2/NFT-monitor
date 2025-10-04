// Debug environment variables
console.log('All env vars available:', Object.keys(process.env).filter(k => !k.includes('PATH')));
console.log('OPENSEA_API_KEY present?', !!process.env.OPENSEA_API_KEY);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Only load dotenv if not in production (Railway provides env vars directly)
if (!process.env.OPENSEA_API_KEY) {
  require('dotenv').config();
}
const OpenSeaMonitor = require('./openSeaMonitor');
const fs = require('fs').promises;
const path = require('path');

class ContinuousMonitor {
  constructor() {
    console.log('Environment check after dotenv:', {
      hasApiKey: !!process.env.OPENSEA_API_KEY,
      apiKeyLength: process.env.OPENSEA_API_KEY ? process.env.OPENSEA_API_KEY.length : 0,
      nodeEnv: process.env.NODE_ENV,
      emailTo: process.env.EMAIL_TO ? 'configured' : 'missing'
    });
    this.monitor = new OpenSeaMonitor(process.env.OPENSEA_API_KEY);
    this.alertHistory = [];
    this.highPriorityAlerts = [];
    this.logFile = 'monitoring-log.json';
    this.interval = 20 * 60 * 1000; // 20 minutes in milliseconds
    this.isRunning = false;
  }

  async initialize() {
    try {
      const data = await fs.readFile(this.logFile, 'utf8');
      this.alertHistory = JSON.parse(data).alertHistory || [];
    } catch (error) {
      // File doesn't exist yet, start fresh
      this.alertHistory = [];
    }
  }

  async saveLog() {
    const logData = {
      lastUpdate: new Date().toISOString(),
      alertHistory: this.alertHistory,
      highPriorityAlerts: this.highPriorityAlerts
    };
    await fs.writeFile(this.logFile, JSON.stringify(logData, null, 2));
  }

  formatTime() {
    return new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  async runScan() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 OPENSEA SCAN - ${this.formatTime()}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      // Scan top collections
      const unusual = await this.monitor.scanTopCollections(50);

      let newHighPriorityCount = 0;
      let newAlerts = [];

      if (unusual.length === 0) {
        console.log('✅ No unusual activity detected');
      } else {
        console.log(`📊 Found ${unusual.length} collections with activity:\n`);

        // Process each collection with alerts
        unusual.forEach((collection, index) => {
          const isHighPriority = collection.riskScore >= 60 ||
                                 collection.recommendation.action === 'BUY';

          if (isHighPriority) {
            newHighPriorityCount++;

            // Check if this is a new high priority alert
            const exists = this.highPriorityAlerts.find(
              a => a.collection === collection.collection
            );

            if (!exists) {
              this.highPriorityAlerts.push({
                collection: collection.collection,
                firstSeen: new Date().toISOString(),
                riskScore: collection.riskScore,
                recommendation: collection.recommendation
              });

              console.log(`🚨 NEW HIGH PRIORITY ALERT 🚨`);
            }
          }

          // Display top 5 most significant
          if (index < 5) {
            const emoji = isHighPriority ? '🔥' : '📈';
            console.log(`${emoji} ${index + 1}. ${collection.collection}`);
            console.log(`   Risk Score: ${collection.riskScore}/100`);
            console.log(`   Action: ${collection.recommendation.action} (${collection.recommendation.confidence})`);

            collection.alerts.forEach(alert => {
              const alertEmoji = alert.severity === 'HIGH' ? '🔴' :
                                alert.severity === 'MEDIUM' ? '🟡' : '⚪';
              console.log(`   ${alertEmoji} ${alert.message}`);

              newAlerts.push({
                time: new Date().toISOString(),
                collection: collection.collection,
                type: alert.type,
                severity: alert.severity,
                message: alert.message
              });
            });
            console.log('');
          }
        });

        // Add to history
        this.alertHistory.push({
          timestamp: new Date().toISOString(),
          totalAlerts: unusual.length,
          highPriorityCount: newHighPriorityCount,
          alerts: newAlerts
        });

        // Keep only last 100 scans in history
        if (this.alertHistory.length > 100) {
          this.alertHistory = this.alertHistory.slice(-100);
        }
      }

      // Show trending collections
      console.log('\n📈 TRENDING COLLECTIONS:');
      const trending = await this.monitor.findTrendingCollections();

      if (trending.length > 0) {
        trending.slice(0, 3).forEach(t => {
          const changeEmoji = t.oneDayChange > 100 ? '🚀' :
                             t.oneDayChange > 50 ? '📈' : '↗️';
          console.log(`${changeEmoji} ${t.name || t.collection}: +${t.oneDayChange.toFixed(1)}% (${t.oneDayVolume.toFixed(2)} ETH volume)`);
        });
      } else {
        console.log('No significantly trending collections');
      }

      // Save the log
      await this.saveLog();

      // Show summary
      console.log('\n' + '─'.repeat(60));
      console.log('📊 SUMMARY:');
      console.log(`• Total collections with activity: ${unusual.length}`);
      console.log(`• High priority alerts: ${newHighPriorityCount}`);
      console.log(`• Total alerts this session: ${this.highPriorityAlerts.length}`);
      console.log(`• Next scan in 20 minutes...`);

      // Show high priority alerts if any
      if (this.highPriorityAlerts.length > 0) {
        console.log('\n🎯 HIGH PRIORITY WATCH LIST:');
        this.highPriorityAlerts.slice(0, 5).forEach(alert => {
          console.log(`• ${alert.collection} - Score: ${alert.riskScore} - ${alert.recommendation.action}`);
        });
      }

    } catch (error) {
      console.error('❌ Error during scan:', error.message);
    }
  }

  async start() {
    if (this.isRunning) {
      console.log('Monitor is already running');
      return;
    }

    this.isRunning = true;
    console.log(`🚀 Starting Continuous OpenSea Monitor`);
    console.log(`📍 Scanning every 20 minutes`);
    console.log(`📝 Logging to: ${this.logFile}`);
    console.log(`⏰ Started at: ${this.formatTime()}\n`);

    await this.initialize();

    // Run first scan immediately
    await this.runScan();

    // Schedule recurring scans
    this.intervalId = setInterval(async () => {
      await this.runScan();
    }, this.interval);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      await this.stop();
      process.exit(0);
    });
  }

  async stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('\n\n🛑 Stopping monitor...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    await this.saveLog();
    console.log('✅ Monitor stopped. Log saved to', this.logFile);
    console.log(`📊 Total sessions alerts: ${this.highPriorityAlerts.length}`);
  }
}

// Main execution
async function main() {
  const monitor = new ContinuousMonitor();
  await monitor.start();

  // Keep the process running
  process.stdin.resume();
}

main().catch(console.error);