module.exports = {
  apps: [
    {
      name: 'whatsapp-otp-gateway',
      script: 'server.ts',
      interpreter: './node_modules/.bin/tsx',
      instances: 1, // PENTING: Wajib 1 instance untuk menjaga kestabilan socket WhatsApp Baileys
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '800M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
    },
  ],
};
