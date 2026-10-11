import { MiddlewareHandler } from 'hono';
import { AppConfig } from '../config/app.config.js';
import { RateLimitError } from '../errors/app-error.js';
import { ErrorCodes } from '../errors/error-codes.js';
import { eventBus } from '../events/event-bus.js';
import { ApiKey, DeveloperClaims } from '../../modules/auth/domain/auth.types.js';

export interface DeveloperRateLimitOptions {
  maxRequests?: number;
  windowMs?: number;
  allowBypass?: boolean;
}

interface DeveloperWindowRecord {
  timestamps: number[];
  successfulRequests: number;
  throttledRequests: number;
  lastSuccessAt: string | null;
  lastThrottledAt: string | null;
  clientName: string;
  clientId: string;
  keyId?: string;
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

export class DeveloperRateLimiterStore {
  private records = new Map<string, DeveloperWindowRecord>();
  private requestCounter = 0;

  constructor() {
    this.seedInitialStats();
  }

  private seedInitialStats(): void {
    const now = Date.now();
    // Pre-seed realistic stats for default demo/test client accounts
    this.records.set('ecommerce_auth', {
      timestamps: [now - 15000, now - 8000, now - 3000],
      successfulRequests: 142,
      throttledRequests: 18,
      lastSuccessAt: new Date(now - 3000).toISOString(),
      lastThrottledAt: new Date(now - 35000).toISOString(),
      clientName: 'Web E-Commerce Checkout',
      clientId: 'ecommerce_auth',
      keyId: 'key_ecom_prod',
    });

    this.records.set('finpay_mobile_prod', {
      timestamps: [now - 22000, now - 11000],
      successfulRequests: 284,
      throttledRequests: 9,
      lastSuccessAt: new Date(now - 11000).toISOString(),
      lastThrottledAt: new Date(now - 120000).toISOString(),
      clientName: 'FinPay Mobile App iOS',
      clientId: 'finpay_mobile_prod',
      keyId: 'key_finpay_ios',
    });

    this.records.set('default_test_client', {
      timestamps: [now - 5000],
      successfulRequests: 46,
      throttledRequests: 5,
      lastSuccessAt: new Date(now - 5000).toISOString(),
      lastThrottledAt: new Date(now - 85000).toISOString(),
      clientName: 'Default Test Client',
      clientId: 'default_test_client',
      keyId: 'key_default_sample',
    });
  }

  public checkAndRecord(
    accountKey: string,
    maxRequests: number,
    windowMs: number,
    clientName: string = accountKey,
    keyId?: string
  ): { allowed: boolean; remaining: number; resetAfterSeconds: number } {
    const now = Date.now();
    let record = this.records.get(accountKey);

    if (!record) {
      record = {
        timestamps: [],
        successfulRequests: 0,
        throttledRequests: 0,
        lastSuccessAt: null,
        lastThrottledAt: null,
        clientName,
        clientId: accountKey,
        keyId,
      };
      this.records.set(accountKey, record);
    } else {
      if (clientName) record.clientName = clientName;
      if (keyId) record.keyId = keyId;
    }

    const windowStart = now - windowMs;
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= maxRequests) {
      record.throttledRequests += 1;
      record.lastThrottledAt = new Date(now).toISOString();

      const oldest = record.timestamps[0];
      const resetAfterMs = oldest + windowMs - now;
      const resetAfterSeconds = Math.max(1, Math.ceil(resetAfterMs / 1000));
      return {
        allowed: false,
        remaining: 0,
        resetAfterSeconds,
      };
    }

    // Success
    record.timestamps.push(now);
    record.successfulRequests += 1;
    record.lastSuccessAt = new Date(now).toISOString();

    const remaining = Math.max(0, maxRequests - record.timestamps.length);
    const oldest = record.timestamps[0];
    const resetAfterMs = oldest + windowMs - now;
    const resetAfterSeconds = Math.max(1, Math.ceil(resetAfterMs / 1000));

    // Garbage collection periodically
    this.requestCounter++;
    if (this.requestCounter % 100 === 0) {
      this.cleanup(windowMs);
    }

    return {
      allowed: true,
      remaining,
      resetAfterSeconds,
    };
  }

  public simulateTraffic(
    accountKey: string,
    successAdd: number,
    throttledAdd: number,
    clientName?: string,
    keyId?: string
  ): RateLimitAccountStat {
    const now = Date.now();
    let record = this.records.get(accountKey);
    if (!record) {
      record = {
        timestamps: [],
        successfulRequests: 0,
        throttledRequests: 0,
        lastSuccessAt: null,
        lastThrottledAt: null,
        clientName: clientName || accountKey,
        clientId: accountKey,
        keyId,
      };
      this.records.set(accountKey, record);
    }

    record.successfulRequests += successAdd;
    record.throttledRequests += throttledAdd;
    if (successAdd > 0) record.lastSuccessAt = new Date().toISOString();
    if (throttledAdd > 0) record.lastThrottledAt = new Date().toISOString();

    const total = record.successfulRequests + record.throttledRequests;
    const pct = total > 0 ? (record.throttledRequests / total) * 100 : 0;

    return {
      keyId: record.keyId || record.clientId,
      clientId: record.clientId,
      clientName: record.clientName,
      successfulRequests: record.successfulRequests,
      throttledRequests: record.throttledRequests,
      totalRequests: total,
      throttledPercentage: parseFloat(pct.toFixed(1)),
      lastSuccessAt: record.lastSuccessAt,
      lastThrottledAt: record.lastThrottledAt,
      currentWindowCount: record.timestamps.length,
      remainingInWindow: Math.max(0, AppConfig.rateLimit.tokenMaxRequestsPerMinute - record.timestamps.length),
      limitPerMinute: AppConfig.rateLimit.tokenMaxRequestsPerMinute,
    };
  }

  public getRateLimitStats(registeredKeys: ApiKey[]): {
    summary: RateLimitSummary;
    data: RateLimitAccountStat[];
  } {
    const now = Date.now();
    const windowMs = 60000;
    const maxLimit = AppConfig.rateLimit.tokenMaxRequestsPerMinute;

    const dataMap = new Map<string, RateLimitAccountStat>();

    // 1. Populate from registered keys
    for (const key of registeredKeys) {
      const rec = this.records.get(key.clientId);
      const timestamps = rec?.timestamps.filter((ts) => ts > now - windowMs) || [];
      const successful = (rec?.successfulRequests || 0) + (key.usageCount > (rec?.successfulRequests || 0) ? key.usageCount : 0);
      const throttled = rec?.throttledRequests || 0;
      const total = successful + throttled;
      const pct = total > 0 ? (throttled / total) * 100 : 0;

      dataMap.set(key.clientId, {
        keyId: key.id,
        clientId: key.clientId,
        clientName: key.clientName,
        successfulRequests: successful,
        throttledRequests: throttled,
        totalRequests: total,
        throttledPercentage: parseFloat(pct.toFixed(1)),
        lastSuccessAt: rec?.lastSuccessAt || key.lastUsedAt,
        lastThrottledAt: rec?.lastThrottledAt || null,
        currentWindowCount: timestamps.length,
        remainingInWindow: Math.max(0, maxLimit - timestamps.length),
        limitPerMinute: maxLimit,
      });
    }

    // 2. Include any active records in memory not in registeredKeys
    for (const [clientId, rec] of this.records.entries()) {
      if (!dataMap.has(clientId)) {
        const timestamps = rec.timestamps.filter((ts) => ts > now - windowMs);
        const total = rec.successfulRequests + rec.throttledRequests;
        const pct = total > 0 ? (rec.throttledRequests / total) * 100 : 0;

        dataMap.set(clientId, {
          keyId: rec.keyId || clientId,
          clientId: rec.clientId,
          clientName: rec.clientName,
          successfulRequests: rec.successfulRequests,
          throttledRequests: rec.throttledRequests,
          totalRequests: total,
          throttledPercentage: parseFloat(pct.toFixed(1)),
          lastSuccessAt: rec.lastSuccessAt,
          lastThrottledAt: rec.lastThrottledAt,
          currentWindowCount: timestamps.length,
          remainingInWindow: Math.max(0, maxLimit - timestamps.length),
          limitPerMinute: maxLimit,
        });
      }
    }

    const data = Array.from(dataMap.values()).sort((a, b) => b.totalRequests - a.totalRequests);

    let totalRequests = 0;
    let totalSuccessful = 0;
    let totalThrottled = 0;

    for (const item of data) {
      totalRequests += item.totalRequests;
      totalSuccessful += item.successfulRequests;
      totalThrottled += item.throttledRequests;
    }

    const overallThrottledRate =
      totalRequests > 0 ? parseFloat(((totalThrottled / totalRequests) * 100).toFixed(1)) : 0;

    return {
      summary: {
        totalRequests,
        totalSuccessful,
        totalThrottled,
        overallThrottledRate,
        activeKeysCount: data.length,
      },
      data,
    };
  }

  public reset(accountKey?: string): void {
    if (accountKey) {
      this.records.delete(accountKey);
    } else {
      this.records.clear();
      this.seedInitialStats();
    }
  }

  private cleanup(windowMs: number): void {
    const now = Date.now();
    const cutoff = now - windowMs * 2;
    for (const [key, record] of this.records.entries()) {
      record.timestamps = record.timestamps.filter((ts) => ts > cutoff);
    }
  }
}

export const developerRateLimiterStore = new DeveloperRateLimiterStore();

/**
 * Middleware to enforce rate-limiting per individual developer account.
 * Inspects `c.get('developer')` populated by `createAuthGuard`.
 */
export function createDeveloperRateLimitMiddleware(
  options: DeveloperRateLimitOptions = {}
): MiddlewareHandler<{
  Variables: { developer?: DeveloperClaims };
}> {
  const maxRequests = options.maxRequests ?? AppConfig.rateLimit.tokenMaxRequestsPerMinute;
  const windowMs = options.windowMs ?? 60000;
  const allowBypass = options.allowBypass ?? AppConfig.rateLimit.allowBypassWithHeader;

  return async (c, next) => {
    // 1. Check for rate limit bypass header if configured
    const bypassHeader = c.req.header('x-bypass-rate-limit');
    if (allowBypass && (bypassHeader === 'true' || bypassHeader === '1')) {
      c.header('X-RateLimit-Bypassed', 'true');
      return await next();
    }

    // 2. Resolve Developer Identity
    const developer = c.get('developer');
    const accountKey = developer?.sub || c.req.header('x-forwarded-for') || 'dev_anonymous';
    const accountName = developer?.name || accountKey;
    const keyId = developer?.kid;

    // 3. Evaluate Sliding Window and record
    const result = developerRateLimiterStore.checkAndRecord(
      accountKey,
      maxRequests,
      windowMs,
      accountName,
      keyId
    );

    // 4. Set Standard IETF RFC Rate-Limit HTTP Headers
    c.header('RateLimit-Limit', String(maxRequests));
    c.header('RateLimit-Remaining', String(result.remaining));
    c.header('RateLimit-Reset', String(result.resetAfterSeconds));

    if (!result.allowed) {
      c.header('Retry-After', String(result.resetAfterSeconds));

      // Emit observability event for dashboard and live console
      eventBus.emit('console:log', {
        level: 'warn',
        source: 'hono-api',
        message: `Rate limit exceeded for developer account '${accountName}' (${accountKey}): ${maxRequests} req/min reached. Retry after ${result.resetAfterSeconds}s.`,
      });

      throw new RateLimitError(
        `Batas frekuensi permintaan terlampaui: Akun pengembang '${accountName}' (${accountKey}) telah mencapai batas maksimal ${maxRequests} permintaan per menit.`,
        ErrorCodes.RATE_LIMIT_EXCEEDED,
        `Harap tunggu ${result.resetAfterSeconds} detik lagi sebelum mengirim permintaan berikutnya. Hubungi administrator jika aplikasi Anda membutuhkan kapasitas kuota lebih tinggi.`,
        {
          developerAccount: accountKey,
          developerName: accountName,
          limitPerMinute: maxRequests,
          retryAfterSeconds: result.resetAfterSeconds,
          windowSeconds: Math.round(windowMs / 1000),
        }
      );
    }

    await next();
  };
}
