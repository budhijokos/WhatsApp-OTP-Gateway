import { AppConfig } from '../../../core/config/app.config.js';
import { eventBus } from '../../../core/events/event-bus.js';
import { dispatchQueueService } from '../../../core/queue/dispatch-queue.service.js';
import {
  ConsoleLogEntry,
  DeliveryLog,
  DetailedErrorLog,
  MemoryHealthInfo,
} from '../domain/monitoring.types.js';

export class InMemoryLogStore {
  private deliveryLogs: DeliveryLog[] = [];
  private errorLogs: DetailedErrorLog[] = [];
  private consoleLogs: ConsoleLogEntry[] = [];

  private lastPurgedAt: string | null = null;
  private purgeCount = 0;
  private autoPurgeEnabled: boolean = AppConfig.monitoring.autoPurge.enabled;
  private isPurging = false;
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.startBackgroundMemoryWatcher();
  }

  private startBackgroundMemoryWatcher(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.checkAndAutoPurge('background_watch');
    }, AppConfig.monitoring.autoPurge.checkIntervalMs);

    // Prevent unref error in some test runners
    if (this.timer && typeof this.timer.unref === 'function') {
      this.timer.unref();
    }
  }

  // --- Memory Health & Auto-Purge Logic ---
  public getMemoryHealth(): MemoryHealthInfo {
    const mem = process.memoryUsage();
    const heapUsedMb = Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10;
    const heapTotalMb = Math.round((mem.heapTotal / 1024 / 1024) * 10) / 10;
    const rssMb = Math.round((mem.rss / 1024 / 1024) * 10) / 10;

    const maxBufferCapacity =
      AppConfig.monitoring.maxDeliveryLogs +
      AppConfig.monitoring.maxErrorLogs +
      AppConfig.monitoring.maxConsoleLogs;

    const currentBufferCount =
      this.deliveryLogs.length + this.errorLogs.length + this.consoleLogs.length;

    const bufferUsagePercent = Math.min(
      100,
      Math.round((currentBufferCount / maxBufferCapacity) * 100)
    );

    let status: 'optimal' | 'warning' | 'critical' = 'optimal';
    if (
      bufferUsagePercent >= AppConfig.monitoring.autoPurge.highWatermarkRatio * 100 ||
      heapUsedMb >= AppConfig.monitoring.autoPurge.heapThresholdMb
    ) {
      status = 'critical';
    } else if (
      bufferUsagePercent >= 75 ||
      heapUsedMb >= AppConfig.monitoring.autoPurge.heapThresholdMb * 0.75
    ) {
      status = 'warning';
    }

    return {
      heapUsedMb,
      heapTotalMb,
      rssMb,
      maxBufferCapacity,
      currentBufferCount,
      bufferUsagePercent,
      autoPurgeEnabled: this.autoPurgeEnabled,
      status,
      lastPurgedAt: this.lastPurgedAt,
      purgeCount: this.purgeCount,
      prunedQueueCount: dispatchQueueService.getStats().autoPurgedCount,
    };
  }

  public checkAndAutoPurge(trigger: string = 'threshold', force: boolean = false): {
    purged: boolean;
    prunedDelivery: number;
    prunedConsole: number;
    prunedErrors: number;
    prunedQueue: number;
    totalPruned: number;
    message: string;
  } {
    if ((!this.autoPurgeEnabled && !force) || this.isPurging) {
      return {
        purged: false,
        prunedDelivery: 0,
        prunedConsole: 0,
        prunedErrors: 0,
        prunedQueue: 0,
        totalPruned: 0,
        message: 'Auto purge nonaktif atau sedang berlangsung.',
      };
    }

    const mem = process.memoryUsage();
    const heapUsedMb = Math.round(mem.heapUsed / 1024 / 1024);
    const maxBufferCapacity =
      AppConfig.monitoring.maxDeliveryLogs +
      AppConfig.monitoring.maxErrorLogs +
      AppConfig.monitoring.maxConsoleLogs;
    const currentBufferCount =
      this.deliveryLogs.length + this.errorLogs.length + this.consoleLogs.length;
    const bufferRatio = currentBufferCount / maxBufferCapacity;

    const isBufferNearFull = bufferRatio >= AppConfig.monitoring.autoPurge.highWatermarkRatio;
    const isHeapNearFull = heapUsedMb >= AppConfig.monitoring.autoPurge.heapThresholdMb;

    if (!isBufferNearFull && !isHeapNearFull && !force) {
      return {
        purged: false,
        prunedDelivery: 0,
        prunedConsole: 0,
        prunedErrors: 0,
        prunedQueue: 0,
        totalPruned: 0,
        message: 'Kapasitas memori masih dalam ambang batas aman.',
      };
    }

    this.isPurging = true;
    try {
      const purgeRatio = AppConfig.monitoring.autoPurge.purgeBatchRatio;

      // 1. Prune console logs (highest volume, lowest persistence criticality)
      const initialConsole = this.consoleLogs.length;
      const targetConsolePrune = Math.max(1, Math.round(initialConsole * purgeRatio));
      const keepConsole = Math.max(0, initialConsole - targetConsolePrune);
      this.consoleLogs = this.consoleLogs.slice(0, keepConsole);
      const prunedConsole = initialConsole - this.consoleLogs.length;

      // 2. Prune old successful delivery logs (retain recent and pending logs)
      const initialDelivery = this.deliveryLogs.length;
      const targetDeliveryPrune = Math.max(1, Math.round(initialDelivery * purgeRatio));
      const keepDelivery = Math.max(0, initialDelivery - targetDeliveryPrune);
      this.deliveryLogs = this.deliveryLogs.slice(0, keepDelivery);
      const prunedDelivery = initialDelivery - this.deliveryLogs.length;

      // 3. Prune old errors gently (20% of error buffer)
      const initialErrors = this.errorLogs.length;
      const targetErrorPrune = Math.round(initialErrors * 0.2);
      const keepErrors = Math.max(0, initialErrors - targetErrorPrune);
      this.errorLogs = this.errorLogs.slice(0, keepErrors);
      const prunedErrors = initialErrors - this.errorLogs.length;

      // 4. Prune unused / pending queue tasks in P-Queue when memory is nearly full
      const prunedQueue = dispatchQueueService.purgeUnusedQueue(
        `Kapasitas memori hampir penuh (${Math.round(bufferRatio * 100)}% buffer / ${heapUsedMb}MB heap, trigger: ${trigger})`
      );

      const totalPruned = prunedConsole + prunedDelivery + prunedErrors + prunedQueue;
      this.lastPurgedAt = new Date().toISOString();
      this.purgeCount++;

      // Trigger Node.js V8 garbage collection hint if available
      if (typeof (global as any).gc === 'function') {
        try {
          (global as any).gc();
        } catch {
          // ignore
        }
      }

      const queueNote = prunedQueue > 0 ? `, ${prunedQueue} antrian pesan dibatalkan` : '';
      const logMsg = `[Auto-Memory-Purge] Memori hampir penuh (${Math.round(bufferRatio * 100)}% buffer / ${heapUsedMb}MB heap). Berhasil memangkas ${totalPruned} item otomatis (${prunedDelivery} delivery, ${prunedConsole} console, ${prunedErrors} errors${queueNote}).`;

      eventBus.emit('console:log', {
        level: 'warn',
        source: 'system',
        message: logMsg,
        meta: {
          trigger,
          totalPruned,
          prunedDelivery,
          prunedConsole,
          prunedErrors,
          prunedQueue,
          heapUsedMb,
          bufferRatio: Math.round(bufferRatio * 100),
        },
      });

      return {
        purged: true,
        prunedDelivery,
        prunedConsole,
        prunedErrors,
        prunedQueue,
        totalPruned,
        message: logMsg,
      };
    } finally {
      this.isPurging = false;
    }
  }

  public setAutoPurgeEnabled(enabled: boolean): void {
    this.autoPurgeEnabled = enabled;
  }

  // --- Delivery Logs ---
  public addDeliveryLog(log: DeliveryLog): void {
    this.deliveryLogs.unshift(log);
    if (this.deliveryLogs.length > AppConfig.monitoring.maxDeliveryLogs) {
      this.deliveryLogs.pop();
    }
    // Proactive check if near full
    if (this.deliveryLogs.length >= AppConfig.monitoring.maxDeliveryLogs * 0.95) {
      this.checkAndAutoPurge('delivery_capacity');
    }
  }

  public updateDeliveryLog(id: string, partial: Partial<DeliveryLog>): DeliveryLog | undefined {
    const item = this.deliveryLogs.find((l) => l.id === id);
    if (item) {
      Object.assign(item, partial);
    }
    return item;
  }

  public getDeliveryLogs(limit = 100, status?: string): DeliveryLog[] {
    let filtered = this.deliveryLogs;
    if (status) {
      filtered = filtered.filter((l) => l.status === status);
    }
    return filtered.slice(0, limit);
  }

  public clearDeliveryLogs(): void {
    this.deliveryLogs = [];
  }

  // --- Error Logs ---
  public addErrorLog(error: DetailedErrorLog): void {
    this.errorLogs.unshift(error);
    if (this.errorLogs.length > AppConfig.monitoring.maxErrorLogs) {
      this.errorLogs.pop();
    }
    if (this.errorLogs.length >= AppConfig.monitoring.maxErrorLogs * 0.95) {
      this.checkAndAutoPurge('error_capacity');
    }
  }

  public getErrorLogs(limit = 100): DetailedErrorLog[] {
    return this.errorLogs.slice(0, limit);
  }

  public clearErrorLogs(): void {
    this.errorLogs = [];
  }

  // --- Console Logs ---
  public addConsoleLog(entry: ConsoleLogEntry): void {
    this.consoleLogs.unshift(entry);
    if (this.consoleLogs.length > AppConfig.monitoring.maxConsoleLogs) {
      this.consoleLogs.pop();
    }
    if (this.consoleLogs.length >= AppConfig.monitoring.maxConsoleLogs * 0.95) {
      this.checkAndAutoPurge('console_capacity');
    }
  }

  public getConsoleLogs(limit = 200, source?: string, level?: string): ConsoleLogEntry[] {
    let filtered = this.consoleLogs;
    if (source) filtered = filtered.filter((l) => l.source === source);
    if (level) filtered = filtered.filter((l) => l.level === level);
    return filtered.slice(0, limit);
  }

  public clearConsoleLogs(): void {
    this.consoleLogs = [];
  }
}
