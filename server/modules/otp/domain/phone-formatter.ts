import { AppConfig } from '../../../core/config/app.config.js';
import { ValidationError } from '../../../core/errors/app-error.js';
import { ErrorCodes } from '../../../core/errors/error-codes.js';

export class PhoneFormatter {
  public static normalize(rawPhone: string): string {
    if (!rawPhone) return '';
    let cleaned = rawPhone.replace(/[^0-9]/g, '');

    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    } else if (cleaned.startsWith('8')) {
      cleaned = '62' + cleaned;
    }

    return cleaned;
  }

  public static validate(phone: string): string {
    const normalized = this.normalize(phone);
    if (!normalized || normalized.length < AppConfig.otp.minPhoneDigits) {
      throw new ValidationError(
        `Format nomor tujuan tidak valid: '${phone}'. Minimal 10 digit angka.`,
        ErrorCodes.PHONE_INVALID_FORMAT,
        "Gunakan format nomor telepon yang valid seperti '081234567890' atau '6281234567890'."
      );
    }
    return normalized;
  }

  public static mask(normalizedPhone: string): string {
    if (normalizedPhone.length <= 6) return normalizedPhone;
    return (
      normalizedPhone.substring(0, 4) +
      '****' +
      normalizedPhone.substring(normalizedPhone.length - 3)
    );
  }

  public static toJid(normalizedPhone: string): string {
    return `${normalizedPhone}@s.whatsapp.net`;
  }
}
