import express from 'express';
import { createServer as createViteServer } from 'vite';
import { getRequestListener } from '@hono/node-server';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createHonoApp } from './server/app.js';
import { whatsAppService } from './server/modules/whatsapp/application/whatsapp.service.js';
import { AppConfig } from './server/core/config/app.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = AppConfig.server.port;
const isProduction = AppConfig.server.isProduction;

async function startServer() {
  const app = express();
  const honoApp = createHonoApp();
  const honoListener = getRequestListener(honoApp.fetch);

  // Mount Hono for all /api routes
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      return honoListener(req, res);
    }
    next();
  });

  if (!isProduction) {
    // In development: mount Vite dev middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production: serve static files built by vite
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🚀 WhatsApp OTP Gateway Server running on port ${PORT}`);
    console.log(`📡 Hono API:    http://0.0.0.0:${PORT}/api/v1/status`);
    console.log(`📖 Swagger UI:  http://0.0.0.0:${PORT}/api/docs`);
    console.log(`📄 OpenAPI Spec: http://0.0.0.0:${PORT}/api/openapi.json`);
    console.log(`======================================================\n`);

    // Initialize Baileys WhatsApp client asynchronously
    whatsAppService.initialize().catch((err) => {
      console.error('WhatsApp initialization error:', err);
    });
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
