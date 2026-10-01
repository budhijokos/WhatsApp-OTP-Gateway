import jwt from 'jsonwebtoken';
import { AppConfig } from '../../../core/config/app.config.js';
import { ErrorCodes } from '../../../core/errors/error-codes.js';
import { UnauthorizedError } from '../../../core/errors/app-error.js';
import { eventBus } from '../../../core/events/event-bus.js';
import { DeveloperClaims, GenerateTokenDto, TokenResult } from '../domain/auth.types.js';

export class AuthService {
  private readonly secret = AppConfig.auth.jwtSecret;

  public generateToken(dto: GenerateTokenDto, baseUrl: string = ''): TokenResult {
    const sub = dto.sub || 'dev_' + Math.random().toString(36).substring(2, 8);
    const name = dto.name || 'Developer Client Application';
    const permissions = dto.permissions && dto.permissions.length > 0
      ? dto.permissions
      : ['otp:send', 'otp:read', 'status:read'];
    const expiresIn = dto.expiresIn || AppConfig.auth.defaultExpiresIn;

    const payload: DeveloperClaims = {
      sub,
      name,
      permissions,
    };

    const token = jwt.sign(payload, this.secret, { expiresIn: expiresIn as any });

    eventBus.emit('console:log', {
      level: 'info',
      source: 'auth',
      message: `Generated developer JWT token for '${name}' (${sub}) with permissions [${permissions.join(', ')}]`,
    });

    const sampleCurl = `curl -X POST "${baseUrl}/api/v1/otp/send" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{"to": "081234567890", "otp": "981240", "appName": "${name}"}'`;

    return {
      token,
      tokenType: 'Bearer',
      expiresIn,
      payload,
      sampleCurl,
    };
  }

  public verifyToken(token: string): DeveloperClaims {
    try {
      return jwt.verify(token, this.secret) as DeveloperClaims;
    } catch (err: any) {
      const isExpired = err?.name === 'TokenExpiredError';
      const code = isExpired ? ErrorCodes.AUTH_TOKEN_EXPIRED : ErrorCodes.AUTH_TOKEN_INVALID;
      const message = isExpired ? 'Token JWT telah kedaluwarsa' : 'Token JWT tidak valid atau rusak';
      const suggestedAction = isExpired
        ? 'Generate token baru di dasbor dengan masa berlaku lebih panjang.'
        : 'Pastikan token dibuat menggunakan secret yang sama dengan server saat ini.';

      throw new UnauthorizedError(message, code, suggestedAction, {
        rawMessage: err?.message,
      });
    }
  }

  public getSecretPreview(): string {
    if (this.secret.length <= 8) return '****';
    return this.secret.substring(0, 4) + '...' + this.secret.substring(this.secret.length - 4);
  }
}

export const authService = new AuthService();
