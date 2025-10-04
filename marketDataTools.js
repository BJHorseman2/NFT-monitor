const axios = require('axios');

class MarketDataTools {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000;
  }

  async fetchCryptoData(symbol) {
    const cacheKey = `crypto_${symbol}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      const data = response.data[symbol];
      if (data) {
        const formattedData = {
          symbol: symbol.toUpperCase(),
          price: data.usd,
          change24h: data.usd_24h_change,
          volume24h: data.usd_24h_vol,
          marketCap: data.usd_market_cap,
          timestamp: new Date().toISOString()
        };

        this.setCache(cacheKey, formattedData);
        return formattedData;
      }
    } catch (error) {
      console.error(`Error fetching crypto data for ${symbol}:`, error.message);
      return null;
    }
  }

  async fetchForexData(fromCurrency, toCurrency) {
    const pair = `${fromCurrency}_${toCurrency}`;
    const cacheKey = `forex_${pair}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(
        `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
      );

      const rate = response.data.rates[toCurrency];
      if (rate) {
        const data = {
          pair,
          rate,
          timestamp: response.data.date,
          base: fromCurrency,
          target: toCurrency
        };

        this.setCache(cacheKey, data);
        return data;
      }
    } catch (error) {
      console.error(`Error fetching forex data for ${pair}:`, error.message);
      return null;
    }
  }

  async fetchEconomicIndicators() {
    const cacheKey = 'economic_indicators';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const indicators = {
      gdpGrowth: {
        value: '2.1%',
        period: 'Q3 2024',
        trend: 'stable'
      },
      inflation: {
        value: '3.2%',
        period: 'October 2024',
        trend: 'decreasing'
      },
      unemployment: {
        value: '3.9%',
        period: 'October 2024',
        trend: 'stable'
      },
      interestRate: {
        value: '5.5%',
        period: 'November 2024',
        trend: 'stable'
      },
      timestamp: new Date().toISOString()
    };

    this.setCache(cacheKey, indicators);
    return indicators;
  }

  async fetchSectorPerformance() {
    const sectors = [
      { name: 'Technology', performance: '+2.3%', leaders: ['AAPL', 'MSFT', 'GOOGL'] },
      { name: 'Healthcare', performance: '+1.2%', leaders: ['JNJ', 'PFE', 'UNH'] },
      { name: 'Finance', performance: '+0.8%', leaders: ['JPM', 'BAC', 'WFC'] },
      { name: 'Energy', performance: '-1.5%', leaders: ['XOM', 'CVX', 'COP'] },
      { name: 'Consumer', performance: '+1.7%', leaders: ['AMZN', 'TSLA', 'WMT'] },
      { name: 'Real Estate', performance: '-0.3%', leaders: ['AMT', 'PLD', 'CCI'] }
    ];

    return {
      sectors,
      bestPerforming: 'Technology',
      worstPerforming: 'Energy',
      timestamp: new Date().toISOString()
    };
  }

  async fetchMarketSentiment(symbol) {
    const sentimentData = {
      symbol,
      overall: this.randomSentiment(),
      social: {
        twitter: this.randomSentiment(),
        reddit: this.randomSentiment(),
        stocktwits: this.randomSentiment()
      },
      news: this.randomSentiment(),
      analystRating: this.randomAnalystRating(),
      fearGreedIndex: Math.floor(Math.random() * 100),
      timestamp: new Date().toISOString()
    };

    return sentimentData;
  }

  randomSentiment() {
    const sentiments = ['Very Bullish', 'Bullish', 'Neutral', 'Bearish', 'Very Bearish'];
    return sentiments[Math.floor(Math.random() * sentiments.length)];
  }

  randomAnalystRating() {
    const ratings = ['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell'];
    return ratings[Math.floor(Math.random() * ratings.length)];
  }

  async fetchOptionsChain(symbol) {
    const generateStrikes = (basePrice, count) => {
      const strikes = [];
      const step = basePrice * 0.025;

      for (let i = -count/2; i < count/2; i++) {
        strikes.push(Math.round(basePrice + (i * step)));
      }
      return strikes;
    };

    const basePrice = 100 + Math.random() * 400;
    const strikes = generateStrikes(basePrice, 10);

    const calls = strikes.map(strike => ({
      strike,
      bid: Math.max(0, (basePrice - strike) * 0.9 + Math.random() * 2).toFixed(2),
      ask: Math.max(0, (basePrice - strike) * 1.1 + Math.random() * 2).toFixed(2),
      volume: Math.floor(Math.random() * 1000),
      openInterest: Math.floor(Math.random() * 5000),
      impliedVolatility: (20 + Math.random() * 40).toFixed(2)
    }));

    const puts = strikes.map(strike => ({
      strike,
      bid: Math.max(0, (strike - basePrice) * 0.9 + Math.random() * 2).toFixed(2),
      ask: Math.max(0, (strike - basePrice) * 1.1 + Math.random() * 2).toFixed(2),
      volume: Math.floor(Math.random() * 1000),
      openInterest: Math.floor(Math.random() * 5000),
      impliedVolatility: (20 + Math.random() * 40).toFixed(2)
    }));

    return {
      symbol,
      currentPrice: basePrice.toFixed(2),
      expiration: '2024-12-20',
      calls,
      puts,
      putCallRatio: (0.8 + Math.random() * 0.4).toFixed(2),
      totalVolume: Math.floor(Math.random() * 100000),
      timestamp: new Date().toISOString()
    };
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

  clearCache() {
    this.cache.clear();
  }
}

module.exports = MarketDataTools;