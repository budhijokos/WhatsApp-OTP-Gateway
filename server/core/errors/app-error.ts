import { ErrorCode, ErrorCodes } from './error-codes.js';

export type ErrorCategory = 'auth' | 'socket' | 'validation' | 'delivery' | 'system' | 'ratelimit';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly suggestedAction: string;
  public readonly details?: unknown;
  public readonly category: ErrorCategory;

  constructor(params: {
    message: string;
    statusCode: number;
    code: string;
    suggestedAction?: string;
    details?: unknown;
    category?: ErrorCategory;
  }) {
    super(params.message);
    this.name = this.constructor.name;
    this.statusCode = params.statusCode;
    this.code = params.code;
    this.suggestedAction =
      params.suggestedAction || 'Silakan periksa kembali konfigurasi atau parameter request Anda.';
    this.details = params.details;
    this.category = params.category || 'system';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, code: string = ErrorCodes.AUTH_HEADER_MISSING, suggestedAction?: string, details?: unknown) {
    super({
      message,
      statusCode: 401,
      code,
      suggestedAction:
        suggestedAction ||
        "Tambahkan header 'Authorization: Bearer <JWT_TOKEN>' ke request Anda. Anda dapat menghasilkan token melalui antarmuka Developer Auth di dasbor.",
      details,
      category: 'auth',
    });
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, code: string = ErrorCodes.AUTH_FORBIDDEN_PERMISSION, suggestedAction?: string, details?: unknown) {
    super({
      message,
      statusCode: 403,
      code,
      suggestedAction:
        suggestedAction || 'Buat token baru dengan menyertakan izin yang sesuai (contoh: otp:send).',
      details,
      category: 'auth',
    });
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code: string = ErrorCodes.VALIDATION_FAILED, suggestedAction?: string, details?: unknown) {
    super({
      message,
      statusCode: 400,
      code,
      suggestedAction:
        suggestedAction || 'Pastikan data JSON request sesuai dengan skema yang terdokumentasi di Swagger API.',
      details,
      category: 'validation',
    });
  }
}

export class RateLimitError extends AppError {
  constructor(message: string, code: string = ErrorCodes.RATE_LIMIT_COOLDOWN, suggestedAction?: string, details?: unknown) {
    super({
      message,
      statusCode: 429,
      code,
      suggestedAction:
        suggestedAction || 'Harap tunggu beberapa saat sebelum mengirim permintaan OTP berikutnya ke nomor ini.',
      details,
      category: 'ratelimit',
    });
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string, code: string = ErrorCodes.WA_NOT_CONNECTED, suggestedAction?: string, details?: unknown) {
    super({
      message,
      statusCode: 503,
      code,
      suggestedAction:
        suggestedAction ||
        'Buka dasbor dan scan QR Code WhatsApp menggunakan menu "Perangkat Tertaut" pada aplikasi WhatsApp ponsel Anda.',
      details,
      category: 'socket',
    });
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource tidak ditemukan') {
    super({
      message,
      statusCode: 404,
      code: ErrorCodes.NOT_FOUND,
      suggestedAction: 'Periksa URL endpoint yang dituju pada dokumentasi Swagger.',
      category: 'system',
    });
  }
}
