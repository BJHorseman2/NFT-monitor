# OpenSea API Setup Guide

## Getting Your OpenSea API Key

1. **Sign up for OpenSea API Access**
   - Visit: https://docs.opensea.io/reference/api-keys
   - Click "Get API Key"
   - Fill out the application form
   - Wait for approval (usually 1-3 days)

2. **Alternative: Use Reservoir API (Faster)**
   - Visit: https://reservoir.tools/
   - Sign up for free tier (instant access)
   - Get 100,000 free API calls/month
   - Better historical data than OpenSea

3. **Add API Key to .env**
   ```bash
   OPENSEA_API_KEY=your_opensea_api_key_here
   ```

## Available OpenSea Commands

### Real-Time Monitoring
```bash
# Monitor a collection every 5 minutes
node index.js opensea-monitor boredapeyachtclub

# Monitor with custom interval (minutes)
node index.js opensea-monitor azuki 2
```

### Scan for Unusual Activity
```bash
# Scan top 100 collections
node index.js opensea-scan

# Scan specific number of collections
node index.js opensea-scan 50
```

### Track Whale Activity
```bash
# Track whales (>10 ETH purchases)
node index.js opensea-whales cryptopunks

# Custom minimum threshold
node index.js opensea-whales bayc 5
```

### Find Trending Collections
```bash
# Collections with >50% daily change
node index.js opensea-trending
```

### Get Detailed Stats
```bash
# Full collection statistics
node index.js opensea-stats doodles-official
```

## Key Detection Features

### Alert Types
- **VOLUME_SURGE**: Volume increased >100% in 24h
- **SALES_SPIKE**: Sales 3x above 30-day average
- **FLOOR_PUMP**: Floor price increased >20%
- **FLOOR_DUMP**: Floor price decreased >20%
- **MARKET_CAP_SHIFT**: Significant market cap change
- **WHALE_ACCUMULATION**: Multiple large purchases detected

### Risk Scoring
- 0-30: Low risk/activity
- 31-60: Medium risk/opportunity
- 61-100: High risk/strong signal

### Recommendations
- **BUY**: Multiple strong bullish signals
- **HOLD**: Normal activity patterns
- **WATCH**: Activity detected, needs confirmation
- **WAIT**: Declining activity, wait for stabilization

## Understanding Collection Slugs

OpenSea uses "slugs" to identify collections:
- Bored Ape Yacht Club: `boredapeyachtclub`
- Azuki: `azuki`
- Doodles: `doodles-official`
- CryptoPunks: `cryptopunks`
- Pudgy Penguins: `pudgypenguins`

Find slugs in the OpenSea URL: opensea.io/collection/**[slug-here]**

## Rate Limits

OpenSea API limits:
- 4 requests/second
- 200 requests/minute

The monitor automatically handles rate limiting with delays.

## Example Workflow

1. **Morning Scan**
   ```bash
   node index.js opensea-scan 200
   ```

2. **Check Trending**
   ```bash
   node index.js opensea-trending
   ```

3. **Deep Dive Interesting Collection**
   ```bash
   node index.js opensea-stats interesting-collection
   node index.js opensea-whales interesting-collection
   ```

4. **Set Monitor on Hot Collection**
   ```bash
   node index.js opensea-monitor hot-collection 3
   ```

## Interpreting Signals

### Strong Buy Signals
- Volume surge >300% + Floor pump >20%
- Multiple whale purchases in <1 hour
- Sales spike + Price increase + High social activity

### Warning Signals
- Floor dump >30% with high volume
- Whales selling (implement in future)
- Sudden listing spike

### False Positives to Avoid
- Single large sale skewing averages
- Wash trading patterns
- Manipulated floor prices

## Troubleshooting

### API Key Issues
- Ensure key is in .env file
- Check key permissions on OpenSea
- Verify no extra spaces in key

### No Data Returned
- Check collection slug spelling
- Collection might be new/delisted
- API might be rate limited

### Alternative Data Sources
If OpenSea API is unavailable:
- Reservoir API (better for historical)
- Alchemy NFT API
- Moralis NFT API
- Direct blockchain queries