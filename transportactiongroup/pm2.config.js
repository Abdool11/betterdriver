// TAG — transportactiongroup.co.za
// PM2 ecosystem configuration
// Usage: pm2 start pm2.config.js
//        pm2 save
//        pm2 startup   (to auto-start on server reboot)

module.exports = {
  apps: [
    {
      name: "tag",
      script: ".next/standalone/server.js",
      cwd: "/home/ubuntu/sites/tag",
      env: {
        NODE_ENV: "production",
        PORT: 3002,
        HOSTNAME: "0.0.0.0",
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      error_file: "/home/ubuntu/logs/tag-error.log",
      out_file: "/home/ubuntu/logs/tag-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
