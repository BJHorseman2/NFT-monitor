const nodemailer = require('nodemailer').default || require('nodemailer');
const cron = require('node-cron');
const DashboardGenerator = require('./dashboardGenerator');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

class EmailReporter {
  constructor() {
    this.dashboardGen = new DashboardGenerator();
    this.emailConfig = {
      to: process.env.EMAIL_TO || '',
      from: process.env.EMAIL_FROM || 'nft-monitor@alerts.com',
      subject: 'NFT Market Intelligence Report'
    };

    // Configure email transporter
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Alternative SMTP configuration
    if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }
  }

  async sendEmail(htmlContent, subject) {
    const timeOfDay = new Date().getHours() < 12 ? 'Morning' : 'Evening';
    const fullSubject = `${subject} - ${timeOfDay} Edition`;

    const mailOptions = {
      from: this.emailConfig.from,
      to: this.emailConfig.to,
      subject: fullSubject,
      html: htmlContent,
      attachments: [{
        filename: 'report.html',
        content: htmlContent
      }]
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async generateAndSend() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📧 Generating Email Report - ${new Date().toLocaleString()}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      // Initialize dashboard generator
      await this.dashboardGen.initialize();

      // Generate dashboard
      const { filepath, data } = await this.dashboardGen.generateDashboard();

      // Read the generated HTML
      const htmlContent = await fs.readFile(filepath, 'utf8');

      // Send email
      if (this.emailConfig.to) {
        await this.sendEmail(htmlContent, this.emailConfig.subject);
        console.log(`✅ Report emailed to: ${this.emailConfig.to}`);
      } else {
        console.log('⚠️  No email recipient configured. Set EMAIL_TO in .env file');
      }

      // Log summary
      console.log('\n📊 Report Summary:');
      console.log(`• High Priority Alerts: ${data.alerts.high}`);
      console.log(`• Collections Tracked: ${data.topMovers.length}`);
      console.log(`• Market Momentum: ${data.summary.momentum}`);
      console.log(`• Top Opportunity: ${data.topMovers[0]?.collection || 'None'}`);

      return { success: true, filepath, data };

    } catch (error) {
      console.error('❌ Error generating/sending report:', error);
      return { success: false, error };
    }
  }

  scheduleDailyReports() {
    console.log('📅 Scheduling Daily Email Reports');
    console.log('• Morning Report: 9:00 AM');
    console.log('• Evening Report: 6:00 PM');

    // Schedule morning report (9:00 AM)
    cron.schedule('0 9 * * *', async () => {
      console.log('\n⏰ Morning report triggered');
      await this.generateAndSend();
    });

    // Schedule evening report (6:00 PM)
    cron.schedule('0 18 * * *', async () => {
      console.log('\n⏰ Evening report triggered');
      await this.generateAndSend();
    });

    console.log('✅ Email reports scheduled successfully\n');
  }

  async testEmail() {
    console.log('🧪 Testing email configuration...');

    if (!this.emailConfig.to) {
      console.error('❌ EMAIL_TO not set in .env file');
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ Email configuration is valid');

      // Send test email
      const testHtml = `
        <div style="font-family: Arial; padding: 20px; background: #f5f5f5;">
          <h2>NFT Monitor Test Email</h2>
          <p>This is a test email from your NFT monitoring system.</p>
          <p>If you're seeing this, your email configuration is working correctly!</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            Reports will be sent twice daily at 9:00 AM and 6:00 PM
          </p>
        </div>
      `;

      await this.sendEmail(testHtml, 'Test Email - NFT Monitor');
      console.log('✅ Test email sent successfully');
      return true;

    } catch (error) {
      console.error('❌ Email test failed:', error.message);
      return false;
    }
  }
}

// Main execution
if (require.main === module) {
  const reporter = new EmailReporter();

  const command = process.argv[2];

  switch (command) {
    case 'test':
      reporter.testEmail();
      break;

    case 'send':
      reporter.generateAndSend();
      break;

    case 'schedule':
      reporter.scheduleDailyReports();
      // Keep process running
      process.stdin.resume();
      break;

    default:
      console.log(`
NFT Email Reporter - Commands:

  node emailReporter.js test      - Test email configuration
  node emailReporter.js send      - Send report immediately
  node emailReporter.js schedule  - Start scheduled reports (9AM & 6PM)

Configuration (.env file):
  EMAIL_TO=your-email@example.com
  EMAIL_USER=sender@gmail.com
  EMAIL_PASS=app-specific-password

For Gmail:
  1. Enable 2-factor authentication
  2. Generate app-specific password
  3. Use that password for EMAIL_PASS
      `);
  }
}

module.exports = EmailReporter;