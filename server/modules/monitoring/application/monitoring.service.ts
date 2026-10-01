import { eventBus } from '../../../core/events/event-bus.js';
import { InMemoryLogStore } from '../infrastructure/in-memory-log.store.js';
import {
  ConsoleLogEntry,
  DeliveryLog,
  DetailedErrorLog,
  SystemMetrics,
} from '../domain/monitoring.types.js';

export class MonitoringService {
  private store = new InMemoryLogStore();
  private sseClients = new Set<(payload: { event: string; data: unknown }) => void>();
  private waStatusProvider: () => string;

  constructor(waStatusProvider: () => string = () => 'disconnected') {
    this.waStatusProvider = waStatusProvider;
    this.registerEventListeners();
  }

  public setWaStatusProvider(provider: () => string) {
    this.waStatusProvider = provider;
  }

  private registerEventListeners(): void {
    // Listen to console logs
    eventBus.on('console:log', (entry) => {
      const fullEntry: ConsoleLogEntry = {
        id: 'log_' + Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        ...entry,
      };
      this.store.addConsoleLog(fullEntry);
      this.broadcast('console_log', fullEntry);
    });

    // Listen to error logs
    eventBus.on('error:logged', (err) => {
      const errorLog: DetailedErrorLog = {
        id: 'err_' + Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        category: err.category,
        code: err.code,
        title: err.title,
        details: typeof err.details === 'string' ? err.details : JSON.stringify(err.details, null, 2),
        suggestedAction: err.suggestedAction,
      };

      this.store.addErrorLog(errorLog);
      this.broadcast('error_log', errorLog);

      // Also echo as error in console logs
      eventBus.emit('console:log', {
        level: 'error',
        source: err.category === 'socket' ? 'whatsapp' : err.category === 'auth' ? 'auth' : 'hono-api',
        message: `[${err.code}] ${err.title}`,
        meta: { details: errorLog.details, suggestedAction: err.suggestedAction },
      });
    });

    // Listen to delivery created
    eventBus.on('delivery:created', (payload) => {
      const log: DeliveryLog = { ...payload };
      this.store.addDeliveryLog(log);
      this.broadcast('delivery_log', log);
    });

    // Listen to delivery status updated
    eventBus.on('delivery:updated', ({ id, status, messageId, latencyMs, errorMessage }) => {
      const updated = this.store.updateDeliveryLog(id, {
        status,
        ...(messageId && { messageId }),
        ...(latencyMs !== undefined && { latencyMs }),
        ...(errorMessage && { errorMessage }),
      });
      if (updated) {
        this.broadcast('delivery_update', updated);
      }
    });

    // Listen to WhatsApp state updates
    eventBus.on('whatsapp:state_updated', (waState) => {
      this.broadcast('wa_state', waState);
    });
  }

  public getDeliveryLogs(limit = 100, status?: string): DeliveryLog[] {
    return this.store.getDeliveryLogs(limit, status);
  }

  public clearDeliveryLogs(): void {
    this.store.clearDeliveryLogs();
    this.broadcast('delivery_cleared', {});
  }

  public getErrorLogs(limit = 100): DetailedErrorLog[] {
    return this.store.getErrorLogs(limit);
  }

  public clearErrorLogs(): void {
    this.store.clearErrorLogs();
    this.broadcast('errors_cleared', {});
  }

  public getConsoleLogs(limit = 200, source?: string, level?: string): ConsoleLogEntry[] {
    return this.store.getConsoleLogs(limit, source, level);
  }

  public clearConsoleLogs(): void {
    this.store.clearConsoleLogs();
    this.broadcast('console_cleared', {});
  }

  public getMetrics(): SystemMetrics {
    const all = this.store.getDeliveryLogs(1000);
    const total = all.length;
    const sent = all.filter((l) => l.status === 'sent' || l.status === 'delivered').length;
    const failed = all.filter((l) => l.status === 'failed').length;
    const pending = all.filter((l) => l.status === 'pending').length;

    const avgLatency =
      sent > 0
        ? Math.round(
            all
              .filter((l) => l.status === 'sent' || l.status === 'delivered')
              .reduce((acc, curr) => acc + curr.latencyMs, 0) / sent
          )
        : 0;

    return {
      total,
      sent,
      failed,
      pending,
      successRate: total > 0 ? Math.round((sent / total) * 100) : 100,
      avgLatencyMs: avgLatency,
      errorCount: this.store.getErrorLogs(1000).length,
      waStatus: this.waStatusProvider(),
    };
  }

  public subscribe(callback: (payload: { event: string; data: unknown }) => void): () => void {
    this.sseClients.add(callback);
    return () => {
      this.sseClients.delete(callback);
    };
  }

  private broadcast(event: string, data: unknown): void {
    for (const client of this.sseClients) {
      try {
        client({ event, data });
      } catch {
        this.sseClients.delete(client);
      }
    }
  }
}

export const monitoringService = new MonitoringService();
