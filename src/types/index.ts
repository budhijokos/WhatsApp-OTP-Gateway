export type WhatsAppConnectionStatus = 'disconnected' | 'connecting' | 'qr_ready' | 'connected';

export interface WhatsAppState {
  status: WhatsAppConnectionStatus;
  phone: string | null;
  pushName: string | null;
  qrDataUrl: string | null;
  qrRaw: string | null;
  pairingCode: string | null;
  lastDisconnectReason: string | null;
  connectedAt: string | null;
  uptimeSeconds: number;
}

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
  waStatus: WhatsAppConnectionStatus;
  memory?: MemoryHealthInfo;
  queue?: QueueStats;
}

export interface DeveloperTokenResult {
  token: string;
  tokenType: string;
  expiresIn: string;
  payload: {
    sub: string;
    name: string;
    permissions: string[];
  };
  sampleCurl: string;
}

export type KeyStatus = 'active' | 'rotating' | 'revoked';
export type KeyEnvironment = 'production' | 'staging' | 'development';

export interface KeyRotationInfo {
  previousToken?: string;
  previousTokenExpiresAt?: string;
  rotatedAt: string;
  gracePeriodHours: number;
}

export interface ApiKeyItem {
  id: string;
  clientId: string;
  clientName: string;
  environment: KeyEnvironment;
  permissions: string[];
  expiresIn: string;
  expiresAt: string | null;
  status: KeyStatus;
  token: string;
  tokenPreview: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
  usageCount: number;
  revokedAt?: string | null;
  revocationReason?: string | null;
  rotationInfo?: KeyRotationInfo | null;
}

export interface ApiKeyStats {
  total: number;
  active: number;
  rotating: number;
  revoked: number;
  totalUsage: number;
}

export interface RateLimitAccountStat {
  keyId: string;
  clientId: string;
  clientName: string;
  successfulRequests: number;
  throttledRequests: number;
  totalRequests: number;
  throttledPercentage: number;
  lastSuccessAt: string | null;
  lastThrottledAt: string | null;
  currentWindowCount: number;
  remainingInWindow: number;
  limitPerMinute: number;
}

export interface RateLimitSummary {
  totalRequests: number;
  totalSuccessful: number;
  totalThrottled: number;
  overallThrottledRate: number;
  activeKeysCount: number;
}

export interface RateLimitActivityResponse {
  success: boolean;
  summary: RateLimitSummary;
  data: RateLimitAccountStat[];
}

export type EcommerceEventType =
  | 'order_created'
  | 'payment_received'
  | 'order_processing'
  | 'shipping_dispatched'
  | 'order_delivered'
  | 'cod_confirmation'
  | 'abandoned_cart';

export interface EcommerceEventData {
  customerName?: string;
  orderId?: string;
  storeName?: string;
  itemsSummary?: string;
  totalAmount?: string;
  paymentMethod?: string;
  paymentInstruction?: string;
  courier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  deliveryAddress?: string;
  checkoutUrl?: string;
  discountPromo?: string;
  estimateDays?: string;
  customData?: Record<string, string | number>;
  [key: string]: unknown;
}

export interface EcommerceEventTriggerDto {
  event: EcommerceEventType;
  to: string;
  data: EcommerceEventData;
  customMessage?: string;
  bypassRateLimit?: boolean;
  webhookUrl?: string;
}

export interface EcommerceEventTemplate {
  id: EcommerceEventType;
  title: string;
  badge: string;
  description: string;
  icon: string;
  enabled: boolean;
  template: string;
  sampleData: EcommerceEventData;
}

export interface EcommerceTriggerResult {
  success: boolean;
  message: string;
  data: {
    messageId: string;
    event: EcommerceEventType;
    recipient: string;
    maskedRecipient: string;
    storeName: string;
    orderId?: string;
    compiledMessage: string;
    sentAt: string;
    latencyMs: number;
    simulatedTypingMs: number;
  };
}

export interface WebhookSimulationPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  event: string;
  defaultPayload: Record<string, unknown>;
}

export interface WebhookSimulationRequest {
  targetUrl: string;
  event: string;
  payload: Record<string, unknown>;
  customHeaders?: Record<string, string>;
  signatureSecret?: string;
  timeoutMs?: number;
}

export interface WebhookSimulationResponse {
  success: boolean;
  statusCode: number;
  statusText: string;
  latencyMs: number;
  request: {
    targetUrl: string;
    method: string;
    headers: Record<string, string>;
    payload: Record<string, unknown>;
  };
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    isJson: boolean;
    jsonBody?: unknown;
  };
  signatureHeader?: string;
  timestamp: string;
  diagnosis: string;
}

