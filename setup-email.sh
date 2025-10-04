#!/bin/bash

echo "======================================"
echo "NFT Dashboard Email Setup"
echo "======================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Creating one..."
    cp .env.example .env 2>/dev/null || touch .env
fi

echo "📧 Email Configuration"
echo ""
echo "To receive dashboard reports twice daily, configure your email:"
echo ""
echo "1. Edit the .env file and add:"
echo "   EMAIL_TO=your-email@example.com"
echo "   EMAIL_USER=sender@gmail.com"
echo "   EMAIL_PASS=app-specific-password"
echo ""
echo "2. For Gmail users:"
echo "   - Enable 2-factor authentication"
echo "   - Generate app-specific password at:"
echo "     https://myaccount.google.com/apppasswords"
echo "   - Use that password for EMAIL_PASS"
echo ""
echo "3. Test your configuration:"
echo "   node emailReporter.js test"
echo ""
echo "4. Send a test report:"
echo "   node emailReporter.js send"
echo ""
echo "5. Start scheduled reports (9AM & 6PM daily):"
echo "   node emailReporter.js schedule"
echo ""
echo "======================================"
echo ""

read -p "Would you like to test the email configuration now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    node emailReporter.js test
fi