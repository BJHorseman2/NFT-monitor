module.exports = {
  apps: [
    {
      name: 'nft-monitor',
      script: 'continuousMonitor.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      log_file: 'logs/combined.log',
      time: true
    },
    {
      name: 'email-reporter',
      script: 'emailReporter.js',
      args: 'schedule',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};