import { Hono } from 'hono';
import { createAuthGuard } from '../../auth/presentation/auth.middleware.js';
import { otpService } from '../application/otp.service.js';
import { ValidationError } from '../../../core/errors/app-error.js';
import { SendOtpDto, VerifyOtpDto } from '../domain/otp.types.js';
import { DeveloperClaims } from '../../auth/domain/auth.types.js';
import {
  MessageTemplateEngine,
  TEMPLATE_PRESETS,
  TEMPLATE_VARIABLES,
} from '../domain/message-template.js';

export function createOtpController(): Hono<{ Variables: { developer: DeveloperClaims } }> {
  const router = new Hono<{ Variables: { developer: DeveloperClaims } }>();

  // GET /api/v1/otp/template - Get current active default template and presets
  router.get('/template', (c) => {
    return c.json({
      success: true,
      activeTemplate: MessageTemplateEngine.getDefaultTemplate(),
      presets: TEMPLATE_PRESETS,
      variables: TEMPLATE_VARIABLES,
    });
  });

  // PUT /api/v1/otp/template - Update default message template
  router.put('/template', async (c) => {
    const body = await c.req.json<{ template?: string }>().catch(() => ({ template: '' }));
    if (!body.template || !body.template.trim()) {
      throw new ValidationError("Parameter 'template' tidak boleh kosong.");
    }

    // Verify template contains at least {{otp}} or {{code}}
    if (!body.template.includes('{{otp}}') && !body.template.includes('{{code}}')) {
      throw new ValidationError(
        "Template pesan wajib menyertakan tag '{{otp}}' agar kode verifikasi dapat disisipkan.",
        'TEMPLATE_MISSING_OTP'
      );
    }

    MessageTemplateEngine.setDefaultTemplate(body.template);
    return c.json({
      success: true,
      message: 'Template pesan default berhasil diperbarui',
      activeTemplate: MessageTemplateEngine.getDefaultTemplate(),
    });
  });

  // POST /api/v1/otp/template/reset - Reset to default standard preset
  router.post('/template/reset', (c) => {
    const resetTemplate = MessageTemplateEngine.resetDefaultTemplate();
    return c.json({
      success: true,
      message: 'Template pesan dikembalikan ke standar awal sistem',
      activeTemplate: resetTemplate,
    });
  });

  // POST /api/v1/otp/template/preview - Preview compilation
  router.post('/template/preview', async (c) => {
    interface PreviewBody {
      template?: string;
      otp?: string;
      appName?: string;
      expiresInMinutes?: number;
      phone?: string;
    }
    const body = await c.req.json<PreviewBody>().catch(() => ({} as PreviewBody));

    const preview = MessageTemplateEngine.compile(body.template || '', {
      otp: body.otp || '849201',
      appName: body.appName || 'FinPay Security',
      expiresInMinutes: body.expiresInMinutes || 5,
      phone: body.phone || '+6281234567890',
    });

    return c.json({
      success: true,
      preview,
    });
  });

  // POST /api/v1/otp/send (Protected with JWT Middleware)
  router.post('/send', createAuthGuard('otp:send'), async (c) => {
    const developer = c.get('developer');
    const body = await c.req.json<SendOtpDto>().catch(() => ({}) as SendOtpDto);

    if (!body.to) {
      throw new ValidationError(
        "Parameter 'to' wajib diisi",
        'PARAM_MISSING',
        'Pastikan request body memiliki format JSON: { "to": "081234567890" }'
      );
    }

    // Check if bypass header requested
    const bypassHeader = c.req.header('x-bypass-rate-limit');
    if (bypassHeader === 'true' || bypassHeader === '1') {
      body.bypassRateLimit = true;
    }

    const result = await otpService.sendOtp(
      body,
      developer?.sub || 'dev_external',
      developer?.name || 'Developer API Client'
    );

    return c.json({
      success: true,
      message: 'OTP berhasil dikirim ke nomor WhatsApp penerima',
      data: result,
    });
  });

  // POST /api/v1/otp/verify (Protected with JWT Middleware)
  router.post('/verify', createAuthGuard(), async (c) => {
    const body = await c.req.json<VerifyOtpDto>().catch(() => ({}) as VerifyOtpDto);

    if (!body.to || !body.otp) {
      throw new ValidationError("Parameter 'to' dan 'otp' wajib diisi.");
    }

    const result = otpService.verifyOtp(body);
    return c.json({
      success: result.success,
      verified: result.verified,
      message: result.message,
      attemptsRemaining: result.attemptsRemaining,
      appName: result.appName,
    });
  });

  return router;
}
