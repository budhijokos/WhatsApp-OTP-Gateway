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
export type LogSource = 'whatsapp' | 'hono-api' | 'auth' | 'system';

export interface ConsoleLogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: LogSource;
  message: string;
  meta?: Record<string, unknown>;
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
