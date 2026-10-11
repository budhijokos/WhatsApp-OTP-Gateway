export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed';

export interface DeliveryLog {
  id: string;
  messageId?: string;
  recipient: string;
  maskedRecipient: string;
  otp: string;
  appName: string;
  status: DeliveryStatus;
  sentAt: string;
  latencyMs: number;
  developerId: string;
  developerName?: string;
  errorMessage?: string;
}

export type ErrorCategory = 'auth' | 'socket' | 'validation' | 'delivery' | 'system' | 'ratelimit';

export interface DetailedErrorLog {
  id: string;
  timestamp: string;
  category: ErrorCategory;
  code: string;
  title: string;
  details: string;
  suggestedAction: string;
}

export type LogLevel = 'info' | 'success' | 'warn' | 'error';
export type LogSource = 'whatsapp' | 'hono-api' | 'auth' | 'system' | 'ecommerce';

export interface ConsoleLogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: LogSource;
  message: string;
  meta?: Record<string, unknown>;
}

export interface MemoryHealthInfo {
  heapUsedMb: number;
  heapTotalMb: number;
  rssMb: number;
  maxBufferCapacity: number;
  currentBufferCount: number;
  bufferUsagePercent: number;
  autoPurgeEnabled: boolean;
  status: 'optimal' | 'warning' | 'critical';
  lastPurgedAt: string | null;
  purgeCount: number;
  prunedQueueCount?: number;
}

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
  memoryPressurePurgeActive?: boolean;
}

export interface SystemMetrics {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  successRate: number;
  avgLatencyMs: number;
  errorCount: number;
  waStatus: string;
  memory?: MemoryHealthInfo;
  queue?: QueueStats;
}
