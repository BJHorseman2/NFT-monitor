const axios = require('axios');
const cheerio = require('cheerio');

class NFTDataTools {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 3 * 60 * 1000;
    this.discordWebhooks = [];
    this.twitterTracking = new Map();
  }

  async fetchMultipleMarketplaces(collection) {
    const data = {
      opensea: await this.fetchOpenSeaData(collection),
      blur: await this.fetchBlurData(collection),
      looksrare: await this.fetchLooksRareData(collection),
      x2y2: await this.fetchX2Y2Data(collection),
      magiceden: await this.fetchMagicEdenData(collection)
    };

    const aggregated = this.aggregateMarketData(data);
    return aggregated;
  }

  async fetchOpenSeaData(collection) {
    try {
      const mockData = {
        marketplace: 'OpenSea',
        floorPrice: 1.5 + Math.random() * 3,
        volume24h: 100 + Math.random() * 500,
        sales24h: Math.floor(20 + Math.random() * 100),
        listings: Math.floor(100 + Math.random() * 500),
        owners: Math.floor(1000 + Math.random() * 5000),
        royalty: 2.5
      };
      return mockData;
    } catch (error) {
      console.error('OpenSea fetch error:', error.message);
      return null;
    }
  }

  async fetchBlurData(collection) {
    try {
      const mockData = {
        marketplace: 'Blur',
        floorPrice: 1.4 + Math.random() * 3,
        volume24h: 150 + Math.random() * 600,
        sales24h: Math.floor(30 + Math.random() * 120),
        listings: Math.floor(80 + Math.random() * 400),
        bidDepth: Math.floor(10 + Math.random() * 50),
        bidLiquidity: 50 + Math.random() * 200
      };
      return mockData;
    } catch (error) {
      console.error('Blur fetch error:', error.message);
      return null;
    }
  }

  async fetchLooksRareData(collection) {
    try {
      const mockData = {
        marketplace: 'LooksRare',
        floorPrice: 1.6 + Math.random() * 3,
        volume24h: 50 + Math.random() * 200,
        sales24h: Math.floor(10 + Math.random() * 50),
        listings: Math.floor(50 + Math.random() * 200),
        rewardsAPR: 5 + Math.random() * 15
      };
      return mockData;
    } catch (error) {
      console.error('LooksRare fetch error:', error.message);
      return null;
    }
  }

  async fetchX2Y2Data(collection) {
    try {
      const mockData = {
        marketplace: 'X2Y2',
        floorPrice: 1.45 + Math.random() * 3,
        volume24h: 40 + Math.random() * 150,
        sales24h: Math.floor(8 + Math.random() * 40),
        listings: Math.floor(40 + Math.random() * 150)
      };
      return mockData;
    } catch (error) {
      console.error('X2Y2 fetch error:', error.message);
      return null;
    }
  }

  async fetchMagicEdenData(collection) {
    try {
      const mockData = {
        marketplace: 'Magic Eden',
        floorPrice: 1.55 + Math.random() * 3,
        volume24h: 80 + Math.random() * 300,
        sales24h: Math.floor(15 + Math.random() * 70),
        listings: Math.floor(60 + Math.random() * 250)
      };
      return mockData;
    } catch (error) {
      console.error('Magic Eden fetch error:', error.message);
      return null;
    }
  }

  aggregateMarketData(data) {
    const validData = Object.values(data).filter(d => d !== null);

    if (validData.length === 0) return null;

    const lowestFloor = Math.min(...validData.map(d => d.floorPrice));
    const totalVolume = validData.reduce((sum, d) => sum + d.volume24h, 0);
    const totalSales = validData.reduce((sum, d) => sum + d.sales24h, 0);
    const totalListings = validData.reduce((sum, d) => sum + (d.listings || 0), 0);

    const arbitrageOpportunities = [];
    validData.forEach(market1 => {
      validData.forEach(market2 => {
        if (market1.marketplace !== market2.marketplace) {
          const priceDiff = Math.abs(market1.floorPrice - market2.floorPrice);
          const priceDiffPercent = (priceDiff / Math.min(market1.floorPrice, market2.floorPrice)) * 100;

          if (priceDiffPercent > 5) {
            arbitrageOpportunities.push({
              buy: market1.floorPrice < market2.floorPrice ? market1.marketplace : market2.marketplace,
              sell: market1.floorPrice > market2.floorPrice ? market1.marketplace : market2.marketplace,
              buyPrice: Math.min(market1.floorPrice, market2.floorPrice),
              sellPrice: Math.max(market1.floorPrice, market2.floorPrice),
              profit: priceDiff,
              profitPercent: priceDiffPercent
            });
          }
        }
      });
    });

    const uniqueArbitrage = [];
    const seen = new Set();
    arbitrageOpportunities.forEach(opp => {
      const key = [opp.buy, opp.sell].sort().join('-');
      if (!seen.has(key)) {
        seen.add(key);
        uniqueArbitrage.push(opp);
      }
    });

    return {
      aggregated: {
        lowestFloor,
        averageFloor: validData.reduce((sum, d) => sum + d.floorPrice, 0) / validData.length,
        totalVolume24h: totalVolume,
        totalSales24h: totalSales,
        totalListings,
        marketplaceCount: validData.length
      },
      byMarketplace: data,
      arbitrage: uniqueArbitrage.sort((a, b) => b.profitPercent - a.profitPercent),
      dominantMarketplace: validData.reduce((max, d) => d.volume24h > max.volume24h ? d : max).marketplace
    };
  }

  async fetchTwitterMetrics(collection) {
    try {
      const metrics = {
        mentions24h: Math.floor(100 + Math.random() * 5000),
        previousMentions24h: Math.floor(80 + Math.random() * 4000),
        sentiment: this.calculateSentiment(),
        topTweets: this.generateTopTweets(collection),
        influencerEngagement: Math.floor(Math.random() * 50),
        hashtagTrending: Math.random() > 0.6,
        spaces: Math.floor(Math.random() * 5)
      };

      metrics.growthRate = ((metrics.mentions24h - metrics.previousMentions24h) / metrics.previousMentions24h * 100).toFixed(1);
      metrics.viralPotential = this.calculateViralPotential(metrics);

      return metrics;
    } catch (error) {
      console.error('Twitter metrics error:', error.message);
      return null;
    }
  }

  calculateSentiment() {
    const sentiments = [
      { type: 'Very Positive', score: 0.9 },
      { type: 'Positive', score: 0.7 },
      { type: 'Neutral', score: 0.5 },
      { type: 'Negative', score: 0.3 },
      { type: 'Very Negative', score: 0.1 }
    ];
    return sentiments[Math.floor(Math.random() * sentiments.length)];
  }

  generateTopTweets(collection) {
    const tweets = [];
    for (let i = 0; i < 3; i++) {
      tweets.push({
        author: `@crypto_whale_${Math.floor(Math.random() * 999)}`,
        followers: Math.floor(10000 + Math.random() * 90000),
        text: `Just swept ${Math.floor(5 + Math.random() * 20)} ${collection}. Something big coming...`,
        likes: Math.floor(100 + Math.random() * 5000),
        retweets: Math.floor(50 + Math.random() * 2000),
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    return tweets;
  }

  calculateViralPotential(metrics) {
    let score = 0;

    if (metrics.growthRate > 100) score += 30;
    else if (metrics.growthRate > 50) score += 20;
    else if (metrics.growthRate > 20) score += 10;

    if (metrics.sentiment.score > 0.7) score += 20;
    if (metrics.influencerEngagement > 30) score += 25;
    if (metrics.hashtagTrending) score += 15;
    if (metrics.spaces > 2) score += 10;

    return {
      score,
      rating: score > 70 ? 'High' : score > 40 ? 'Medium' : 'Low',
      factors: {
        growth: metrics.growthRate > 50,
        sentiment: metrics.sentiment.score > 0.7,
        influencers: metrics.influencerEngagement > 30,
        trending: metrics.hashtagTrending
      }
    };
  }

  async fetchDiscordMetrics(inviteCode) {
    try {
      const metrics = {
        memberCount: Math.floor(5000 + Math.random() * 50000),
        onlineMembers: Math.floor(1000 + Math.random() * 10000),
        messagesPerHour: Math.floor(100 + Math.random() * 1000),
        activeChannels: Math.floor(10 + Math.random() * 30),
        voiceActive: Math.floor(Math.random() * 100),
        announcement24h: Math.random() > 0.7,
        modActivity: this.calculateModActivity()
      };

      metrics.engagementRate = ((metrics.onlineMembers / metrics.memberCount) * 100).toFixed(1);
      metrics.activityScore = this.calculateActivityScore(metrics);

      return metrics;
    } catch (error) {
      console.error('Discord metrics error:', error.message);
      return null;
    }
  }

  calculateModActivity() {
    const levels = ['Very High', 'High', 'Normal', 'Low'];
    return levels[Math.floor(Math.random() * levels.length)];
  }

  calculateActivityScore(metrics) {
    let score = 0;

    const engagementRate = parseFloat(metrics.engagementRate);
    if (engagementRate > 30) score += 30;
    else if (engagementRate > 20) score += 20;
    else if (engagementRate > 10) score += 10;

    if (metrics.messagesPerHour > 500) score += 25;
    else if (metrics.messagesPerHour > 250) score += 15;

    if (metrics.voiceActive > 50) score += 20;
    if (metrics.announcement24h) score += 15;
    if (metrics.modActivity === 'Very High') score += 10;

    return {
      score,
      rating: score > 70 ? 'Extremely Active' : score > 50 ? 'Very Active' : score > 30 ? 'Active' : 'Moderate',
      insights: this.generateActivityInsights(metrics, score)
    };
  }

  generateActivityInsights(metrics, score) {
    const insights = [];

    if (parseFloat(metrics.engagementRate) > 25) {
      insights.push('High community engagement - bullish signal');
    }
    if (metrics.announcement24h) {
      insights.push('Recent announcement may drive price action');
    }
    if (metrics.voiceActive > 50) {
      insights.push('Active voice channels indicate strong community bonds');
    }
    if (score > 70) {
      insights.push('Community metrics suggest imminent movement');
    }

    return insights;
  }

  async fetchOnChainMetrics(contractAddress) {
    try {
      const metrics = {
        uniqueHolders: Math.floor(1000 + Math.random() * 9000),
        whaleConcentration: (Math.random() * 30).toFixed(1),
        diamondHands: Math.floor(100 + Math.random() * 900),
        paperHands: Math.floor(50 + Math.random() * 450),
        averageHoldTime: Math.floor(30 + Math.random() * 300),
        mintedOut: Math.random() > 0.3,
        burnedTokens: Math.floor(Math.random() * 100),
        stakingActive: Math.random() > 0.5,
        stakedPercent: (Math.random() * 60).toFixed(1)
      };

      metrics.holderDistribution = this.calculateHolderDistribution(metrics.uniqueHolders);
      metrics.liquidityScore = this.calculateLiquidityScore(metrics);

      return metrics;
    } catch (error) {
      console.error('On-chain metrics error:', error.message);
      return null;
    }
  }

  calculateHolderDistribution(totalHolders) {
    return {
      top1Percent: Math.floor(totalHolders * 0.01),
      top10Percent: Math.floor(totalHolders * 0.1),
      retailers: Math.floor(totalHolders * 0.7),
      inactive: Math.floor(totalHolders * 0.19),
      giniCoefficient: (0.3 + Math.random() * 0.4).toFixed(2)
    };
  }

  calculateLiquidityScore(metrics) {
    let score = 0;

    const whaleConc = parseFloat(metrics.whaleConcentration);
    if (whaleConc < 20) score += 30;
    else if (whaleConc < 30) score += 20;
    else score += 10;

    const diamondHandRatio = metrics.diamondHands / (metrics.diamondHands + metrics.paperHands);
    if (diamondHandRatio > 0.7) score += 30;
    else if (diamondHandRatio > 0.5) score += 20;

    if (metrics.averageHoldTime > 180) score += 20;
    if (metrics.stakingActive && parseFloat(metrics.stakedPercent) > 30) score += 20;

    return {
      score,
      rating: score > 80 ? 'Excellent' : score > 60 ? 'Good' : score > 40 ? 'Fair' : 'Poor',
      risks: this.identifyLiquidityRisks(metrics)
    };
  }

  identifyLiquidityRisks(metrics) {
    const risks = [];

    if (parseFloat(metrics.whaleConcentration) > 40) {
      risks.push('High whale concentration - manipulation risk');
    }
    if (metrics.paperHands > metrics.diamondHands) {
      risks.push('High paper hand ratio - volatility risk');
    }
    if (metrics.averageHoldTime < 30) {
      risks.push('Short hold times - speculative trading');
    }
    if (!metrics.stakingActive) {
      risks.push('No staking mechanism - reduced holder incentive');
    }

    return risks;
  }

  async fetchHistoricalPriceData(collection, days = 30) {
    const data = [];
    const basePrice = 1 + Math.random() * 5;

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));

      const volatility = 0.1 + Math.random() * 0.2;
      const trend = Math.sin(i / 5) * 0.3;
      const noise = (Math.random() - 0.5) * volatility;

      data.push({
        date: date.toISOString().split('T')[0],
        floor: Math.max(0.1, basePrice * (1 + trend + noise)),
        volume: Math.floor(50 + Math.random() * 500),
        sales: Math.floor(10 + Math.random() * 100),
        listings: Math.floor(100 + Math.random() * 1000)
      });
    }

    const analysis = this.analyzeHistoricalTrends(data);

    return {
      data,
      analysis,
      support: this.calculateSupportLevels(data),
      resistance: this.calculateResistanceLevels(data)
    };
  }

  analyzeHistoricalTrends(data) {
    const prices = data.map(d => d.floor);
    const volumes = data.map(d => d.volume);

    const trend = prices[prices.length - 1] > prices[0] ? 'Uptrend' : 'Downtrend';
    const volatility = this.calculateVolatility(prices);
    const momentum = this.calculateMomentum(prices);

    return {
      trend,
      volatility: (volatility * 100).toFixed(1) + '%',
      momentum,
      averageVolume: (volumes.reduce((a, b) => a + b, 0) / volumes.length).toFixed(0),
      priceRange: {
        min: Math.min(...prices).toFixed(3),
        max: Math.max(...prices).toFixed(3),
        current: prices[prices.length - 1].toFixed(3)
      }
    };
  }

  calculateVolatility(prices) {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  calculateMomentum(prices) {
    const shortMA = prices.slice(-7).reduce((a, b) => a + b, 0) / 7;
    const longMA = prices.slice(-14).reduce((a, b) => a + b, 0) / 14;

    if (shortMA > longMA * 1.05) return 'Strong Bullish';
    if (shortMA > longMA) return 'Bullish';
    if (shortMA < longMA * 0.95) return 'Strong Bearish';
    if (shortMA < longMA) return 'Bearish';
    return 'Neutral';
  }

  calculateSupportLevels(data) {
    const prices = data.map(d => d.floor);
    const sorted = [...prices].sort((a, b) => a - b);

    return [
      sorted[Math.floor(sorted.length * 0.1)].toFixed(3),
      sorted[Math.floor(sorted.length * 0.25)].toFixed(3),
      sorted[Math.floor(sorted.length * 0.4)].toFixed(3)
    ];
  }

  calculateResistanceLevels(data) {
    const prices = data.map(d => d.floor);
    const sorted = [...prices].sort((a, b) => a - b);

    return [
      sorted[Math.floor(sorted.length * 0.6)].toFixed(3),
      sorted[Math.floor(sorted.length * 0.75)].toFixed(3),
      sorted[Math.floor(sorted.length * 0.9)].toFixed(3)
    ];
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.cachedAt < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      cachedAt: Date.now()
    });
  }
}

module.exports = NFTDataTools;