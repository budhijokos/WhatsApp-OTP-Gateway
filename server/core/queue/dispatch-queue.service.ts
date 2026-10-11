import PQueue from 'p-queue';
import { AppConfig } from '../config/app.config.js';
import { eventBus } from '../events/event-bus.js';
import { MemoryPressureQueuePurgedError } from '../errors/app-error.js';

export interface QueueStats {
  size: number;
  pending: number;
  isPaused: boolean;
  concurrency: number;
  totalQueued: number;
  totalProcessed: number;
  totalFailed: number;
  autoPurgedCount: number;
  lastAutoPurgedAt: string | null;
  lastPurgeReason?: string | null;
  memoryPressurePurgeActive: boolean;
}

export interface EnqueueOptions {
  priority?: number;
  id?: string;
  type?: 'otp' | 'ecommerce' | 'system';
  ttlMs?: number;
  description?: string;
}

interface EnqueuedJobRecord {
  id: string;
  type: 'otp' | 'ecommerce' | 'system';
  description: string;
  createdAt: number;
  expiresAt: number;
  priority: number;
  status: 'queued' | 'active' | 'completed' | 'failed' | 'purged';
  reject?: (err: any) => void;
  resolve?: (res: any) => void;
}

export class DispatchQueueService {
  private queue: PQueue;
  private totalQueued = 0;
  private totalProcessed = 0;
  private totalFailed = 0;
  private autoPurgedCount = 0;
  private lastAutoPurgedAt: string | null = null;
  private lastPurgeReason: string | null = null;
  private pendingJobs = new Map<string, EnqueuedJobRecord>();
  private backgroundWatcherTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.queue = new PQueue({
      concurrency: (AppConfig as any).queue?.concurrency ?? 1,
      intervalCap: (AppConfig as any).queue?.intervalCap ?? 1,
      interval: (AppConfig as any).queue?.interval ?? 1000,
      autoStart: true,
    });

    this.setupListeners();
    this.startBackgroundWatcher();
  }

  private setupListeners(): void {
    this.queue.on('active', () => {
      this.emitStats();
    });

    this.queue.on('completed', () => {
      this.totalProcessed++;
      this.emitStats();
    });

    this.queue.on('error', () => {
      this.totalFailed++;
      this.emitStats();
    });

    this.queue.on('idle', () => {
      this.emitStats();
    });
  }

  private startBackgroundWatcher(): void {
    if (this.backgroundWatcherTimer) {
      clearInterval(this.backgroundWatcherTimer);
    }

    // Monitor memory pressure and clean up unused/stale queue items periodically
    this.backgroundWatcherTimer = setInterval(() => {
      // 1. Purge expired jobs whose TTL has elapsed
      this.purgeExpiredJobs();

      // 2. Check if memory capacity is nearly full and purge unused queues automatically
      this.checkMemoryPressureAndAutoPurge('Pemeriksaan memori berkala (Background Watcher)');
    }, 10000);

    if (this.backgroundWatcherTimer && typeof this.backgroundWatcherTimer.unref === 'function') {
      this.backgroundWatcherTimer.unref();
    }
  }

  private emitStats(): void {
    eventBus.emit('console:log', {
      level: 'info',
      source: 'system',
      message: `P-Queue status: size=${this.queue.size}, pending=${this.queue.pending}, processed=${this.totalProcessed}, autoPurged=${this.autoPurgedCount}`,
    });
  }

  /**
   * Evaluates current process memory and automatically purges unused/pending queue items
   * if RAM usage reaches threshold or buffer capacity is almost full.
   */
  public checkMemoryPressureAndAutoPurge(reason?: string): number {
    const mem = process.memoryUsage();
    const heapUsedMb = Math.round(mem.heapUsed / 1024 / 1024);
    const threshold = (AppConfig as any).monitoring?.autoPurge?.heapThresholdMb || 220;

    // Trigger auto-purge if heap usage is near capacity (>= threshold or >= 180MB)
    const isMemoryCritical = heapUsedMb >= threshold || heapUsedMb >= 180;

    if (isMemoryCritical) {
      if (this.queue.size > 0 || this.pendingJobs.size > 0) {
        return this.purgeUnusedQueue(
          reason || `Kapasitas Heap RAM mencapai ${heapUsedMb}MB (ambang batas: ${threshold}MB)`
        );
      }
    }
    return 0;
  }

  /**
   * Automatically clears and cancels unused / pending queue tasks to prevent OOM
   */
  public purgeUnusedQueue(reason: string = 'Kapasitas memori hampir penuh'): number {
    const waitingJobs = Array.from(this.pendingJobs.values()).filter(
      (j) => j.status === 'queued'
    );
    const waitingCount = Math.max(waitingJobs.length, this.queue.size);

    if (waitingCount === 0 && this.queue.size === 0) {
      return 0;
    }

    // 1. Reject waiting jobs cleanly so calling promises do not hang
    const purgeError = new MemoryPressureQueuePurgedError(
      `Antrian pesan dibatalkan otomatis: ${reason}`
    );

    for (const job of waitingJobs) {
      job.status = 'purged';
      try {
        job.reject?.(purgeError);
      } catch {
        // ignore settlement error
      }
      this.pendingJobs.delete(job.id);
    }

    // 2. Clear underlying P-Queue buffer
    this.queue.clear();
    this.autoPurgedCount += waitingCount;
    this.lastAutoPurgedAt = new Date().toISOString();
    this.lastPurgeReason = reason;

    // 3. Emit notification event & console log
    eventBus.emit('console:log', {
      level: 'warn',
      source: 'system',
      message: `[Auto-Memory-Purge] Memori hampir penuh! Otomatis membatalkan & membersihkan ${waitingCount} antrian pesan WhatsApp yang tidak digunakan (${reason}).`,
      meta: {
        waitingCount,
        autoPurgedCount: this.autoPurgedCount,
        lastAutoPurgedAt: this.lastAutoPurgedAt,
        reason,
      },
    });

    eventBus.emit('error:logged', {
      category: 'system',
      code: 'QUEUE_PURGED_MEMORY_PRESSURE',
      title: 'Pembersihan Otomatis Antrian (Memori Penuh)',
      details: `${waitingCount} item antrian WhatsApp yang tidak digunakan dibatalkan otomatis untuk membebaskan RAM (${reason}).`,
      suggestedAction:
        'Sistem otomatis memitigasi risiko OOM. Pastikan pesan dikirim ulang saat beban memori telah stabil.',
    });

    // 4. Invoke V8 garbage collector if exposed
    if (typeof (global as any).gc === 'function') {
      try {
        (global as any).gc();
      } catch {
        // ignore
      }
    }

    return waitingCount;
  }

  /**
   * Purges expired tasks (TTL exceeded while waiting in queue)
   */
  public purgeExpiredJobs(): number {
    const now = Date.now();
    let expiredCount = 0;

    for (const [id, job] of this.pendingJobs.entries()) {
      if (job.status === 'queued' && now > job.expiresAt) {
        job.status = 'purged';
        job.reject?.(
          new MemoryPressureQueuePurgedError(
            `Antrian ${job.description} kadaluarsa (TTL ${Math.round(
              (job.expiresAt - job.createdAt) / 1000
            )}s habis sebelum dieksekusi).`
          )
        );
        this.pendingJobs.delete(id);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      this.autoPurgedCount += expiredCount;
      this.lastAutoPurgedAt = new Date().toISOString();
      this.lastPurgeReason = 'TTL antrian habis (expired/stale)';

      eventBus.emit('console:log', {
        level: 'info',
        source: 'system',
        message: `P-Queue: ${expiredCount} antrian kadaluarsa/tidak digunakan otomatis dibersihkan (TTL expired).`,
      });
    }

    return expiredCount;
  }

  /**
   * Enqueue a new message dispatch task with proactive memory pressure checks and lifecycle tracking
   */
  public async enqueue<T>(
    task: () => Promise<T>,
    options?: EnqueueOptions
  ): Promise<T> {
    // 1. Proactively check memory capacity before enqueueing
    this.checkMemoryPressureAndAutoPurge('Cek kapasitas sebelum enqueue');

    // 2. Reject immediately if memory remains critically full
    const mem = process.memoryUsage();
    const heapUsedMb = Math.round(mem.heapUsed / 1024 / 1024);
    const threshold = (AppConfig as any).monitoring?.autoPurge?.heapThresholdMb || 220;
    if (heapUsedMb >= threshold) {
      this.purgeUnusedQueue(`Memori kritis (${heapUsedMb}MB >= ${threshold}MB)`);
      throw new MemoryPressureQueuePurgedError(
        `Kapasitas memori server telah penuh (${heapUsedMb}MB). Permintaan antrian baru ditolak sementara untuk mencegah crash sistem.`
      );
    }

    this.totalQueued++;
    const priority = options?.priority ?? 0;
    const jobId = options?.id || `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const ttlMs = options?.ttlMs ?? (options?.type === 'otp' ? 60000 : 120000);
    const description = options?.description || `${options?.type || 'pesan'} (${jobId})`;

    return new Promise<T>((resolve, reject) => {
      const jobRecord: EnqueuedJobRecord = {
        id: jobId,
        type: options?.type ?? 'otp',
        description,
        createdAt: Date.now(),
        expiresAt: Date.now() + ttlMs,
        priority,
        status: 'queued',
        resolve,
        reject,
      };

      this.pendingJobs.set(jobId, jobRecord);

      eventBus.emit('console:log', {
        level: 'info',
        source: options?.type === 'ecommerce' ? 'ecommerce' : 'hono-api',
        message: `P-Queue: Task dimasukkan ke antrian [${description}, Prioritas: ${priority}, Menunggu: ${this.queue.size + 1}, Aktif: ${this.queue.pending}]`,
      });

      this.queue
        .add(
          async () => {
            // Check if job was purged while waiting in queue
            const currentJob = this.pendingJobs.get(jobId);
            if (!currentJob || currentJob.status === 'purged') {
              throw new MemoryPressureQueuePurgedError(
                'Tugas dibatalkan karena pembersihan antrian memori'
              );
            }

            // Check if job expired while waiting in queue
            if (Date.now() > currentJob.expiresAt) {
              this.pendingJobs.delete(jobId);
              throw new MemoryPressureQueuePurgedError(
                'Tugas dibatalkan karena waktu tunggu antrian kadaluarsa'
              );
            }

            currentJob.status = 'active';
            return await task();
          },
          { priority }
        )
        .then((result) => {
          const currentJob = this.pendingJobs.get(jobId);
          if (currentJob) {
            currentJob.status = 'completed';
            this.pendingJobs.delete(jobId);
          }
          resolve(result as T);
        })
        .catch((err) => {
          const currentJob = this.pendingJobs.get(jobId);
          if (currentJob && currentJob.status !== 'purged') {
            currentJob.status = 'failed';
            this.pendingJobs.delete(jobId);
          }
          reject(err);
        });
    });
  }

  public getStats(): QueueStats {
    const mem = process.memoryUsage();
    const heapUsedMb = Math.round(mem.heapUsed / 1024 / 1024);
    const threshold = (AppConfig as any).monitoring?.autoPurge?.heapThresholdMb || 220;
    const isPressureActive = heapUsedMb >= threshold || heapUsedMb >= 180;

    return {
      size: this.queue.size,
      pending: this.queue.pending,
      isPaused: this.queue.isPaused,
      concurrency: this.queue.concurrency,
      totalQueued: this.totalQueued,
      totalProcessed: this.totalProcessed,
      totalFailed: this.totalFailed,
      autoPurgedCount: this.autoPurgedCount,
      lastAutoPurgedAt: this.lastAutoPurgedAt,
      lastPurgeReason: this.lastPurgeReason,
      memoryPressurePurgeActive: isPressureActive,
    };
  }

  public pause(): void {
    this.queue.pause();
    eventBus.emit('console:log', {
      level: 'warn',
      source: 'system',
      message: 'P-Queue: Antrian pengiriman WhatsApp dijeda (PAUSED)',
    });
  }

  public resume(): void {
    this.queue.start();
    eventBus.emit('console:log', {
      level: 'success',
      source: 'system',
      message: 'P-Queue: Antrian pengiriman WhatsApp dilanjutkan (RESUMED)',
    });
  }

  public clear(): number {
    return this.purgeUnusedQueue('Pembersihan manual pengguna (Manual Clear)');
  }

  public setConcurrency(concurrency: number): void {
    if (concurrency >= 1 && concurrency <= 5) {
      this.queue.concurrency = concurrency;
    }
  }
}

export const dispatchQueueService = new DispatchQueueService();
