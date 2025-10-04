# Deployment Guide - NFT Market Intelligence System

## Deployment Options Ranked

### 1. 🏆 **VPS with PM2 (Recommended)**
**Cost:** $5-10/month | **Reliability:** Excellent | **Setup:** Easy

#### Providers:
- **DigitalOcean** - $6/month (1GB RAM, 25GB SSD)
- **Linode** - $5/month (1GB RAM, 25GB SSD)
- **Vultr** - $6/month (1GB RAM, 25GB SSD)

#### Quick Deploy:
```bash
# 1. Get a VPS and SSH in
ssh root@your-vps-ip

# 2. Run automated setup
./deploy.sh your-vps-ip

# 3. Configure environment
nano /home/nft-monitor/.env

# 4. Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### PM2 Commands:
```bash
pm2 status          # View running processes
pm2 logs            # View logs
pm2 restart all     # Restart services
pm2 monit           # Real-time monitoring
```

---

### 2. 🐳 **Docker (Container)**
**Cost:** Varies | **Reliability:** Excellent | **Setup:** Medium

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

### 3. ☁️ **Railway.app (Serverless)**
**Cost:** $5-20/month | **Reliability:** Good | **Setup:** Very Easy

1. Fork repo to GitHub
2. Connect to Railway.app
3. Add environment variables
4. Deploy automatically

---

### 4. 🌊 **DigitalOcean App Platform**
**Cost:** $5-12/month | **Reliability:** Excellent | **Setup:** Easy

1. Push to GitHub
2. Create App in DO console
3. Connect repo
4. Add env variables
5. Deploy

---

### 5. 🖥️ **Local Machine (Testing Only)**
**Cost:** Free | **Reliability:** Poor | **Setup:** Easy

```bash
# Use PM2 locally
npm install -g pm2
pm2 start ecosystem.config.js
```

---

## Production Checklist

### Before Deployment:
- [ ] Update `.env` with production credentials
- [ ] Test email configuration
- [ ] Verify OpenSea API key
- [ ] Check monitoring intervals
- [ ] Review alert thresholds

### After Deployment:
- [ ] Verify PM2/Docker running
- [ ] Check logs for errors
- [ ] Confirm first email received
- [ ] Monitor for 24 hours
- [ ] Set up uptime monitoring

---

## Environment Variables

Create `.env` file:
```env
OPENSEA_API_KEY=your_key
EMAIL_TO=recipient@email.com
EMAIL_USER=sender@gmail.com
EMAIL_PASS=app_password
ANTHROPIC_API_KEY=optional
```

---

## Monitoring & Maintenance

### Health Checks:
```bash
# Check process status
pm2 status

# View recent logs
pm2 logs --lines 100

# Check disk space
df -h

# Monitor resources
htop
```

### Backup Data:
```bash
# Backup monitoring data
tar -czf backup-$(date +%Y%m%d).tar.gz monitoring-log.json dashboard-reports/

# Restore if needed
tar -xzf backup-20231201.tar.gz
```

---

## Troubleshooting

### Service Won't Start:
```bash
pm2 delete all
pm2 start ecosystem.config.js
pm2 logs
```

### Email Not Sending:
1. Check Gmail app password
2. Verify port 587 open
3. Test with: `node emailReporter.js test`

### High Memory Usage:
```bash
pm2 restart all
pm2 reset nft-monitor
```

### API Rate Limits:
- Reduce scan frequency in continuousMonitor.js
- Add more delay between requests

---

## Cost Optimization

### Minimum Requirements:
- RAM: 512MB (1GB recommended)
- Storage: 10GB
- CPU: 1 vCPU
- Network: 1TB transfer

### Free Options:
- **Oracle Cloud** - Always free tier
- **Google Cloud** - $300 credit
- **AWS EC2** - 12 months free tier

---

## Security Hardening

```bash
# Create non-root user
adduser nftmonitor
usermod -aG sudo nftmonitor

# Setup firewall
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable

# Secure SSH
nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no

# Auto-updates
apt install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

---

## Support

Common issues and solutions:
- Memory leaks: Restart with PM2 every 24h
- API errors: Check rate limits and key validity
- Email delays: Normal for Gmail, consider SMTP service

For production support, consider:
- Uptime monitoring (UptimeRobot)
- Error tracking (Sentry)
- Log aggregation (Papertrail)