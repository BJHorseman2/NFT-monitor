require('dotenv').config();
const FinancialAnalystAgent = require('./financialAnalystAgent');
const MarketDataTools = require('./marketDataTools');
const ReportGenerator = require('./reportGenerator');
const NFTAnalystAgent = require('./nftAnalystAgent');
const NFTDataTools = require('./nftDataTools');
const OpenSeaMonitor = require('./openSeaMonitor');

async function main() {
  console.log('🤖 Financial Analyst Agent Starting...\n');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ Please set ANTHROPIC_API_KEY in your .env file');
    process.exit(1);
  }

  const agent = new FinancialAnalystAgent(process.env.ANTHROPIC_API_KEY);
  const marketTools = new MarketDataTools();
  const reportGen = new ReportGenerator();
  const nftAgent = new NFTAnalystAgent(process.env.ANTHROPIC_API_KEY);
  const nftTools = new NFTDataTools();
  const openSeaMonitor = new OpenSeaMonitor(process.env.OPENSEA_API_KEY, process.env.ANTHROPIC_API_KEY);

  const command = process.argv[2];
  const args = process.argv.slice(3);

  try {
    switch (command) {
      case 'analyze':
        if (args.length === 0) {
          console.log('Usage: node index.js analyze <SYMBOL>');
          break;
        }
        console.log(`\n📊 Analyzing ${args[0].toUpperCase()}...\n`);
        const analysis = await agent.performStockAnalysis(args[0].toUpperCase());

        if (analysis.error) {
          console.error('❌ Error:', analysis.error);
        } else {
          console.log('\n=== MARKET DATA ===');
          console.log(`Price: $${analysis.marketData.price}`);
          console.log(`Change: ${analysis.marketData.change} (${analysis.marketData.changePercent})`);
          console.log(`Volume: ${analysis.marketData.volume}`);
          console.log(`Market Cap: ${analysis.marketData.marketCap}`);

          console.log('\n=== TECHNICAL INDICATORS ===');
          console.log(`Trend: ${analysis.technicalAnalysis.trend}`);
          console.log(`RSI: ${analysis.technicalAnalysis.rsi}`);
          console.log(`Momentum: ${analysis.technicalAnalysis.momentum}`);

          console.log('\n=== AI ANALYSIS ===');
          console.log(analysis.aiAnalysis);

          const htmlReport = await reportGen.generateHTMLReport(analysis);
          console.log(`\n✅ HTML report saved to: ${htmlReport}`);
        }
        break;

      case 'compare':
        if (args.length < 2) {
          console.log('Usage: node index.js compare <SYMBOL1> <SYMBOL2> [SYMBOL3...]');
          break;
        }
        console.log(`\n📊 Comparing stocks: ${args.join(', ')}\n`);
        const comparison = await agent.compareStocks(args.map(s => s.toUpperCase()));

        console.log('\n=== COMPARISON RESULTS ===');
        console.log(comparison.comparison);

        for (const analysis of comparison.individualAnalyses) {
          if (!analysis.error) {
            await reportGen.generateHTMLReport(analysis);
          }
        }
        console.log('\n✅ Individual reports generated');
        break;

      case 'monitor':
        console.log('📊 Starting portfolio monitoring...\n');
        const samplePortfolio = [
          { symbol: 'AAPL', shares: 100, purchasePrice: 150 },
          { symbol: 'GOOGL', shares: 50, purchasePrice: 130 },
          { symbol: 'MSFT', shares: 75, purchasePrice: 320 }
        ];

        const alerts = await agent.monitorPortfolio(samplePortfolio);

        if (alerts.length > 0) {
          console.log('🔔 ALERTS:');
          alerts.forEach(alert => {
            console.log(`${alert.type === 'GAIN' ? '📈' : '📉'} ${alert.message}`);
            console.log(`   Current value: $${alert.value.toFixed(2)}`);
          });
        } else {
          console.log('✅ No significant price movements detected');
        }
        break;

      case 'crypto':
        if (args.length === 0) {
          console.log('Usage: node index.js crypto <SYMBOL>');
          break;
        }
        const cryptoSymbol = args[0].toLowerCase();
        console.log(`\n🪙 Fetching crypto data for ${cryptoSymbol}...\n`);
        const cryptoData = await marketTools.fetchCryptoData(cryptoSymbol);

        if (cryptoData) {
          console.log('=== CRYPTO DATA ===');
          console.log(`Symbol: ${cryptoData.symbol}`);
          console.log(`Price: $${cryptoData.price}`);
          console.log(`24h Change: ${cryptoData.change24h?.toFixed(2)}%`);
          console.log(`24h Volume: $${cryptoData.volume24h?.toLocaleString()}`);
          console.log(`Market Cap: $${cryptoData.marketCap?.toLocaleString()}`);
        } else {
          console.log('❌ Failed to fetch crypto data');
        }
        break;

      case 'sentiment':
        if (args.length === 0) {
          console.log('Usage: node index.js sentiment <SYMBOL>');
          break;
        }
        const sentSymbol = args[0].toUpperCase();
        console.log(`\n😊 Analyzing sentiment for ${sentSymbol}...\n`);
        const sentiment = await marketTools.fetchMarketSentiment(sentSymbol);

        console.log('=== MARKET SENTIMENT ===');
        console.log(`Overall: ${sentiment.overall}`);
        console.log(`News Sentiment: ${sentiment.news}`);
        console.log(`Social Media:`);
        console.log(`  - Twitter: ${sentiment.social.twitter}`);
        console.log(`  - Reddit: ${sentiment.social.reddit}`);
        console.log(`  - StockTwits: ${sentiment.social.stocktwits}`);
        console.log(`Analyst Rating: ${sentiment.analystRating}`);
        console.log(`Fear & Greed Index: ${sentiment.fearGreedIndex}/100`);
        break;

      case 'sectors':
        console.log('\n📊 Fetching sector performance...\n');
        const sectors = await marketTools.fetchSectorPerformance();

        console.log('=== SECTOR PERFORMANCE ===');
        sectors.sectors.forEach(sector => {
          const emoji = sector.performance.includes('+') ? '📈' : '📉';
          console.log(`${emoji} ${sector.name}: ${sector.performance}`);
          console.log(`   Leaders: ${sector.leaders.join(', ')}`);
        });
        console.log(`\n🏆 Best Performing: ${sectors.bestPerforming}`);
        console.log(`📉 Worst Performing: ${sectors.worstPerforming}`);
        break;

      case 'reports':
        console.log('\n📁 Listing generated reports...\n');
        const reports = await reportGen.listReports();

        if (reports.length > 0) {
          console.log('=== AVAILABLE REPORTS ===');
          reports.forEach(report => {
            console.log(`📄 ${report.filename}`);
            console.log(`   Size: ${report.size}`);
            console.log(`   Modified: ${report.modified.toLocaleString()}`);
          });
        } else {
          console.log('No reports found');
        }
        break;

      case 'clean':
        console.log('\n🧹 Cleaning old reports...\n');
        const deleted = await reportGen.cleanOldReports(30);
        console.log(`✅ Deleted ${deleted} old reports (older than 30 days)`);
        break;

      case 'nft-scan':
        console.log('\n🎨 Scanning NFT collections for early movements...\n');
        const scanLimit = args[0] ? parseInt(args[0]) : 10;
        const scanResults = await nftAgent.scanTopCollections(scanLimit);

        console.log('\n=== TOP MOVERS ===');
        scanResults.topMovers.forEach(mover => {
          console.log(`\n${mover.collection} - Score: ${mover.score}%`);
          console.log(`Recommendation: ${mover.recommendation.action}`);
          mover.alerts.forEach(alert => {
            const emoji = alert.severity === 'HIGH' ? '🔴' : alert.severity === 'MEDIUM' ? '🟡' : '⚪';
            console.log(`  ${emoji} ${alert.message}`);
          });
        });

        if (scanResults.summary) {
          console.log('\n=== AI MARKET SUMMARY ===');
          console.log(scanResults.summary);
        }
        break;

      case 'nft-detect':
        if (args.length === 0) {
          console.log('Usage: node index.js nft-detect <COLLECTION_SLUG>');
          break;
        }
        console.log(`\n🔍 Detecting early movements for ${args[0]}...\n`);
        const detection = await nftAgent.detectEarlyMovement(args[0]);

        console.log('=== MOVEMENT DETECTION ===');
        console.log(`Score: ${detection.score}%`);
        console.log(`Action: ${detection.recommendation.action}`);
        console.log(`Confidence: ${detection.recommendation.confidence}`);

        if (detection.alerts.length > 0) {
          console.log('\n=== ALERTS ===');
          detection.alerts.forEach(alert => {
            const emoji = alert.severity === 'HIGH' ? '🔴' : alert.severity === 'MEDIUM' ? '🟡' : '⚪';
            console.log(`${emoji} ${alert.type}: ${alert.message}`);
          });
        }

        console.log('\n=== SIGNALS ===');
        Object.entries(detection.signals).forEach(([signal, active]) => {
          console.log(`${active ? '✅' : '❌'} ${signal}`);
        });

        console.log(`\nRecommendation: ${detection.recommendation.recommendation}`);
        break;

      case 'nft-markets':
        if (args.length === 0) {
          console.log('Usage: node index.js nft-markets <COLLECTION>');
          break;
        }
        console.log(`\n📊 Fetching cross-marketplace data for ${args[0]}...\n`);
        const marketData = await nftTools.fetchMultipleMarketplaces(args[0]);

        if (marketData) {
          console.log('=== AGGREGATED DATA ===');
          console.log(`Lowest Floor: ${marketData.aggregated.lowestFloor.toFixed(3)} ETH`);
          console.log(`Average Floor: ${marketData.aggregated.averageFloor.toFixed(3)} ETH`);
          console.log(`Total Volume (24h): ${marketData.aggregated.totalVolume24h.toFixed(2)} ETH`);
          console.log(`Total Sales (24h): ${marketData.aggregated.totalSales24h}`);

          if (marketData.arbitrage.length > 0) {
            console.log('\n=== ARBITRAGE OPPORTUNITIES ===');
            marketData.arbitrage.forEach(opp => {
              console.log(`Buy on ${opp.buy} at ${opp.buyPrice.toFixed(3)} ETH`);
              console.log(`Sell on ${opp.sell} at ${opp.sellPrice.toFixed(3)} ETH`);
              console.log(`Potential Profit: ${opp.profit.toFixed(3)} ETH (${opp.profitPercent.toFixed(1)}%)\n`);
            });
          }

          console.log('\n=== MARKETPLACE BREAKDOWN ===');
          Object.values(marketData.byMarketplace).filter(m => m).forEach(market => {
            console.log(`${market.marketplace}: Floor ${market.floorPrice.toFixed(3)} ETH, Volume ${market.volume24h.toFixed(2)} ETH`);
          });
        }
        break;

      case 'nft-social':
        if (args.length === 0) {
          console.log('Usage: node index.js nft-social <COLLECTION>');
          break;
        }
        console.log(`\n📱 Analyzing social signals for ${args[0]}...\n`);

        const twitterMetrics = await nftTools.fetchTwitterMetrics(args[0]);
        const discordMetrics = await nftTools.fetchDiscordMetrics(args[0]);

        if (twitterMetrics) {
          console.log('=== TWITTER METRICS ===');
          console.log(`Mentions (24h): ${twitterMetrics.mentions24h}`);
          console.log(`Growth Rate: ${twitterMetrics.growthRate}%`);
          console.log(`Sentiment: ${twitterMetrics.sentiment.type} (${twitterMetrics.sentiment.score})`);
          console.log(`Viral Potential: ${twitterMetrics.viralPotential.rating} (Score: ${twitterMetrics.viralPotential.score})`);
          console.log(`Influencer Engagement: ${twitterMetrics.influencerEngagement}`);
          console.log(`Trending Hashtag: ${twitterMetrics.hashtagTrending ? '✅' : '❌'}`);
        }

        if (discordMetrics) {
          console.log('\n=== DISCORD METRICS ===');
          console.log(`Members: ${discordMetrics.memberCount.toLocaleString()}`);
          console.log(`Online: ${discordMetrics.onlineMembers.toLocaleString()} (${discordMetrics.engagementRate}%)`);
          console.log(`Messages/Hour: ${discordMetrics.messagesPerHour}`);
          console.log(`Activity Score: ${discordMetrics.activityScore.rating} (${discordMetrics.activityScore.score})`);
          console.log(`Recent Announcement: ${discordMetrics.announcement24h ? '✅' : '❌'}`);

          if (discordMetrics.activityScore.insights.length > 0) {
            console.log('\nInsights:');
            discordMetrics.activityScore.insights.forEach(insight => {
              console.log(`  • ${insight}`);
            });
          }
        }
        break;

      case 'nft-chain':
        if (args.length === 0) {
          console.log('Usage: node index.js nft-chain <CONTRACT_ADDRESS>');
          break;
        }
        console.log(`\n⛓️ Fetching on-chain metrics for ${args[0]}...\n`);
        const onChainData = await nftTools.fetchOnChainMetrics(args[0]);

        if (onChainData) {
          console.log('=== HOLDER METRICS ===');
          console.log(`Unique Holders: ${onChainData.uniqueHolders.toLocaleString()}`);
          console.log(`Whale Concentration: ${onChainData.whaleConcentration}%`);
          console.log(`Diamond Hands: ${onChainData.diamondHands}`);
          console.log(`Paper Hands: ${onChainData.paperHands}`);
          console.log(`Average Hold Time: ${onChainData.averageHoldTime} days`);

          console.log('\n=== DISTRIBUTION ===');
          console.log(`Top 1%: ${onChainData.holderDistribution.top1Percent} holders`);
          console.log(`Top 10%: ${onChainData.holderDistribution.top10Percent} holders`);
          console.log(`Gini Coefficient: ${onChainData.holderDistribution.giniCoefficient}`);

          console.log('\n=== LIQUIDITY ===');
          console.log(`Score: ${onChainData.liquidityScore.score} (${onChainData.liquidityScore.rating})`);
          if (onChainData.liquidityScore.risks.length > 0) {
            console.log('Risks:');
            onChainData.liquidityScore.risks.forEach(risk => {
              console.log(`  ⚠️ ${risk}`);
            });
          }

          if (onChainData.stakingActive) {
            console.log(`\nStaking: Active (${onChainData.stakedPercent}% staked)`);
          }
        }
        break;

      case 'nft-history':
        if (args.length === 0) {
          console.log('Usage: node index.js nft-history <COLLECTION> [DAYS]');
          break;
        }
        const days = args[1] ? parseInt(args[1]) : 30;
        console.log(`\n📈 Fetching ${days}-day history for ${args[0]}...\n`);
        const history = await nftTools.fetchHistoricalPriceData(args[0], days);

        if (history) {
          console.log('=== TREND ANALYSIS ===');
          console.log(`Trend: ${history.analysis.trend}`);
          console.log(`Volatility: ${history.analysis.volatility}`);
          console.log(`Momentum: ${history.analysis.momentum}`);
          console.log(`Average Volume: ${history.analysis.averageVolume} ETH`);

          console.log('\n=== PRICE RANGE ===');
          console.log(`Current: ${history.analysis.priceRange.current} ETH`);
          console.log(`Min: ${history.analysis.priceRange.min} ETH`);
          console.log(`Max: ${history.analysis.priceRange.max} ETH`);

          console.log('\n=== KEY LEVELS ===');
          console.log('Support Levels:', history.support.join(', '));
          console.log('Resistance Levels:', history.resistance.join(', '));
        }
        break;

      case 'nft-predict':
        console.log('\n🔮 Generating NFT movement predictions...\n');
        const predictions = await nftAgent.predictNextMovers();

        console.log('=== PREDICTED MOVERS ===');
        predictions.predictions.forEach((pred, index) => {
          console.log(`\n${index + 1}. ${pred.collection}`);
          console.log(`   Probability: ${(pred.probability * 100).toFixed(0)}%`);
          console.log(`   Timeframe: ${pred.timeframe}`);
          console.log(`   Risk Level: ${pred.riskLevel}`);
          console.log(`   Catalysts:`);
          pred.catalysts.forEach(catalyst => {
            console.log(`     • ${catalyst}`);
          });
        });

        if (predictions.strategy) {
          console.log('\n=== TRADING STRATEGY ===');
          console.log(predictions.strategy);
        }
        break;

      case 'opensea-monitor':
        if (args.length === 0) {
          console.log('Usage: node index.js opensea-monitor <COLLECTION_SLUG>');
          break;
        }
        console.log(`\n🔍 Starting OpenSea monitoring for ${args[0]}...\n`);
        const monitor = await openSeaMonitor.monitorCollection(args[0], args[1] ? parseInt(args[1]) : 5);

        process.on('SIGINT', () => {
          console.log('\n\nStopping monitor...');
          monitor.stop();
          process.exit(0);
        });
        break;

      case 'opensea-scan':
        console.log('\n🎯 Scanning OpenSea for unusual activity...\n');
        const limit = args[0] ? parseInt(args[0]) : 100;
        const unusual = await openSeaMonitor.scanTopCollections(limit);

        if (unusual.length === 0) {
          console.log('No unusual activity detected in top collections');
        } else {
          console.log(`Found ${unusual.length} collections with unusual activity:\n`);
          unusual.slice(0, 10).forEach((collection, index) => {
            console.log(`${index + 1}. ${collection.collection} (Risk Score: ${collection.riskScore}/100)`);
            console.log(`   Action: ${collection.recommendation.action} (${collection.recommendation.confidence})`);
            collection.alerts.forEach(alert => {
              const emoji = alert.severity === 'HIGH' ? '🔴' : alert.severity === 'MEDIUM' ? '🟡' : '⚪';
              console.log(`   ${emoji} ${alert.message}`);
            });
            console.log('');
          });
        }
        break;

      case 'opensea-whales':
        if (args.length === 0) {
          console.log('Usage: node index.js opensea-whales <COLLECTION_SLUG> [MIN_ETH]');
          break;
        }
        const minValue = args[1] ? parseFloat(args[1]) : 10;
        console.log(`\n🐋 Tracking whale activity for ${args[0]} (min ${minValue} ETH)...\n`);
        const whaleData = await openSeaMonitor.trackWhaleActivity(args[0], minValue);

        console.log('=== WHALE ACTIVITY ===');
        console.log(`Active Whales: ${whaleData.whaleCount}`);
        console.log(`Total Whale Volume: ${whaleData.totalWhaleVolume.toFixed(2)} ETH`);
        console.log(`Whale Transactions: ${whaleData.whaleTransactions}`);
        console.log(`\nPattern: ${whaleData.analysis.pattern}`);
        console.log(`Interpretation: ${whaleData.analysis.interpretation}`);

        if (whaleData.analysis.urgency) {
          console.log(`Urgency: ${whaleData.analysis.urgency}`);
        }

        if (whaleData.topWhales.length > 0) {
          console.log('\n=== TOP WHALES ===');
          whaleData.topWhales.forEach((whale, index) => {
            console.log(`${index + 1}. ${whale.address.substring(0, 8)}...`);
            console.log(`   Purchases: ${whale.purchases.length}`);
            console.log(`   Total Spent: ${whale.totalSpent.toFixed(2)} ETH`);
          });
        }
        break;

      case 'opensea-trending':
        console.log('\n📈 Finding trending collections on OpenSea...\n');
        const trending = await openSeaMonitor.findTrendingCollections();

        if (trending.length === 0) {
          console.log('No significantly trending collections found');
        } else {
          console.log('=== TRENDING COLLECTIONS (>50% daily change) ===\n');
          trending.forEach((collection, index) => {
            const changeEmoji = collection.oneDayChange > 0 ? '🚀' : '💥';
            console.log(`${index + 1}. ${collection.name || collection.collection}`);
            console.log(`   ${changeEmoji} 24h Change: ${collection.oneDayChange.toFixed(1)}%`);
            console.log(`   Floor: ${collection.floorPrice} ETH`);
            console.log(`   24h Volume: ${collection.oneDayVolume.toFixed(2)} ETH`);
            console.log(`   24h Sales: ${collection.oneDaySales}\n`);
          });
        }
        break;

      case 'opensea-stats':
        if (args.length === 0) {
          console.log('Usage: node index.js opensea-stats <COLLECTION_SLUG>');
          break;
        }
        console.log(`\n📊 Fetching OpenSea stats for ${args[0]}...\n`);
        const stats = await openSeaMonitor.fetchCollectionStats(args[0]);

        if (stats) {
          console.log('=== COLLECTION STATS ===');
          console.log(`Floor Price: ${stats.stats.floorPrice} ${stats.stats.floorPriceSymbol}`);
          console.log(`Market Cap: ${stats.stats.marketCap.toFixed(2)} ETH`);
          console.log(`Total Volume: ${stats.stats.totalVolume.toFixed(2)} ETH`);
          console.log(`Total Supply: ${stats.stats.totalSupply.toLocaleString()}`);
          console.log(`Unique Owners: ${stats.stats.numOwners.toLocaleString()}`);

          console.log('\n=== 24H METRICS ===');
          console.log(`Volume: ${stats.stats.oneDayVolume.toFixed(2)} ETH`);
          console.log(`Change: ${stats.stats.oneDayChange.toFixed(1)}%`);
          console.log(`Sales: ${stats.stats.oneDaySales}`);
          console.log(`Avg Price: ${stats.stats.oneDayAveragePrice.toFixed(3)} ETH`);

          console.log('\n=== 7D METRICS ===');
          console.log(`Volume: ${stats.stats.sevenDayVolume.toFixed(2)} ETH`);
          console.log(`Change: ${stats.stats.sevenDayChange.toFixed(1)}%`);
          console.log(`Sales: ${stats.stats.sevenDaySales}`);

          console.log('\n=== 30D METRICS ===');
          console.log(`Volume: ${stats.stats.thirtyDayVolume.toFixed(2)} ETH`);
          console.log(`Change: ${stats.stats.thirtyDayChange.toFixed(1)}%`);
          console.log(`Sales: ${stats.stats.thirtyDaySales}`);

          const analysis = await openSeaMonitor.detectUnusualActivity(args[0]);
          if (analysis && analysis.alerts.length > 0) {
            console.log('\n=== ALERTS ===');
            analysis.alerts.forEach(alert => {
              const emoji = alert.severity === 'HIGH' ? '🔴' : alert.severity === 'MEDIUM' ? '🟡' : '⚪';
              console.log(`${emoji} ${alert.type}: ${alert.message}`);
            });
            console.log(`\nRecommendation: ${analysis.recommendation.action} (${analysis.recommendation.confidence})`);
            console.log(`Reasoning: ${analysis.recommendation.reasoning}`);
          }
        } else {
          console.log('Failed to fetch stats');
        }
        break;

      case 'nft-rarity':
        if (args.length === 0) {
          console.log('Usage: node index.js nft-rarity <COLLECTION>');
          break;
        }
        console.log(`\n💎 Analyzing rarity movements for ${args[0]}...\n`);
        const rarityAnalysis = await nftAgent.analyzeRarityMovement(args[0]);

        console.log('=== RARITY TIER ANALYSIS ===');
        Object.entries(rarityAnalysis.rarityAnalysis).forEach(([tier, data]) => {
          const changeEmoji = data.priceChange > 0 ? '📈' : data.priceChange < 0 ? '📉' : '➡️';
          console.log(`\n${tier}:`);
          console.log(`  Floor: ${data.floorPrice} ETH ${changeEmoji} ${data.priceChange.toFixed(1)}%`);
          console.log(`  Volume: ${data.volume24h} ETH`);
          console.log(`  Listings: ${data.listings}`);
        });

        if (rarityAnalysis.significantMovements.length > 0) {
          console.log('\n=== SIGNIFICANT MOVEMENTS ===');
          rarityAnalysis.significantMovements.forEach(movement => {
            const emoji = movement.change > 0 ? '🚀' : '💥';
            console.log(`${emoji} ${movement.message}`);
          });
        }

        console.log(`\nRecommendation: ${rarityAnalysis.recommendation}`);
        break;

      default:
        console.log(`
🤖 Financial Analyst Agent - Available Commands:

STOCK ANALYSIS:
  node index.js analyze <SYMBOL>        - Perform full stock analysis
  node index.js compare <SYM1> <SYM2>   - Compare multiple stocks
  node index.js monitor                 - Monitor portfolio for alerts
  node index.js crypto <SYMBOL>         - Get cryptocurrency data
  node index.js sentiment <SYMBOL>      - Analyze market sentiment
  node index.js sectors                 - View sector performance

NFT ANALYSIS:
  node index.js nft-scan [LIMIT]        - Scan top NFT collections for movements
  node index.js nft-detect <COLLECTION> - Detect early movements in collection
  node index.js nft-markets <COLLECTION>- Cross-marketplace arbitrage analysis
  node index.js nft-social <COLLECTION> - Social signal analysis
  node index.js nft-chain <ADDRESS>     - On-chain holder analysis
  node index.js nft-history <COL> [DAYS]- Historical price analysis
  node index.js nft-predict             - Predict next NFT movers
  node index.js nft-rarity <COLLECTION> - Rarity tier movement analysis

OPENSEA FOCUSED:
  node index.js opensea-monitor <SLUG>  - Real-time OpenSea monitoring
  node index.js opensea-scan [LIMIT]    - Scan for unusual OpenSea activity
  node index.js opensea-whales <SLUG>   - Track whale purchases on OpenSea
  node index.js opensea-trending        - Find trending OpenSea collections
  node index.js opensea-stats <SLUG>    - Detailed OpenSea collection stats

UTILITIES:
  node index.js reports                 - List generated reports
  node index.js clean                   - Clean old reports

Examples:
  node index.js analyze AAPL
  node index.js nft-scan 20
  node index.js nft-detect boredapeyachtclub
  node index.js nft-social azuki
  node index.js nft-predict
        `);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();