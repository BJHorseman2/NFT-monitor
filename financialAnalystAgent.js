const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
require('dotenv').config();

class FinancialAnalystAgent {
  constructor(apiKey) {
    this.anthropic = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY
    });
    this.context = [];
    this.maxContextSize = 10;
  }

  async gatherMarketData(symbol) {
    try {
      const yahooFinanceUrl = `https://finance.yahoo.com/quote/${symbol}`;
      const response = await axios.get(yahooFinanceUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);

      const data = {
        symbol: symbol,
        price: $('fin-streamer[data-field="regularMarketPrice"]').first().text() || 'N/A',
        change: $('fin-streamer[data-field="regularMarketChange"]').first().text() || 'N/A',
        changePercent: $('fin-streamer[data-field="regularMarketChangePercent"]').first().text() || 'N/A',
        volume: $('fin-streamer[data-field="regularMarketVolume"]').first().text() || 'N/A',
        marketCap: $('[data-field="marketCap"]').first().text() || 'N/A',
        pe: $('[data-field="trailingPE"]').first().text() || 'N/A',
        timestamp: new Date().toISOString()
      };

      return data;
    } catch (error) {
      console.error(`Error fetching market data for ${symbol}:`, error.message);
      return null;
    }
  }

  async fetchNewsHeadlines(query) {
    try {
      const searchUrl = `https://news.google.com/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const headlines = [];

      $('article h3').each((i, element) => {
        if (i < 5) {
          headlines.push($(element).text());
        }
      });

      return headlines;
    } catch (error) {
      console.error('Error fetching news:', error.message);
      return [];
    }
  }

  async analyzeTechnicalIndicators(historicalData) {
    if (!historicalData || historicalData.length < 20) {
      return { error: 'Insufficient data for technical analysis' };
    }

    const prices = historicalData.map(d => parseFloat(d.close));

    const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const sma50 = prices.length >= 50 ?
      prices.slice(-50).reduce((a, b) => a + b, 0) / 50 : null;

    const currentPrice = prices[prices.length - 1];
    const rsi = this.calculateRSI(prices, 14);

    const volatility = this.calculateVolatility(prices.slice(-20));

    return {
      sma20: sma20.toFixed(2),
      sma50: sma50 ? sma50.toFixed(2) : 'N/A',
      rsi: rsi.toFixed(2),
      volatility: (volatility * 100).toFixed(2) + '%',
      trend: currentPrice > sma20 ? 'Bullish' : 'Bearish',
      momentum: rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral'
    };
  }

  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
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

  async generateAnalysisReport(symbol, marketData, news, technicalAnalysis) {
    const prompt = `
    As a financial analyst, provide a comprehensive analysis report for ${symbol} based on the following data:

    Current Market Data:
    - Price: ${marketData.price}
    - Change: ${marketData.change} (${marketData.changePercent})
    - Volume: ${marketData.volume}
    - Market Cap: ${marketData.marketCap}
    - P/E Ratio: ${marketData.pe}

    Technical Indicators:
    - SMA20: ${technicalAnalysis.sma20}
    - SMA50: ${technicalAnalysis.sma50}
    - RSI: ${technicalAnalysis.rsi}
    - Volatility: ${technicalAnalysis.volatility}
    - Trend: ${technicalAnalysis.trend}
    - Momentum: ${technicalAnalysis.momentum}

    Recent News Headlines:
    ${news.map((h, i) => `${i + 1}. ${h}`).join('\n')}

    Please provide:
    1. Market Overview
    2. Technical Analysis Interpretation
    3. Risk Assessment
    4. Investment Recommendation (Buy/Hold/Sell) with justification
    5. Key Factors to Monitor
    `;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      return response.content[0].text;
    } catch (error) {
      console.error('Error generating analysis:', error);
      return 'Unable to generate analysis at this time.';
    }
  }

  async performStockAnalysis(symbol) {
    console.log(`Starting analysis for ${symbol}...`);

    console.log('1. Gathering market data...');
    const marketData = await this.gatherMarketData(symbol);

    if (!marketData) {
      return { error: 'Failed to fetch market data' };
    }

    console.log('2. Fetching news headlines...');
    const news = await this.fetchNewsHeadlines(`${symbol} stock`);

    console.log('3. Performing technical analysis...');
    const mockHistoricalData = this.generateMockHistoricalData(100);
    const technicalAnalysis = await this.analyzeTechnicalIndicators(mockHistoricalData);

    console.log('4. Generating AI analysis report...');
    const report = await this.generateAnalysisReport(symbol, marketData, news, technicalAnalysis);

    const fullReport = {
      symbol,
      timestamp: new Date().toISOString(),
      marketData,
      news,
      technicalAnalysis,
      aiAnalysis: report
    };

    await this.saveReport(fullReport);

    return fullReport;
  }

  generateMockHistoricalData(days) {
    const data = [];
    let basePrice = 100;

    for (let i = 0; i < days; i++) {
      const change = (Math.random() - 0.5) * 5;
      basePrice += change;
      data.push({
        date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000),
        close: basePrice,
        volume: Math.floor(Math.random() * 1000000) + 500000
      });
    }

    return data;
  }

  async saveReport(report) {
    const filename = `reports/${report.symbol}_${new Date().toISOString().split('T')[0]}.json`;

    try {
      await fs.mkdir('reports', { recursive: true });
      await fs.writeFile(filename, JSON.stringify(report, null, 2));
      console.log(`Report saved to ${filename}`);
    } catch (error) {
      console.error('Error saving report:', error);
    }
  }

  async compareStocks(symbols) {
    const analyses = [];

    for (const symbol of symbols) {
      console.log(`\nAnalyzing ${symbol}...`);
      const analysis = await this.performStockAnalysis(symbol);
      analyses.push(analysis);
    }

    const comparisonPrompt = `
    Compare the following stocks and provide a ranking with justification:

    ${analyses.map(a => `
    ${a.symbol}:
    - Price: ${a.marketData.price}
    - Change: ${a.marketData.changePercent}
    - P/E: ${a.marketData.pe}
    - Trend: ${a.technicalAnalysis.trend}
    - RSI: ${a.technicalAnalysis.rsi}
    `).join('\n')}

    Provide a clear ranking from best to worst investment opportunity with detailed reasoning.
    `;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: comparisonPrompt
          }
        ]
      });

      return {
        individualAnalyses: analyses,
        comparison: response.content[0].text
      };
    } catch (error) {
      console.error('Error comparing stocks:', error);
      return { individualAnalyses: analyses, comparison: 'Unable to generate comparison' };
    }
  }

  async monitorPortfolio(portfolio) {
    console.log('Monitoring portfolio...');
    const alerts = [];

    for (const holding of portfolio) {
      const marketData = await this.gatherMarketData(holding.symbol);

      if (marketData) {
        const currentPrice = parseFloat(marketData.price);
        const changePercent = parseFloat(marketData.changePercent.replace('%', ''));

        if (Math.abs(changePercent) > 5) {
          alerts.push({
            symbol: holding.symbol,
            type: changePercent > 0 ? 'GAIN' : 'LOSS',
            message: `${holding.symbol} has moved ${changePercent}% today`,
            currentPrice,
            holdings: holding.shares,
            value: currentPrice * holding.shares
          });
        }
      }
    }

    return alerts;
  }
}

module.exports = FinancialAnalystAgent;