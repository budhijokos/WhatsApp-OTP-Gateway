import { AppConfig } from '../../../core/config/app.config.js';
import { RateLimitError } from '../../../core/errors/app-error.js';
import { ErrorCodes } from '../../../core/errors/error-codes.js';
import { PhoneFormatter } from './phone-formatter.js';

interface RecipientCooldownRecord {
  lastSentAt: number;
}

interface TokenBucketRecord {
  timestamps: number[];
}

export class OtpRateLimiter {
  private recipientCooldowns = new Map<string, RecipientCooldownRecord>();

  /**
   * Check and enforce cooldown rate limit for recipient phone number.
   * Throws RateLimitError (HTTP 429) if limits are breached.
   */
  public checkAndRecord(cleanNumber: string, _developerId?: string, bypass: boolean = false): void {
    if (bypass && AppConfig.rateLimit.allowBypassWithHeader) {
      return;
    }

    const now = Date.now();
    const cooldownMs = AppConfig.rateLimit.recipientCooldownSeconds * 1000;

    // 1. Check Recipient Cooldown
    const existingRecipient = this.recipientCooldowns.get(cleanNumber);
    if (existingRecipient) {
      const elapsed = now - existingRecipient.lastSentAt;
      if (elapsed < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - elapsed) / 1000);
        const masked = PhoneFormatter.mask(cleanNumber);

        throw new RateLimitError(
          `Terlalu banyak permintaan: Harap tunggu ${remainingSeconds} detik lagi sebelum mengirim OTP baru ke nomor +${masked}.`,
          ErrorCodes.RATE_LIMIT_COOLDOWN,
          `Gunakan jeda minimal ${AppConfig.rateLimit.recipientCooldownSeconds} detik per nomor penerima untuk mencegah spam dan pemblokiran akun WhatsApp.`,
          {
            retryAfterSeconds: remainingSeconds,
            recipient: '+' + masked,
          }
        );
      }
    }

    // Record usage
    this.recipientCooldowns.set(cleanNumber, { lastSentAt: now });

    // Garbage collection of old cooldown records
    if (this.recipientCooldowns.size > 500) {
      this.cleanup();
    }
  }

  public getRemainingCooldownSeconds(cleanNumber: string): number {
    const existing = this.recipientCooldowns.get(cleanNumber);
    if (!existing) return 0;
    const elapsed = Date.now() - existing.lastSentAt;
    const cooldownMs = AppConfig.rateLimit.recipientCooldownSeconds * 1000;
    if (elapsed >= cooldownMs) return 0;
    return Math.ceil((cooldownMs - elapsed) / 1000);
  }

  private cleanup(): void {
    const cutoff = Date.now() - AppConfig.rateLimit.recipientCooldownSeconds * 1000 * 2;
    for (const [key, val] of this.recipientCooldowns.entries()) {
      if (val.lastSentAt < cutoff) {
        this.recipientCooldowns.delete(key);
      }
    }
  }
}

export const otpRateLimiter = new OtpRateLimiter();
