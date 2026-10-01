import { Hono } from 'hono';
import { whatsAppService } from '../application/whatsapp.service.js';
import { authService } from '../../auth/application/auth.service.js';
import { ValidationError } from '../../../core/errors/app-error.js';
import { ErrorCodes } from '../../../core/errors/error-codes.js';

export function createWhatsAppController(metricsProvider: () => unknown): Hono {
  const router = new Hono();

  // GET /api/v1/status
  router.get('/status', (c) => {
    const waState = whatsAppService.getState();
    const metrics = metricsProvider();
    return c.json({
      success: true,
      whatsapp: waState,
      metrics,
      auth: {
        secretPreview: authService.getSecretPreview(),
      },
      serverTime: new Date().toISOString(),
    });
  });

  // GET /api/v1/qr
  router.get('/qr', (c) => {
    const waState = whatsAppService.getState();
    return c.json({
      success: true,
      status: waState.status,
      qrDataUrl: waState.qrDataUrl,
      qrRaw: waState.qrRaw,
      pairingCode: waState.pairingCode,
      phone: waState.phone,
    });
  });

  // POST /api/v1/pair-code
  router.post('/pair-code', async (c) => {
    const body = await c.req.json<{ phoneNumber?: string }>().catch(() => ({ phoneNumber: undefined }));
    if (!body.phoneNumber) {
      throw new ValidationError(
        "Parameter 'phoneNumber' wajib diisi (contoh: 081234567890).",
        ErrorCodes.VALIDATION_PHONE_REQUIRED
      );
    }

    const code = await whatsAppService.requestPairingCode(body.phoneNumber);
    return c.json({
      success: true,
      pairingCode: code,
      message: 'Masukkan kode ini pada WhatsApp: Pengaturan > Perangkat Tertaut > Tautkan dengan nomor telepon',
    });
  });

  // POST /api/v1/reconnect
  router.post('/reconnect', async (c) => {
    await whatsAppService.reconnect();
    return c.json({
      success: true,
      message: 'Perintah rekoneksi socket Baileys dikirim.',
    });
  });

  // POST /api/v1/reset-session
  router.post('/reset-session', async (c) => {
    await whatsAppService.resetSession();
    return c.json({
      success: true,
      message: 'Sesi WhatsApp berhasil dibersihkan. Silakan pindai QR code baru.',
    });
  });

  return router;
}
