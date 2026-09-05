// ============================================================
//  BD — BetterDriver
//  PM2 Ecosystem Configuration
//  Usage: pm2 start pm2.config.js
// ============================================================

module.exports = {
  apps: [
    {
      name: "bd-site",
      script: ".next/standalone/server.js",
      cwd: "./",
      env: {
        NODE_ENV: "production",
        PORT: 3003,
        HOSTNAME: "0.0.0.0",
      },
      max_memory_restart: "512M",
      restart_delay: 3000,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "/var/log/pm2/bd-error.log",
      out_file: "/var/log/pm2/bd-out.log",
      autorestart: true,
    },
  ],
};
