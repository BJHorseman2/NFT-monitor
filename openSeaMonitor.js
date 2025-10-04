const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

class OpenSeaMonitor {
  constructor(apiKey, anthropicKey) {
    this.apiKey = apiKey || process.env.OPENSEA_API_KEY;
    this.anthropic = new Anthropic({
      apiKey: anthropicKey || process.env.ANTHROPIC_API_KEY
    });
    this.baseUrl = 'https://api.opensea.io/api/v2';
    this.cache = new Map();
    this.alertHistory = new Map();
  }

  async getHeaders() {
    if (!this.apiKey) {
      throw new Error('OpenSea API key not configured. Please set OPENSEA_API_KEY in .env file');
    }
    return {
      'Accept': 'application/json',
      'X-API-KEY': this.apiKey
    };
  }

  async fetchCollectionStats(collectionSlug) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/collections/${collectionSlug}/stats`,
        {
          headers: await this.getHeaders(),
          timeout: 10000 // 10 second timeout
        }
      );

      return {
        collection: collectionSlug,
        stats: {
          floorPrice: response.data.total.floor_price,
          floorPriceSymbol: response.data.total.floor_price_symbol || 'ETH',
          oneDayVolume: response.data.intervals[0]?.volume || 0,
          oneDayChange: response.data.intervals[0]?.volume_change || 0,
          oneDaySales: response.data.intervals[0]?.sales || 0,
          oneDayAveragePrice: response.data.intervals[0]?.average_price || 0,
          sevenDayVolume: response.data.intervals[1]?.volume || 0,
          sevenDayChange: response.data.intervals[1]?.volume_change || 0,
          sevenDaySales: response.data.intervals[1]?.sales || 0,
          thirtyDayVolume: response.data.intervals[2]?.volume || 0,
          thirtyDayChange: response.data.intervals[2]?.volume_change || 0,
          thirtyDaySales: response.data.intervals[2]?.sales || 0,
          totalVolume: response.data.total.volume,
          totalSales: response.data.total.sales,
          totalSupply: response.data.total.total_supply || 0,
          numOwners: response.data.total.num_owners || 0,
          marketCap: response.data.total.market_cap,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error(`Error fetching stats for ${collectionSlug}:`, error.message);
      return null;
    }
  }

  async fetchCollectionEvents(collectionSlug, eventType = null, limit = 50) {
    try {
      let url = `${this.baseUrl}/events/collection/${collectionSlug}`;
      const params = new URLSearchParams();

      if (eventType) {
        params.append('event_type', eventType);
      }
      params.append('limit', limit);

      const response = await axios.get(
        `${url}?${params.toString()}`,
        { headers: await this.getHeaders() }
      );

      const events = response.data.asset_events || [];

      return events.map(event => ({
        eventType: event.event_type,
        tokenId: event.token_id,
        price: event.price?.value || 0,
        currency: event.price?.currency || 'ETH',
        fromAddress: event.from_account?.address,
        toAddress: event.to_account?.address,
        timestamp: event.event_timestamp,
        transactionHash: event.transaction?.hash,
        marketplace: event.marketplace || 'OpenSea'
      }));
    } catch (error) {
      console.error(`Error fetching events for ${collectionSlug}:`, error.message);
      return [];
    }
  }

  async detectUnusualActivity(collectionSlug) {
    const stats = await this.fetchCollectionStats(collectionSlug);
    if (!stats) return null;

    const alerts = [];
    const severity = { HIGH: 'HIGH', MEDIUM: 'MEDIUM', LOW: 'LOW' };

    // Volume spike detection
    if (stats.stats.oneDayChange > 100) {
      alerts.push({
        type: 'VOLUME_SURGE',
        severity: stats.stats.oneDayChange > 300 ? severity.HIGH : severity.MEDIUM,
        message: `Volume surged ${stats.stats.oneDayChange.toFixed(1)}% in 24h`,
        value: stats.stats.oneDayVolume,
        threshold: 100
      });
    }

    // Sales velocity
    const avgDailySales = stats.stats.thirtyDaySales / 30;
    if (stats.stats.oneDaySales > avgDailySales * 3) {
      alerts.push({
        type: 'SALES_SPIKE',
        severity: severity.HIGH,
        message: `Sales 3x above 30-day average (${stats.stats.oneDaySales} vs ${avgDailySales.toFixed(0)})`,
        value: stats.stats.oneDaySales,
        average: avgDailySales
      });
    }

    // Floor price movements
    const priceChange = ((stats.stats.floorPrice - stats.stats.oneDayAveragePrice) / stats.stats.oneDayAveragePrice) * 100;
    if (Math.abs(priceChange) > 20) {
      alerts.push({
        type: priceChange > 0 ? 'FLOOR_PUMP' : 'FLOOR_DUMP',
        severity: Math.abs(priceChange) > 40 ? severity.HIGH : severity.MEDIUM,
        message: `Floor ${priceChange > 0 ? 'pumped' : 'dumped'} ${Math.abs(priceChange).toFixed(1)}%`,
        currentFloor: stats.stats.floorPrice,
        previousAvg: stats.stats.oneDayAveragePrice
      });
    }

    // Market cap analysis
    const marketCapChange = stats.stats.floorPrice * stats.stats.totalSupply - (stats.stats.oneDayAveragePrice * stats.stats.totalSupply);
    if (Math.abs(marketCapChange) > 100) { // 100 ETH market cap change
      alerts.push({
        type: 'MARKET_CAP_SHIFT',
        severity: Math.abs(marketCapChange) > 500 ? severity.HIGH : severity.MEDIUM,
        message: `Market cap ${marketCapChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(marketCapChange).toFixed(0)} ETH`,
        currentMarketCap: stats.stats.marketCap,
        change: marketCapChange
      });
    }

    return {
      collection: collectionSlug,
      timestamp: new Date().toISOString(),
      stats: stats.stats,
      alerts,
      riskScore: this.calculateRiskScore(alerts),
      recommendation: await this.generateRecommendation(stats, alerts)
    };
  }

  calculateRiskScore(alerts) {
    let score = 0;
    const weights = {
      HIGH: 40,
      MEDIUM: 20,
      LOW: 10
    };

    alerts.forEach(alert => {
      score += weights[alert.severity] || 0;
    });

    return Math.min(score, 100);
  }

  async generateRecommendation(stats, alerts) {
    if (alerts.length === 0) {
      return {
        action: 'HOLD',
        reasoning: 'No significant activity detected',
        confidence: 'LOW'
      };
    }

    const highAlerts = alerts.filter(a => a.severity === 'HIGH').length;
    const volumeSurge = alerts.find(a => a.type === 'VOLUME_SURGE');
    const floorPump = alerts.find(a => a.type === 'FLOOR_PUMP');
    const salesSpike = alerts.find(a => a.type === 'SALES_SPIKE');

    if (highAlerts >= 2 && (volumeSurge || floorPump)) {
      return {
        action: 'BUY',
        reasoning: 'Multiple strong bullish signals detected',
        confidence: 'HIGH'
      };
    }

    if (salesSpike && floorPump) {
      return {
        action: 'BUY',
        reasoning: 'Organic demand driving price and sales',
        confidence: 'MEDIUM'
      };
    }

    if (alerts.find(a => a.type === 'FLOOR_DUMP')) {
      return {
        action: 'WAIT',
        reasoning: 'Price declining, wait for stabilization',
        confidence: 'MEDIUM'
      };
    }

    return {
      action: 'WATCH',
      reasoning: 'Activity detected, monitor for confirmation',
      confidence: 'LOW'
    };
  }

  async scanTopCollections(limit = 100) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/collections`,
        {
          headers: await this.getHeaders(),
          params: {
            limit,
            order_by: 'one_day_volume'
          }
        }
      );

      const collections = response.data.collections || [];
      const analyses = [];

      for (const collection of collections.slice(0, 20)) {
        const analysis = await this.detectUnusualActivity(collection.collection);
        if (analysis && analysis.alerts.length > 0) {
          analyses.push(analysis);
        }
        // OpenSea rate limit: 2 requests per second
        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
      }

      return analyses.sort((a, b) => b.riskScore - a.riskScore);
    } catch (error) {
      console.error('Error scanning top collections:', error.message);
      return [];
    }
  }

  async trackWhaleActivity(collectionSlug, minValue = 10) {
    const events = await this.fetchCollectionEvents(collectionSlug, 'sale', 100);

    const whaleTransactions = events.filter(event =>
      parseFloat(event.price) >= minValue
    );

    const whaleAddresses = new Map();

    whaleTransactions.forEach(tx => {
      if (!whaleAddresses.has(tx.toAddress)) {
        whaleAddresses.set(tx.toAddress, {
          address: tx.toAddress,
          purchases: [],
          totalSpent: 0
        });
      }

      const whale = whaleAddresses.get(tx.toAddress);
      whale.purchases.push({
        tokenId: tx.tokenId,
        price: tx.price,
        timestamp: tx.timestamp
      });
      whale.totalSpent += parseFloat(tx.price);
    });

    const whales = Array.from(whaleAddresses.values())
      .filter(w => w.purchases.length >= 2 || w.totalSpent >= 20)
      .sort((a, b) => b.totalSpent - a.totalSpent);

    return {
      collection: collectionSlug,
      whaleCount: whales.length,
      totalWhaleVolume: whales.reduce((sum, w) => sum + w.totalSpent, 0),
      topWhales: whales.slice(0, 5),
      whaleTransactions: whaleTransactions.length,
      analysis: this.analyzeWhalePattern(whales, whaleTransactions)
    };
  }

  analyzeWhalePattern(whales, transactions) {
    if (whales.length === 0) {
      return {
        pattern: 'NO_WHALES',
        interpretation: 'No significant whale activity'
      };
    }

    const recentTxCount = transactions.filter(tx => {
      const txTime = new Date(tx.timestamp);
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return txTime > hourAgo;
    }).length;

    if (recentTxCount > 5) {
      return {
        pattern: 'WHALE_ACCUMULATION',
        interpretation: 'Whales are actively accumulating - bullish signal',
        urgency: 'HIGH'
      };
    }

    if (whales.length > 3 && whales[0].totalSpent > 50) {
      return {
        pattern: 'MAJOR_WHALE_INTEREST',
        interpretation: 'Large holders showing strong interest',
        urgency: 'MEDIUM'
      };
    }

    return {
      pattern: 'NORMAL_WHALE_ACTIVITY',
      interpretation: 'Standard whale trading patterns',
      urgency: 'LOW'
    };
  }

  async monitorCollection(collectionSlug, intervalMinutes = 5) {
    console.log(`🔍 Starting OpenSea monitoring for ${collectionSlug}`);
    console.log(`Checking every ${intervalMinutes} minutes...\n`);

    const monitor = async () => {
      const analysis = await this.detectUnusualActivity(collectionSlug);

      if (analysis && analysis.alerts.length > 0) {
        console.log(`\n🚨 OPENSEA ALERTS for ${collectionSlug} at ${new Date().toLocaleTimeString()}`);

        analysis.alerts.forEach(alert => {
          const emoji = alert.severity === 'HIGH' ? '🔴' : alert.severity === 'MEDIUM' ? '🟡' : '⚪';
          console.log(`${emoji} ${alert.type}: ${alert.message}`);
        });

        console.log(`\n📊 Current Stats:`);
        console.log(`Floor: ${analysis.stats.floorPrice} ETH`);
        console.log(`24h Volume: ${analysis.stats.oneDayVolume.toFixed(2)} ETH`);
        console.log(`24h Sales: ${analysis.stats.oneDaySales}`);
        console.log(`Risk Score: ${analysis.riskScore}/100`);
        console.log(`Recommendation: ${analysis.recommendation.action} (${analysis.recommendation.confidence} confidence)`);
      } else {
        console.log(`✓ ${new Date().toLocaleTimeString()} - No unusual activity`);
      }
    };

    await monitor();
    const interval = setInterval(monitor, intervalMinutes * 60 * 1000);

    return {
      stop: () => {
        clearInterval(interval);
        console.log('Monitoring stopped');
      }
    };
  }

  async findTrendingCollections() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/collections`,
        {
          headers: await this.getHeaders(),
          params: {
            limit: 50,
            order_by: 'one_day_change'
          }
        }
      );

      const collections = response.data.collections || [];

      return collections.map(c => ({
        collection: c.collection,
        name: c.name,
        floorPrice: c.floor_price,
        oneDayChange: c.one_day_change,
        oneDayVolume: c.one_day_volume,
        oneDaySales: c.one_day_sales,
        imageUrl: c.image_url
      })).filter(c => c.oneDayChange > 50);
    } catch (error) {
      console.error('Error finding trending collections:', error.message);
      return [];
    }
  }

  async getFloorPriceHistory(collectionSlug, days = 7) {
    // Note: OpenSea API v2 doesn't provide historical data directly
    // This would need to be collected over time or use a service like Reservoir
    console.log('Note: Historical price data requires data collection over time or alternative API');

    return {
      message: 'Historical data not available in OpenSea v2 API',
      alternatives: [
        'Use Reservoir API for historical data',
        'Implement data collection over time',
        'Use Dune Analytics API'
      ]
    };
  }
}

module.exports = OpenSeaMonitor;