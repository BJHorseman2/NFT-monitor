const fs = require('fs').promises;
const path = require('path');

class ReportGenerator {
  constructor() {
    this.reportsDir = 'reports';
    this.templatesDir = 'templates';
  }

  async generateHTMLReport(analysis) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Financial Analysis Report - ${analysis.symbol}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
            color: #2d3748;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        h2 {
            color: #4a5568;
            margin-top: 30px;
            border-left: 4px solid #764ba2;
            padding-left: 10px;
        }
        .metric-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .metric-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            margin: 10px 0;
        }
        .metric-label {
            font-size: 14px;
            opacity: 0.9;
        }
        .positive {
            color: #48bb78;
        }
        .negative {
            color: #f56565;
        }
        .news-item {
            background: #f7fafc;
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            border-left: 3px solid #667eea;
        }
        .technical-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .technical-table th {
            background: #667eea;
            color: white;
            padding: 12px;
            text-align: left;
        }
        .technical-table td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
        }
        .ai-analysis {
            background: #f7fafc;
            padding: 20px;
            border-radius: 10px;
            line-height: 1.6;
            white-space: pre-wrap;
        }
        .timestamp {
            color: #718096;
            font-size: 14px;
            text-align: right;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Financial Analysis Report: ${analysis.symbol}</h1>

        <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-label">Current Price</div>
                <div class="metric-value">$${analysis.marketData.price}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Change</div>
                <div class="metric-value ${analysis.marketData.change.includes('-') ? 'negative' : 'positive'}">
                    ${analysis.marketData.change} (${analysis.marketData.changePercent})
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Volume</div>
                <div class="metric-value">${analysis.marketData.volume}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Market Cap</div>
                <div class="metric-value">${analysis.marketData.marketCap}</div>
            </div>
        </div>

        <h2>📈 Technical Indicators</h2>
        <table class="technical-table">
            <tr>
                <th>Indicator</th>
                <th>Value</th>
                <th>Signal</th>
            </tr>
            <tr>
                <td>SMA 20</td>
                <td>${analysis.technicalAnalysis.sma20}</td>
                <td>${analysis.technicalAnalysis.trend}</td>
            </tr>
            <tr>
                <td>SMA 50</td>
                <td>${analysis.technicalAnalysis.sma50}</td>
                <td>-</td>
            </tr>
            <tr>
                <td>RSI</td>
                <td>${analysis.technicalAnalysis.rsi}</td>
                <td>${analysis.technicalAnalysis.momentum}</td>
            </tr>
            <tr>
                <td>Volatility</td>
                <td>${analysis.technicalAnalysis.volatility}</td>
                <td>-</td>
            </tr>
        </table>

        <h2>📰 Recent News</h2>
        <div class="news-section">
            ${analysis.news.map(headline => `
                <div class="news-item">${headline}</div>
            `).join('')}
        </div>

        <h2>🤖 AI Analysis</h2>
        <div class="ai-analysis">
            ${analysis.aiAnalysis}
        </div>

        <div class="timestamp">
            Generated: ${new Date(analysis.timestamp).toLocaleString()}
        </div>
    </div>
</body>
</html>`;

    const filename = `${this.reportsDir}/${analysis.symbol}_${new Date().toISOString().split('T')[0]}.html`;
    await fs.mkdir(this.reportsDir, { recursive: true });
    await fs.writeFile(filename, html);

    return filename;
  }

  async generateMarkdownReport(analysis) {
    const markdown = `# Financial Analysis Report: ${analysis.symbol}

## Market Data
- **Price**: $${analysis.marketData.price}
- **Change**: ${analysis.marketData.change} (${analysis.marketData.changePercent})
- **Volume**: ${analysis.marketData.volume}
- **Market Cap**: ${analysis.marketData.marketCap}
- **P/E Ratio**: ${analysis.marketData.pe}

## Technical Analysis
| Indicator | Value | Signal |
|-----------|-------|--------|
| SMA 20 | ${analysis.technicalAnalysis.sma20} | ${analysis.technicalAnalysis.trend} |
| SMA 50 | ${analysis.technicalAnalysis.sma50} | - |
| RSI | ${analysis.technicalAnalysis.rsi} | ${analysis.technicalAnalysis.momentum} |
| Volatility | ${analysis.technicalAnalysis.volatility} | - |

## Recent News
${analysis.news.map((h, i) => `${i + 1}. ${h}`).join('\n')}

## AI Analysis
${analysis.aiAnalysis}

---
*Generated: ${new Date(analysis.timestamp).toLocaleString()}*`;

    const filename = `${this.reportsDir}/${analysis.symbol}_${new Date().toISOString().split('T')[0]}.md`;
    await fs.mkdir(this.reportsDir, { recursive: true });
    await fs.writeFile(filename, markdown);

    return filename;
  }

  async generatePortfolioReport(portfolio, alerts) {
    let totalValue = 0;
    let totalCost = 0;

    const holdings = portfolio.map(holding => {
      const value = holding.currentPrice * holding.shares;
      const cost = holding.purchasePrice * holding.shares;
      const gain = value - cost;
      const gainPercent = ((gain / cost) * 100).toFixed(2);

      totalValue += value;
      totalCost += cost;

      return {
        ...holding,
        currentValue: value.toFixed(2),
        totalCost: cost.toFixed(2),
        gain: gain.toFixed(2),
        gainPercent
      };
    });

    const totalGain = totalValue - totalCost;
    const totalGainPercent = ((totalGain / totalCost) * 100).toFixed(2);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portfolio Report</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            background: #f0f2f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 30px;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .holdings-table {
            width: 100%;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .holdings-table th {
            background: #4a5568;
            color: white;
            padding: 15px;
            text-align: left;
        }
        .holdings-table td {
            padding: 15px;
            border-bottom: 1px solid #e2e8f0;
        }
        .gain {
            color: #48bb78;
            font-weight: bold;
        }
        .loss {
            color: #f56565;
            font-weight: bold;
        }
        .alert {
            background: #fed7d7;
            border-left: 4px solid #f56565;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
        }
        .alert.positive {
            background: #c6f6d5;
            border-left-color: #48bb78;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Portfolio Performance Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
    </div>

    <div class="summary-grid">
        <div class="summary-card">
            <h3>Total Value</h3>
            <p style="font-size: 24px; font-weight: bold;">$${totalValue.toFixed(2)}</p>
        </div>
        <div class="summary-card">
            <h3>Total Cost</h3>
            <p style="font-size: 24px; font-weight: bold;">$${totalCost.toFixed(2)}</p>
        </div>
        <div class="summary-card">
            <h3>Total Gain/Loss</h3>
            <p class="${totalGain >= 0 ? 'gain' : 'loss'}" style="font-size: 24px;">
                $${totalGain.toFixed(2)} (${totalGainPercent}%)
            </p>
        </div>
    </div>

    <h2>Holdings</h2>
    <table class="holdings-table">
        <thead>
            <tr>
                <th>Symbol</th>
                <th>Shares</th>
                <th>Purchase Price</th>
                <th>Current Price</th>
                <th>Current Value</th>
                <th>Total Cost</th>
                <th>Gain/Loss</th>
                <th>%</th>
            </tr>
        </thead>
        <tbody>
            ${holdings.map(h => `
                <tr>
                    <td><strong>${h.symbol}</strong></td>
                    <td>${h.shares}</td>
                    <td>$${h.purchasePrice}</td>
                    <td>$${h.currentPrice}</td>
                    <td>$${h.currentValue}</td>
                    <td>$${h.totalCost}</td>
                    <td class="${parseFloat(h.gain) >= 0 ? 'gain' : 'loss'}">
                        $${h.gain}
                    </td>
                    <td class="${parseFloat(h.gainPercent) >= 0 ? 'gain' : 'loss'}">
                        ${h.gainPercent}%
                    </td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    ${alerts && alerts.length > 0 ? `
        <h2>Alerts</h2>
        ${alerts.map(alert => `
            <div class="alert ${alert.type === 'GAIN' ? 'positive' : ''}">
                <strong>${alert.symbol}</strong>: ${alert.message}
            </div>
        `).join('')}
    ` : ''}
</body>
</html>`;

    const filename = `${this.reportsDir}/portfolio_${new Date().toISOString().split('T')[0]}.html`;
    await fs.mkdir(this.reportsDir, { recursive: true });
    await fs.writeFile(filename, html);

    return filename;
  }

  async listReports() {
    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
      const files = await fs.readdir(this.reportsDir);
      const reports = [];

      for (const file of files) {
        const stat = await fs.stat(path.join(this.reportsDir, file));
        reports.push({
          filename: file,
            size: `${(stat.size / 1024).toFixed(2)} KB`,
            created: stat.birthtime,
            modified: stat.mtime
        });
      }

      return reports.sort((a, b) => b.modified - a.modified);
    } catch (error) {
      console.error('Error listing reports:', error);
      return [];
    }
  }

  async cleanOldReports(daysToKeep = 30) {
    const reports = await this.listReports();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let deletedCount = 0;
    for (const report of reports) {
      if (report.modified < cutoffDate) {
        await fs.unlink(path.join(this.reportsDir, report.filename));
        deletedCount++;
      }
    }

    return deletedCount;
  }
}

module.exports = ReportGenerator;