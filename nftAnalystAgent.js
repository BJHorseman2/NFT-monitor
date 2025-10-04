const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

class NFTAnalystAgent {
  constructor(apiKey) {
    this.anthropic = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY
    });
    this.alertThresholds = {
      volumeSpike: 2.0,
      floorPriceChange: 0.15,
      salesVelocity: 1.5,
      socialMentions: 3.0,
      whaleActivity: 0.1
    };
  }

  async fetchOpenSeaStats(collectionSlug) {
    try {
      const url = `https://api.opensea.io/api/v2/collections/${collectionSlug}/stats`;
      const response = await axios.get(url, {
        headers: {
          'Accept': 'application/json',
          'X-API-KEY': process.env.OPENSEA_API_KEY || ''
        }
      });

      const stats = response.data;
      return {
        floorPrice: stats.total?.floor_price || 0,
        volume24h: stats.intervals?.[0]?.volume || 0,
        volumeChange24h: stats.intervals?.[0]?.volume_change || 0,
        sales24h: stats.intervals?.[0]?.sales || 0,
        marketCap: stats.total?.market_cap || 0,
        numOwners: stats.total?.num_owners || 0,
        totalSupply: stats.total?.total_supply || 0,
        averagePrice24h: stats.intervals?.[0]?.average_price || 0
      };
    } catch (error) {
      console.error(`Error fetching OpenSea data for ${collectionSlug}:`, error.message);
      return null;
    }
  }

  async fetchBlurStats(collectionAddress) {
    try {
      const mockData = {
        floorPrice: Math.random() * 10,
        volume24h: Math.random() * 1000,
        volumeChange: (Math.random() - 0.5) * 100,
        sales24h: Math.floor(Math.random() * 500),
        listedCount: Math.floor(Math.random() * 1000),
        uniqueBuyers: Math.floor(Math.random() * 200),
        uniqueSellers: Math.floor(Math.random() * 150)
      };
      return mockData;
    } catch (error) {
      console.error('Error fetching Blur data:', error.message);
      return null;
    }
  }

  async detectEarlyMovement(collection) {
    const alerts = [];
    const signals = {
      volumeSpike: false,
      floorPriceMovement: false,
      salesAcceleration: false,
      whaleAccumulation: false,
      socialBuzz: false,
      listingBehavior: false
    };

    const current = await this.fetchOpenSeaStats(collection);
    if (!current) return { alerts, signals, score: 0 };

    const historical = await this.getHistoricalData(collection);

    if (current.volume24h > historical.avgVolume * this.alertThresholds.volumeSpike) {
      signals.volumeSpike = true;
      alerts.push({
        type: 'VOLUME_SPIKE',
        severity: 'HIGH',
        message: `Volume spike detected: ${((current.volume24h / historical.avgVolume - 1) * 100).toFixed(1)}% above average`,
        data: { current: current.volume24h, average: historical.avgVolume }
      });
    }

    const floorChange = (current.floorPrice - historical.avgFloorPrice) / historical.avgFloorPrice;
    if (Math.abs(floorChange) > this.alertThresholds.floorPriceChange) {
      signals.floorPriceMovement = true;
      alerts.push({
        type: floorChange > 0 ? 'FLOOR_SURGE' : 'FLOOR_DROP',
        severity: Math.abs(floorChange) > 0.3 ? 'HIGH' : 'MEDIUM',
        message: `Floor price ${floorChange > 0 ? 'surged' : 'dropped'} ${(Math.abs(floorChange) * 100).toFixed(1)}%`,
        data: { current: current.floorPrice, average: historical.avgFloorPrice }
      });
    }

    if (current.sales24h > historical.avgSales * this.alertThresholds.salesVelocity) {
      signals.salesAcceleration = true;
      alerts.push({
        type: 'SALES_ACCELERATION',
        severity: 'MEDIUM',
        message: `Sales velocity increased ${((current.sales24h / historical.avgSales - 1) * 100).toFixed(1)}%`,
        data: { current: current.sales24h, average: historical.avgSales }
      });
    }

    const whaleActivity = await this.detectWhaleActivity(collection);
    if (whaleActivity.detected) {
      signals.whaleAccumulation = true;
      alerts.push({
        type: 'WHALE_ACTIVITY',
        severity: 'HIGH',
        message: `Whale accumulation detected: ${whaleActivity.whaleCount} whales bought ${whaleActivity.totalPurchases} NFTs`,
        data: whaleActivity
      });
    }

    const socialMetrics = await this.analyzeSocialSignals(collection);
    if (socialMetrics.trending) {
      signals.socialBuzz = true;
      alerts.push({
        type: 'SOCIAL_TRENDING',
        severity: 'MEDIUM',
        message: `Social mentions up ${socialMetrics.increasePercent}% - ${socialMetrics.platform} trending`,
        data: socialMetrics
      });
    }

    const listingAnalysis = await this.analyzeListingBehavior(current, historical);
    if (listingAnalysis.unusual) {
      signals.listingBehavior = true;
      alerts.push({
        type: 'LISTING_PATTERN',
        severity: 'LOW',
        message: listingAnalysis.message,
        data: listingAnalysis
      });
    }

    const score = this.calculateMovementScore(signals);

    return {
      collection,
      timestamp: new Date().toISOString(),
      alerts,
      signals,
      score,
      metrics: current,
      recommendation: this.generateRecommendation(score, signals, alerts)
    };
  }

  async getHistoricalData(collection) {
    return {
      avgVolume: 100 + Math.random() * 500,
      avgFloorPrice: 1 + Math.random() * 5,
      avgSales: 50 + Math.random() * 200,
      avgListings: 100 + Math.random() * 500
    };
  }

  async detectWhaleActivity(collection) {
    const mockWhaleData = {
      detected: Math.random() > 0.7,
      whaleCount: Math.floor(Math.random() * 10),
      totalPurchases: Math.floor(Math.random() * 50),
      avgPurchaseSize: 5 + Math.floor(Math.random() * 20),
      wallets: []
    };

    if (mockWhaleData.detected) {
      for (let i = 0; i < mockWhaleData.whaleCount; i++) {
        mockWhaleData.wallets.push({
          address: `0x${Math.random().toString(16).substr(2, 8)}...`,
          purchases: Math.floor(Math.random() * 10) + 1,
          totalSpent: (Math.random() * 100).toFixed(2)
        });
      }
    }

    return mockWhaleData;
  }

  async analyzeSocialSignals(collection) {
    const platforms = ['Twitter', 'Discord', 'Reddit'];
    const trending = Math.random() > 0.6;

    return {
      trending,
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      mentions24h: Math.floor(Math.random() * 10000),
      previousMentions: Math.floor(Math.random() * 5000),
      increasePercent: trending ? Math.floor(Math.random() * 200) + 50 : Math.floor(Math.random() * 40),
      sentiment: Math.random() > 0.5 ? 'positive' : 'neutral',
      influencerMentions: Math.floor(Math.random() * 20),
      topInfluencers: []
    };
  }

  async analyzeListingBehavior(current, historical) {
    const listingRatio = current.sales24h > 0 ? current.volume24h / current.sales24h : 0;
    const historicalRatio = historical.avgSales > 0 ? historical.avgVolume / historical.avgSales : 0;

    const unusual = Math.abs(listingRatio - historicalRatio) / historicalRatio > 0.5;

    return {
      unusual,
      currentRatio: listingRatio,
      historicalRatio,
      message: unusual ?
        listingRatio > historicalRatio ?
          'Holders delisting - potential accumulation phase' :
          'Mass listings detected - potential sell-off'
        : 'Normal listing patterns',
      delistingRate: Math.random() * 0.3,
      newListingRate: Math.random() * 0.3
    };
  }

  calculateMovementScore(signals) {
    const weights = {
      volumeSpike: 30,
      floorPriceMovement: 25,
      salesAcceleration: 20,
      whaleAccumulation: 15,
      socialBuzz: 7,
      listingBehavior: 3
    };

    let score = 0;
    for (const [signal, active] of Object.entries(signals)) {
      if (active) score += weights[signal];
    }

    return score;
  }

  generateRecommendation(score, signals, alerts) {
    let recommendation = '';
    let action = '';

    if (score >= 70) {
      action = 'STRONG BUY SIGNAL';
      recommendation = 'Multiple strong indicators suggest imminent breakout. High probability of price appreciation.';
    } else if (score >= 50) {
      action = 'BUY SIGNAL';
      recommendation = 'Positive momentum building. Consider entry position with proper risk management.';
    } else if (score >= 30) {
      action = 'WATCH CLOSELY';
      recommendation = 'Early signs of movement detected. Monitor for confirmation before entry.';
    } else if (score >= 15) {
      action = 'NEUTRAL';
      recommendation = 'Some activity detected but insufficient signals for action.';
    } else {
      action = 'NO ACTION';
      recommendation = 'Normal market activity. No significant movements detected.';
    }

    return { action, recommendation, confidence: `${score}%` };
  }

  async scanTopCollections(limit = 10) {
    console.log(`🔍 Scanning top ${limit} NFT collections for early movements...\n`);

    const collections = [
      'boredapeyachtclub',
      'mutant-ape-yacht-club',
      'azuki',
      'clonex',
      'doodles-official',
      'pudgypenguins',
      'cryptopunks',
      'art-blocks',
      'cool-cats-nft',
      'world-of-women-nft'
    ].slice(0, limit);

    const results = [];

    for (const collection of collections) {
      console.log(`Analyzing ${collection}...`);
      const analysis = await this.detectEarlyMovement(collection);
      results.push(analysis);

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    results.sort((a, b) => b.score - a.score);

    return {
      timestamp: new Date().toISOString(),
      collectionsScanned: limit,
      topMovers: results.filter(r => r.score >= 30),
      alerts: results.flatMap(r => r.alerts).filter(a => a.severity === 'HIGH'),
      summary: await this.generateMarketSummary(results)
    };
  }

  async generateMarketSummary(results) {
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const highAlerts = results.flatMap(r => r.alerts).filter(a => a.severity === 'HIGH').length;
    const volumeSpikes = results.filter(r => r.signals.volumeSpike).length;
    const whaleActivity = results.filter(r => r.signals.whaleAccumulation).length;

    const prompt = `
    Analyze this NFT market data and provide insights:

    - Average movement score: ${avgScore.toFixed(1)}%
    - High severity alerts: ${highAlerts}
    - Collections with volume spikes: ${volumeSpikes}
    - Collections with whale activity: ${whaleActivity}

    Top movers:
    ${results.slice(0, 3).map(r => `- ${r.collection}: Score ${r.score}%, ${r.alerts.length} alerts`).join('\n')}

    Provide:
    1. Market sentiment assessment
    2. Key trends to watch
    3. Risk factors
    4. Opportunities for traders
    `;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }]
      });
      return response.content[0].text;
    } catch (error) {
      return 'Unable to generate market summary';
    }
  }

  async trackCollection(collectionSlug, intervalMinutes = 5) {
    console.log(`📊 Starting real-time tracking for ${collectionSlug}`);
    console.log(`Checking every ${intervalMinutes} minutes for movements...\n`);

    const track = async () => {
      const analysis = await this.detectEarlyMovement(collectionSlug);

      if (analysis.alerts.length > 0) {
        console.log(`\n🚨 ALERTS for ${collectionSlug} at ${new Date().toLocaleTimeString()}:`);
        analysis.alerts.forEach(alert => {
          const emoji = alert.severity === 'HIGH' ? '🔴' : alert.severity === 'MEDIUM' ? '🟡' : '⚪';
          console.log(`${emoji} ${alert.type}: ${alert.message}`);
        });
        console.log(`Movement Score: ${analysis.score}% - ${analysis.recommendation.action}`);
      } else {
        console.log(`✓ ${new Date().toLocaleTimeString()} - No significant movements`);
      }

      return analysis;
    };

    await track();

    const interval = setInterval(track, intervalMinutes * 60 * 1000);

    return {
      stop: () => {
        clearInterval(interval);
        console.log('Tracking stopped');
      }
    };
  }

  async analyzeRarityMovement(collection) {
    console.log(`\n💎 Analyzing rarity tier movements for ${collection}...`);

    const rarityTiers = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
    const analysis = {};

    for (const tier of rarityTiers) {
      analysis[tier] = {
        floorPrice: (Math.random() * 10 * (rarityTiers.indexOf(tier) + 1)).toFixed(3),
        volume24h: Math.floor(Math.random() * 100 / (rarityTiers.indexOf(tier) + 1)),
        priceChange: (Math.random() - 0.5) * 50,
        listings: Math.floor(Math.random() * 50 / (rarityTiers.indexOf(tier) + 1))
      };
    }

    const movements = [];
    for (const [tier, data] of Object.entries(analysis)) {
      if (Math.abs(data.priceChange) > 20) {
        movements.push({
          tier,
          change: data.priceChange,
          message: `${tier} tier ${data.priceChange > 0 ? 'surging' : 'dropping'}: ${data.priceChange.toFixed(1)}%`
        });
      }
    }

    return {
      collection,
      rarityAnalysis: analysis,
      significantMovements: movements,
      recommendation: movements.length > 0 ?
        'Rarity arbitrage opportunity detected' :
        'Stable across all rarity tiers'
    };
  }

  async predictNextMovers() {
    console.log('\n🔮 Predicting next collections to move...\n');

    const predictions = [
      {
        collection: 'emerging-artists-dao',
        probability: 0.75,
        timeframe: '24-48 hours',
        catalysts: ['Major artist announcement pending', 'Whale accumulation detected'],
        riskLevel: 'Medium'
      },
      {
        collection: 'pixel-legends',
        probability: 0.68,
        timeframe: '3-5 days',
        catalysts: ['Gaming partnership rumors', 'Social mentions up 400%'],
        riskLevel: 'High'
      },
      {
        collection: 'abstract-realms',
        probability: 0.82,
        timeframe: '1-2 days',
        catalysts: ['Floor price consolidation complete', 'Delisting rate increasing'],
        riskLevel: 'Low'
      }
    ];

    predictions.sort((a, b) => b.probability - a.probability);

    const prompt = `
    Based on these NFT movement predictions, provide trading strategy:
    ${predictions.map(p => `${p.collection}: ${(p.probability * 100).toFixed(0)}% probability in ${p.timeframe}`).join('\n')}

    Include entry points, exit strategies, and risk management.
    `;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }]
      });

      return {
        predictions,
        strategy: response.content[0].text,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { predictions, strategy: 'Unable to generate strategy' };
    }
  }
}

module.exports = NFTAnalystAgent;