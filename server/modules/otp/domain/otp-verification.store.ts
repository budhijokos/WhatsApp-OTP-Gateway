import { AppConfig } from '../../../core/config/app.config.js';
import { ValidationError } from '../../../core/errors/app-error.js';
import { ErrorCodes } from '../../../core/errors/error-codes.js';
import { PhoneFormatter } from './phone-formatter.js';

export interface OtpSession {
  cleanNumber: string;
  otp: string;
  appName: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  verified: boolean;
  createdAt: number;
}

export class OtpVerificationStore {
  private sessions = new Map<string, OtpSession>();

  public saveSession(cleanNumber: string, otp: string, appName: string, expiresInMinutes: number): OtpSession {
    const session: OtpSession = {
      cleanNumber,
      otp: otp.trim(),
      appName,
      expiresAt: Date.now() + expiresInMinutes * 60 * 1000,
      attempts: 0,
      maxAttempts: AppConfig.otp.maxVerificationAttempts,
      verified: false,
      createdAt: Date.now(),
    };

    this.sessions.set(cleanNumber, session);
    return session;
  }

  public verify(
    cleanNumber: string,
    providedOtp: string
  ): {
    success: boolean;
    verified: boolean;
    message: string;
    attemptsRemaining?: number;
    appName?: string;
  } {
    const session = this.sessions.get(cleanNumber);
    const masked = PhoneFormatter.mask(cleanNumber);

    if (!session) {
      throw new ValidationError(
        `Tidak ditemukan sesi verifikasi OTP aktif untuk nomor +${masked}.`,
        ErrorCodes.OTP_SESSION_NOT_FOUND,
        'Kirimkan kode OTP baru terlebih dahulu melalui endpoint POST /api/v1/otp/send.'
      );
    }

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(cleanNumber);
      throw new ValidationError(
        `Kode OTP untuk nomor +${masked} telah kedaluwarsa.`,
        ErrorCodes.OTP_SESSION_EXPIRED,
        'Masa berlaku kode telah habis. Minta kode OTP baru.'
      );
    }

    if (session.attempts >= session.maxAttempts) {
      this.sessions.delete(cleanNumber);
      throw new ValidationError(
        `Batas percobaan verifikasi telah terlampaui (maksimal ${session.maxAttempts}x percobaan). Sesi OTP dinonaktifkan demi keamanan.`,
        ErrorCodes.OTP_MAX_ATTEMPTS_EXCEEDED,
        'Harap minta kode OTP baru setelah batas jeda selesai.'
      );
    }

    if (session.otp !== providedOtp.trim()) {
      session.attempts += 1;
      const attemptsRemaining = session.maxAttempts - session.attempts;

      if (attemptsRemaining <= 0) {
        this.sessions.delete(cleanNumber);
        throw new ValidationError(
          `Kode OTP salah. Batas maksimal percobaan (${session.maxAttempts}x) telah habis. Sesi OTP dibatalkan.`,
          ErrorCodes.OTP_MAX_ATTEMPTS_EXCEEDED,
          'Harap minta kode OTP baru.'
        );
      }

      return {
        success: false,
        verified: false,
        message: `Kode OTP tidak sesuai. Sisa kesempatan percobaan: ${attemptsRemaining} kali.`,
        attemptsRemaining,
        appName: session.appName,
      };
    }

    // Success
    session.verified = true;
    this.sessions.delete(cleanNumber); // Burn OTP on successful verification (single-use)

    return {
      success: true,
      verified: true,
      message: `Verifikasi OTP berhasil untuk nomor +${masked}.`,
      appName: session.appName,
    };
  }

  public getSession(cleanNumber: string): OtpSession | undefined {
    return this.sessions.get(cleanNumber);
  }
}

export const otpVerificationStore = new OtpVerificationStore();
