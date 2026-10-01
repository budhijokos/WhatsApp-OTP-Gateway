import { Hono } from 'hono';
import { buildOpenApiSpec } from '../domain/openapi.spec.js';
import { swaggerService } from '../application/swagger.service.js';

export function createDocsController(): Hono {
  const router = new Hono();

  // GET /api/openapi.json
  router.get('/openapi.json', (c) => {
    const proto = c.req.header('x-forwarded-proto') || 'http';
    const host = c.req.header('host') || 'localhost:3000';
    const baseUrl = `${proto}://${host}`;
    return c.json(buildOpenApiSpec(baseUrl));
  });

  // GET /api/docs
  router.get('/docs', (c) => {
    return c.html(swaggerService.renderSwaggerUiHtml('/api/openapi.json'));
  });

  return router;
}
