import { Hono } from 'hono';
import { createAuthGuard } from '../../auth/presentation/auth.middleware.js';
import { createDeveloperRateLimitMiddleware } from '../../../core/middleware/rate-limit.middleware.js';
import { ValidationError } from '../../../core/errors/app-error.js';
import { DeveloperClaims } from '../../auth/domain/auth.types.js';
import { ecommerceService } from '../application/ecommerce.service.js';
import {
  webhookSimulatorService,
  WebhookSimulationRequest,
} from '../application/webhook-simulator.service.js';
import {
  EcommerceEventData,
  EcommerceEventTriggerDto,
  EcommerceEventType,
} from '../domain/ecommerce.types.js';

export function createEcommerceController(): Hono<{ Variables: { developer: DeveloperClaims } }> {
  const router = new Hono<{ Variables: { developer: DeveloperClaims } }>();

  // GET /api/v1/ecommerce/templates - Get all event templates
  router.get('/templates', (c) => {
    const templates = ecommerceService.getTemplates();
    return c.json({
      success: true,
      count: templates.length,
      templates,
    });
  });

  // PUT /api/v1/ecommerce/templates/:id - Update single template
  router.put('/templates/:id', async (c) => {
    const eventId = c.req.param('id') as EcommerceEventType;
    const body = await c.req
      .json<{ template?: string; enabled?: boolean }>()
      .catch(() => ({} as { template?: string; enabled?: boolean }));

    if (body.template === undefined && body.enabled === undefined) {
      throw new ValidationError("Parameter 'template' atau 'enabled' wajib disertakan.");
    }

    const currentTpl = ecommerceService.getTemplate(eventId);
    if (!currentTpl) {
      throw new ValidationError(`Template event dengan ID "${eventId}" tidak ditemukan.`);
    }

    const updated = ecommerceService.updateTemplate(
      eventId,
      body.template !== undefined ? body.template : currentTpl.template,
      body.enabled !== undefined ? body.enabled : currentTpl.enabled
    );

    return c.json({
      success: true,
      message: `Template untuk event "${updated.title}" berhasil diperbarui.`,
      template: updated,
    });
  });

  // POST /api/v1/ecommerce/templates/reset - Reset to factory presets
  router.post('/templates/reset', (c) => {
    const templates = ecommerceService.resetTemplates();
    return c.json({
      success: true,
      message: 'Seluruh template event e-commerce telah berhasil dikembalikan ke standar awal.',
      templates,
    });
  });

  // POST /api/v1/ecommerce/preview - Preview compilation
  router.post('/preview', async (c) => {
    interface PreviewBody {
      event: EcommerceEventType;
      template?: string;
      data?: EcommerceEventData;
    }
    const body = await c.req.json<PreviewBody>().catch(() => ({} as PreviewBody));
    if (!body.event) {
      throw new ValidationError("Parameter 'event' wajib disertakan.");
    }

    const preview = ecommerceService.preview(body.event, body.template, body.data);
    return c.json({
      success: true,
      event: body.event,
      preview,
    });
  });

  // POST /api/v1/ecommerce/simulate - Sandbox simulation endpoint from UI (No strict JWT required)
  router.post('/simulate', async (c) => {
    const body = await c.req.json<EcommerceEventTriggerDto>().catch(() => ({} as EcommerceEventTriggerDto));
    if (!body.to) {
      throw new ValidationError(
        "Parameter 'to' (nomor WhatsApp penerima) wajib diisi untuk simulasi pengujian.",
        'PARAM_MISSING'
      );
    }
    if (!body.event) {
      throw new ValidationError("Parameter 'event' wajib dipilih.");
    }

    const result = await ecommerceService.triggerEvent(
      body,
      'dev_sandbox_ui',
      'Dashboard Sandbox Simulator'
    );

    return c.json(result);
  });

  // POST /api/v1/ecommerce/events - Main Webhook / REST API trigger for external E-commerce Stores
  router.post(
    '/events',
    createAuthGuard('otp:send'),
    createDeveloperRateLimitMiddleware(),
    async (c) => {
      const developer = c.get('developer');
      const body = await c.req.json<EcommerceEventTriggerDto>().catch(() => ({} as EcommerceEventTriggerDto));

      if (!body.to) {
        throw new ValidationError(
          "Parameter 'to' wajib diisi dengan nomor telepon penerima (contoh: '081234567890')",
          'PARAM_MISSING',
          'Pastikan request body memiliki format JSON: { "event": "shipping_dispatched", "to": "081234567890", "data": { ... } }'
        );
      }

      if (!body.event) {
        throw new ValidationError(
          "Parameter 'event' wajib diisi (contoh: order_created, payment_received, shipping_dispatched)",
          'PARAM_MISSING'
        );
      }

      // Check if bypass header requested
      const bypassHeader = c.req.header('x-bypass-rate-limit');
      if (bypassHeader === 'true' || bypassHeader === '1') {
        body.bypassRateLimit = true;
      }

      const result = await ecommerceService.triggerEvent(
        body,
        developer?.sub || 'ecommerce_api',
        developer?.name || 'E-Commerce Store Integration'
      );

      return c.json(result);
    }
  );

  // --- Webhook Simulator Routes ---
  // GET /api/v1/ecommerce/webhook-simulator/presets - Get event presets for testing
  router.get('/webhook-simulator/presets', (c) => {
    const presets = webhookSimulatorService.getPresets();
    return c.json({
      success: true,
      count: presets.length,
      presets,
    });
  });

  // POST /api/v1/ecommerce/webhook-simulator/send - Send dummy event payload to developer's endpoint
  router.post('/webhook-simulator/send', async (c) => {
    const body = await c.req.json<WebhookSimulationRequest>().catch(() => ({} as WebhookSimulationRequest));
    if (!body.targetUrl) {
      throw new ValidationError(
        "Parameter 'targetUrl' wajib diisi dengan URL endpoint webhook Anda (contoh: https://my-store.com/api/webhooks/whatsapp).",
        'TARGET_URL_REQUIRED'
      );
    }

    const result = await webhookSimulatorService.simulateWebhook(body);
    return c.json({
      success: result.success,
      data: result,
    });
  });

  return router;
}
