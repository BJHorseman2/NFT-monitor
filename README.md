# Financial Analyst Agent

A sophisticated AI-powered financial analysis agent built with the Claude Agent SDK. This agent performs comprehensive stock analysis, technical indicators, sentiment analysis, and generates detailed reports.

## Features

- **Stock Analysis**: Comprehensive analysis including price, volume, market cap, and P/E ratios
- **Technical Indicators**: SMA, RSI, volatility calculations, and trend analysis
- **AI-Powered Insights**: Uses Claude AI to generate investment recommendations
- **Market Sentiment**: Analyzes social media and news sentiment
- **Sector Performance**: Tracks performance across different market sectors
- **Crypto Support**: Fetches and analyzes cryptocurrency data
- **Report Generation**: Creates HTML and Markdown reports with visualizations
- **Portfolio Monitoring**: Tracks portfolio performance and generates alerts

## Installation

1. Clone the repository:
```bash
cd financial-analyst-agent
```

2. Install dependencies:
```bash
npm install
```

3. Set up your API key:
   - Copy `.env.example` to `.env`
   - Add your Anthropic API key to the `.env` file

## Usage

### Basic Stock Analysis
```bash
node index.js analyze AAPL
```

### Compare Multiple Stocks
```bash
node index.js compare MSFT GOOGL AMZN
```

### Monitor Portfolio
```bash
node index.js monitor
```

### Cryptocurrency Analysis
```bash
node index.js crypto bitcoin
```

### Market Sentiment Analysis
```bash
node index.js sentiment TSLA
```

### Sector Performance
```bash
node index.js sectors
```

### View Generated Reports
```bash
node index.js reports
```

### Clean Old Reports
```bash
node index.js clean
```

## Project Structure

```
financial-analyst-agent/
├── index.js                 # Main entry point and CLI
├── financialAnalystAgent.js # Core agent with analysis logic
├── marketDataTools.js       # Market data fetching utilities
├── reportGenerator.js       # Report generation and formatting
├── reports/                 # Generated analysis reports
├── .env                     # Environment variables (API keys)
└── package.json            # Dependencies and scripts
```

## Key Components

### FinancialAnalystAgent
The main agent class that orchestrates:
- Market data gathering
- Technical analysis calculations
- News fetching
- AI-powered analysis generation
- Stock comparison
- Portfolio monitoring

### MarketDataTools
Provides utilities for:
- Fetching cryptocurrency data
- Forex data retrieval
- Economic indicators
- Sector performance tracking
- Market sentiment analysis
- Options chain data

### ReportGenerator
Handles:
- HTML report generation with styling
- Markdown report creation
- Portfolio performance reports
- Report management and cleanup

## Technical Indicators

The agent calculates several technical indicators:
- **SMA (Simple Moving Average)**: 20-day and 50-day
- **RSI (Relative Strength Index)**: 14-period RSI
- **Volatility**: Standard deviation of returns
- **Trend Analysis**: Bullish/Bearish determination
- **Momentum**: Overbought/Oversold conditions

## API Integration

The agent integrates with:
- **Claude AI**: For intelligent analysis and recommendations
- **Yahoo Finance**: Stock market data (web scraping)
- **CoinGecko**: Cryptocurrency data
- **Google News**: News headlines
- **Exchange Rate API**: Forex data

## Report Types

### Stock Analysis Report
- Current market data
- Technical indicators
- Recent news
- AI-generated analysis
- Investment recommendations

### Portfolio Report
- Total portfolio value
- Individual holdings performance
- Gain/loss calculations
- Price alerts
- Visual charts

## Environment Variables

```env
ANTHROPIC_API_KEY=your_claude_api_key_here
```

## Error Handling

The agent includes robust error handling for:
- API failures
- Network issues
- Invalid symbols
- Missing data
- Rate limiting

## Caching

Market data is cached for 5 minutes to:
- Reduce API calls
- Improve performance
- Handle rate limits

## Future Enhancements

Potential improvements:
- Real-time data streaming
- Advanced charting
- Backtesting capabilities
- Options strategies
- Risk modeling
- Integration with trading platforms
- Machine learning predictions
- Custom alert rules

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!