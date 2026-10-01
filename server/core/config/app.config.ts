import path from 'path';

export const AppConfig = {
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    isProduction: process.env.NODE_ENV === 'production',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'wa_otp_gateway_secret_baileys_hono_2026',
    defaultExpiresIn: '30d',
    issuer: 'wa-otp-gateway',
  },
  whatsapp: {
    authDir: path.resolve(process.cwd(), '.baileys_auth'),
    browser: ['Ubuntu', 'Chrome', '124.0.0.0'] as [string, string, string],
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 30000,
    reconnectDelayMs: 2500,
    maxReconnectDelayMs: 15000,
  },
  otp: {
    defaultAppName: 'Aplikasi Layanan',
    defaultExpiresInMinutes: 5,
    minPhoneDigits: 10,
    maxVerificationAttempts: 3,
  },
  rateLimit: {
    recipientCooldownSeconds: 60,
    tokenMaxRequestsPerMinute: 60,
    allowBypassWithHeader: true, // Allow X-Bypass-Rate-Limit: true for automated testing if desired
  },
  simulation: {
    typingPresence: true,
    minTypingDelayMs: 1100,
    maxTypingDelayMs: 2000,
  },
  webhook: {
    defaultTimeoutMs: 5000,
  },
  monitoring: {
    maxDeliveryLogs: 250,
    maxErrorLogs: 150,
    maxConsoleLogs: 300,
    pingIntervalMs: 15000,
  },
} as const;

export type AppConfigType = typeof AppConfig;
