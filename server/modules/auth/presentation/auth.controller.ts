import { Hono } from 'hono';
import { authService } from '../application/auth.service.js';
import { ValidationError } from '../../../core/errors/app-error.js';
import { GenerateTokenDto } from '../domain/auth.types.js';

export function createAuthController(): Hono {
  const router = new Hono();

  // POST /api/v1/auth/token
  router.post('/token', async (c) => {
    const body = await c.req.json<GenerateTokenDto>().catch(() => ({}));
    const host = c.req.header('host') || 'localhost:3000';
    const proto = c.req.header('x-forwarded-proto') || 'http';
    const baseUrl = `${proto}://${host}`;

    const result = authService.generateToken(body, baseUrl);
    return c.json({
      success: true,
      ...result,
    });
  });

  // POST /api/v1/auth/verify
  router.post('/verify', async (c) => {
    const body = await c.req.json<{ token?: string }>().catch(() => ({ token: undefined }));
    if (!body.token) {
      throw new ValidationError("Parameter 'token' wajib diisi.");
    }

    const claims = authService.verifyToken(body.token);
    return c.json({
      success: true,
      valid: true,
      developer: claims,
    });
  });

  return router;
}
