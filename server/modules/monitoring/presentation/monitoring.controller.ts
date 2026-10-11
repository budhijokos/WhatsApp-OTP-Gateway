import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { monitoringService } from '../application/monitoring.service.js';
import { whatsAppService } from '../../whatsapp/application/whatsapp.service.js';
import { dispatchQueueService } from '../../../core/queue/dispatch-queue.service.js';
import { AppConfig } from '../../../core/config/app.config.js';

export function createMonitoringController(): Hono {
  const router = new Hono();

  // GET /api/v1/otp/logs
  router.get('/otp/logs', (c) => {
    const limit = Number(c.req.query('limit')) || 100;
    const status = c.req.query('status');
    const logs = monitoringService.getDeliveryLogs(limit, status);
    return c.json({
      success: true,
      count: logs.length,
      logs,
    });
  });

  // DELETE /api/v1/otp/logs
  router.delete('/otp/logs', (c) => {
    monitoringService.clearDeliveryLogs();
    return c.json({ success: true, message: 'Log pengiriman dibersihkan' });
  });

  // GET /api/v1/logs/errors
  router.get('/logs/errors', (c) => {
    const limit = Number(c.req.query('limit')) || 100;
    const errors = monitoringService.getErrorLogs(limit);
    return c.json({
      success: true,
      count: errors.length,
      errors,
    });
  });

  // DELETE /api/v1/logs/errors
  router.delete('/logs/errors', (c) => {
    monitoringService.clearErrorLogs();
    return c.json({ success: true, message: 'Log error dibersihkan' });
  });

  // GET /api/v1/logs/console
  router.get('/logs/console', (c) => {
    const limit = Number(c.req.query('limit')) || 200;
    const source = c.req.query('source');
    const level = c.req.query('level');
    const logs = monitoringService.getConsoleLogs(limit, source, level);
    return c.json({
      success: true,
      count: logs.length,
      logs,
    });
  });

  // DELETE /api/v1/logs/console
  router.delete('/logs/console', (c) => {
    monitoringService.clearConsoleLogs();
    return c.json({ success: true, message: 'Log konsol dibersihkan' });
  });

  // GET /api/v1/monitoring/memory
  router.get('/monitoring/memory', (c) => {
    const memory = monitoringService.getMemoryHealth();
    return c.json({
      success: true,
      memory,
    });
  });

  // POST /api/v1/monitoring/auto-purge
  router.post('/monitoring/auto-purge', (c) => {
    const result = monitoringService.triggerAutoPurge(true);
    return c.json({
      success: true,
      result,
    });
  });

  // POST /api/v1/monitoring/auto-purge/toggle
  router.post('/monitoring/auto-purge/toggle', async (c) => {
    const body = await c.req.json<{ enabled?: boolean }>().catch(() => ({} as { enabled?: boolean }));
    if (typeof body.enabled === 'boolean') {
      monitoringService.setAutoPurgeEnabled(body.enabled);
    }
    const memory = monitoringService.getMemoryHealth();
    return c.json({
      success: true,
      memory,
    });
  });

  // GET /api/v1/queue/status
  router.get('/queue/status', (c) => {
    return c.json({
      success: true,
      stats: dispatchQueueService.getStats(),
    });
  });

  // POST /api/v1/queue/pause
  router.post('/queue/pause', (c) => {
    dispatchQueueService.pause();
    return c.json({
      success: true,
      message: 'Antrian pengiriman pesan dijeda (PAUSED)',
      stats: dispatchQueueService.getStats(),
    });
  });

  // POST /api/v1/queue/resume
  router.post('/queue/resume', (c) => {
    dispatchQueueService.resume();
    return c.json({
      success: true,
      message: 'Antrian pengiriman pesan dilanjutkan (RESUMED)',
      stats: dispatchQueueService.getStats(),
    });
  });

  // POST /api/v1/queue/clear
  router.post('/queue/clear', (c) => {
    const cleared = dispatchQueueService.clear();
    return c.json({
      success: true,
      message: `${cleared} pesan dalam antrian berhasil dibersihkan (CLEARED)`,
      stats: dispatchQueueService.getStats(),
    });
  });

  // POST /api/v1/queue/purge-unused
  router.post('/queue/purge-unused', (c) => {
    const prunedQueue = dispatchQueueService.purgeUnusedQueue(
      'Pembersihan manual/otomatis antrian tidak digunakan via API'
    );
    const stats = dispatchQueueService.getStats();
    const memory = monitoringService.getMemoryHealth();
    return c.json({
      success: true,
      purgedCount: prunedQueue,
      message: `${prunedQueue} antrian yang tidak digunakan berhasil dibatalkan dan dihapus otomatis untuk menghemat kapasitas RAM.`,
      stats,
      memory,
    });
  });

  // GET /api/v1/logs/live (Server-Sent Events)
  router.get('/logs/live', (c) => {
    return streamSSE(c, async (stream) => {
      // Snapshot
      await stream.writeSSE({
        event: 'init',
        data: JSON.stringify({
          waState: whatsAppService.getState(),
          metrics: monitoringService.getMetrics(),
          recentLogs: monitoringService.getDeliveryLogs(25),
          recentConsole: monitoringService.getConsoleLogs(50),
          recentErrors: monitoringService.getErrorLogs(20),
        }),
      });

      // Keepalive ping
      const pingInterval = setInterval(async () => {
        try {
          await stream.writeSSE({
            event: 'ping',
            data: JSON.stringify({
              time: Date.now(),
              uptime: whatsAppService.getState().uptimeSeconds,
            }),
          });
        } catch {
          clearInterval(pingInterval);
        }
      }, AppConfig.monitoring.pingIntervalMs);

      // Subscribe to real-time events
      const unsubscribe = monitoringService.subscribe(async ({ event, data }) => {
        try {
          await stream.writeSSE({
            event,
            data: JSON.stringify(data),
          });
        } catch {
          unsubscribe();
          clearInterval(pingInterval);
        }
      });

      stream.onAbort(() => {
        unsubscribe();
        clearInterval(pingInterval);
      });

      while (true) {
        await stream.sleep(60000);
      }
    });
  });

  return router;
}
