import { MiddlewareHandler } from 'hono';
import { eventBus } from '../events/event-bus.js';

export const requestLoggerMiddleware: MiddlewareHandler = async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;

  // Don't clutter with SSE heartbeat requests
  if (!c.req.path.includes('/logs/live')) {
    const status = c.res.status;
    const level = status >= 400 ? (status >= 500 ? 'error' : 'warn') : 'info';

    eventBus.emit('console:log', {
      level,
      source: 'hono-api',
      message: `${c.req.method} ${c.req.path} -> HTTP ${status} (${duration}ms)`,
      meta: {
        method: c.req.method,
        path: c.req.path,
        status,
        durationMs: duration,
      },
    });
  }
};
