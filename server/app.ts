import { Hono } from 'hono';
import { corsMiddleware } from './core/middleware/cors.middleware.js';
import { requestLoggerMiddleware } from './core/middleware/logger.middleware.js';
import { globalErrorHandler } from './core/middleware/error.middleware.js';
import { createAuthController } from './modules/auth/presentation/auth.controller.js';
import { createWhatsAppController } from './modules/whatsapp/presentation/whatsapp.controller.js';
import { createOtpController } from './modules/otp/presentation/otp.controller.js';
import { createMonitoringController } from './modules/monitoring/presentation/monitoring.controller.js';
import { createDocsController } from './modules/docs/presentation/docs.controller.js';
import { monitoringService } from './modules/monitoring/application/monitoring.service.js';
import { whatsAppService } from './modules/whatsapp/application/whatsapp.service.js';
import { DeveloperClaims } from './modules/auth/domain/auth.types.js';

export function createHonoApp() {
  const app = new Hono<{ Variables: { developer: DeveloperClaims } }>();

  // 1. Global Cross-Cutting Middlewares
  app.use('*', corsMiddleware);
  app.use('*', requestLoggerMiddleware);
  app.onError(globalErrorHandler);

  // 2. Wire Cross-Module Providers
  monitoringService.setWaStatusProvider(() => whatsAppService.getState().status);

  // 3. Health Endpoint
  app.get('/api/health', (c) => {
    return c.json({
      status: 'ok',
      architecture: 'Layered Modular Monolith',
      engine: 'Hono.js + Baileys Multi-Device',
      time: new Date().toISOString(),
      database: 'none (in-memory ring-buffer)',
    });
  });

  // 4. Mount Presentation Controllers (Modules)
  // Docs & OpenAPI Module (/api/openapi.json, /api/docs)
  app.route('/api', createDocsController());

  // Auth Module (/api/v1/auth/token, /api/v1/auth/verify)
  app.route('/api/v1/auth', createAuthController());

  // WhatsApp Module (/api/v1/status, /api/v1/qr, /api/v1/pair-code, /api/v1/reconnect, /api/v1/reset-session)
  app.route('/api/v1', createWhatsAppController(() => monitoringService.getMetrics()));

  // OTP Module (/api/v1/otp/send)
  app.route('/api/v1/otp', createOtpController() as any);

  // Monitoring Module (/api/v1/otp/logs, /api/v1/logs/errors, /api/v1/logs/console, /api/v1/logs/live)
  app.route('/api/v1', createMonitoringController());

  return app;
}
