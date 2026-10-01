import { createHonoApp } from './app.js';
import { whatsAppService } from './modules/whatsapp/application/whatsapp.service.js';

const app = createHonoApp();
let isWhatsAppStarted = false;

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    // Inject Cloudflare Worker environment variables if provided
    if (env?.JWT_SECRET) {
      process.env.JWT_SECRET = env.JWT_SECRET;
    }

    // Lazy initialization of WhatsApp service on first request if in Node-compatible runtime
    if (!isWhatsAppStarted && typeof whatsAppService?.initialize === 'function') {
      isWhatsAppStarted = true;
      try {
        ctx?.waitUntil?.(whatsAppService.initialize()) || whatsAppService.initialize().catch(() => {});
      } catch {
        // Fallback for runtimes without ctx.waitUntil
      }
    }

    return app.fetch(request, env, ctx);
  },
};
