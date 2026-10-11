import { Hono } from 'hono';
import { authService } from '../application/auth.service.js';
import { CreateApiKeyDto, RotateApiKeyDto, RevokeApiKeyDto } from '../domain/auth.types.js';
import { NotFoundError } from '../../../core/errors/app-error.js';
import { developerRateLimiterStore } from '../../../core/middleware/rate-limit.middleware.js';

export function createKeysController(): Hono {
  const router = new Hono();

  // Helper to extract base URL
  const getBaseUrl = (c: any) => {
    const host = c.req.header('host') || 'localhost:3000';
    const proto = c.req.header('x-forwarded-proto') || 'http';
    return `${proto}://${host}`;
  };

  // GET /api/v1/keys - List all keys and stats
  router.get('/', (c) => {
    const result = authService.listKeys();
    return c.json({
      success: true,
      ...result,
    });
  });

  // GET /api/v1/keys/rate-limit-activity - Get rate-limiting metrics per API key for bar chart
  router.get('/rate-limit-activity', (c) => {
    const keys = authService.listKeys().keys;
    const stats = developerRateLimiterStore.getRateLimitStats(keys);
    return c.json({
      success: true,
      ...stats,
    });
  });

  // POST /api/v1/keys/rate-limit-activity/simulate - Test burst traffic simulation
  router.post('/rate-limit-activity/simulate', async (c) => {
    const body = await c.req.json<{
      clientId?: string;
      successAdd?: number;
      throttledAdd?: number;
    }>().catch(() => ({} as { clientId?: string; successAdd?: number; throttledAdd?: number }));

    const clientId = body.clientId || 'ecommerce_auth';
    const successAdd = body.successAdd ?? 5;
    const throttledAdd = body.throttledAdd ?? 2;

    const key = authService.listKeys().keys.find((k: any) => k.clientId === clientId);
    const updated = developerRateLimiterStore.simulateTraffic(
      clientId,
      successAdd,
      throttledAdd,
      key?.clientName,
      key?.id
    );

    return c.json({
      success: true,
      message: `Simulasi lalu lintas berhasil ditambahkan ke akun '${clientId}'.`,
      data: updated,
    });
  });

  // POST /api/v1/keys/rate-limit-activity/reset - Reset rate limit metrics
  router.post('/rate-limit-activity/reset', (c) => {
    developerRateLimiterStore.reset();
    return c.json({
      success: true,
      message: 'Metrik rate-limiting berhasil direset.',
    });
  });

  // POST /api/v1/keys - Create new API key
  router.post('/', async (c) => {
    const body = await c.req.json<CreateApiKeyDto>().catch(() => ({ clientName: '' }));
    const baseUrl = getBaseUrl(c);

    const result = authService.createKey(body, baseUrl);
    return c.json(
      {
        success: true,
        message: `Kunci API untuk '${result.key.clientName}' berhasil dibuat.`,
        data: result.key,
        sampleCurl: result.sampleCurl,
      },
      201
    );
  });

  // GET /api/v1/keys/:id - Get single key details
  router.get('/:id', (c) => {
    const id = c.req.param('id');
    const key = authService.getKeyById(id);
    if (!key) {
      throw new NotFoundError(`Kunci API '${id}' tidak ditemukan.`);
    }

    const baseUrl = getBaseUrl(c);
    const sampleCurl = authService.generateSampleCurl(key.token, key.clientName, baseUrl);

    return c.json({
      success: true,
      data: key,
      sampleCurl,
    });
  });

  // POST /api/v1/keys/:id/rotate - Rotate key with zero-downtime grace period
  router.post('/:id/rotate', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json<RotateApiKeyDto>().catch(() => ({} as RotateApiKeyDto));
    const baseUrl = getBaseUrl(c);

    const result = authService.rotateKey(id, body, baseUrl);
    return c.json({
      success: true,
      message: `Kunci API '${result.key.clientName}' berhasil dirotasi.`,
      data: result.key,
      newToken: result.newToken,
      previousTokenValidUntil: result.previousTokenValidUntil,
      sampleCurl: result.sampleCurl,
    });
  });

  // POST /api/v1/keys/:id/revoke - Revoke key immediately
  router.post('/:id/revoke', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json<RevokeApiKeyDto>().catch(() => ({} as RevokeApiKeyDto));

    const key = authService.revokeKey(id, body.reason);
    return c.json({
      success: true,
      message: `Kunci API '${key.clientName}' berhasil dicabut (revoked). Akses segera dinonaktifkan.`,
      data: key,
    });
  });

  // DELETE /api/v1/keys/:id - Delete key from registry
  router.delete('/:id', (c) => {
    const id = c.req.param('id');
    authService.deleteKey(id);
    return c.json({
      success: true,
      message: `Kunci API '${id}' berhasil dihapus dari sistem.`,
    });
  });

  return router;
}
