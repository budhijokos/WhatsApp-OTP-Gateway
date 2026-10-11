import jwt from 'jsonwebtoken';
import { AppConfig } from '../../../core/config/app.config.js';
import { ErrorCodes } from '../../../core/errors/error-codes.js';
import { NotFoundError, UnauthorizedError, ValidationError } from '../../../core/errors/app-error.js';
import { eventBus } from '../../../core/events/event-bus.js';
import {
  ApiKey,
  ApiKeyStats,
  CreateApiKeyDto,
  DeveloperClaims,
  GenerateTokenDto,
  KeyEnvironment,
  RotateApiKeyDto,
  TokenResult,
} from '../domain/auth.types.js';
import { apiKeyRepository, ApiKeyRepository } from '../infrastructure/api-key.repository.js';

export class AuthService {
  private readonly secret = AppConfig.auth.jwtSecret;
  private readonly repo: ApiKeyRepository = apiKeyRepository;

  constructor() {
    this.seedDefaultKeysIfEmpty();
  }

  private seedDefaultKeysIfEmpty(): void {
    try {
      this.repo.ensureLoaded();
      if (this.repo.count() === 0) {
        const defaultClients = [
          {
            clientId: 'mobile_finpay_app',
            clientName: 'FinPay Mobile App (iOS & Android)',
            environment: 'production' as KeyEnvironment,
            permissions: ['otp:send', 'otp:read', 'status:read'],
            expiresIn: '365d',
            usageCount: 42,
          },
          {
            clientId: 'ecommerce_web_checkout',
            clientName: 'Web E-Commerce Checkout',
            environment: 'production' as KeyEnvironment,
            permissions: ['otp:send', 'otp:read'],
            expiresIn: '90d',
            usageCount: 18,
          },
          {
            clientId: 'admin_crm_portal',
            clientName: 'Internal Admin CRM & Support',
            environment: 'staging' as KeyEnvironment,
            permissions: ['otp:send', 'otp:read', 'status:read'],
            expiresIn: '30d',
            usageCount: 5,
          },
        ];

        for (const client of defaultClients) {
          const id = 'key_' + Math.random().toString(36).substring(2, 9);
          const payload: DeveloperClaims = {
            sub: client.clientId,
            name: client.clientName,
            permissions: client.permissions,
            kid: id,
            env: client.environment,
          };
          const token = jwt.sign(payload, this.secret, { expiresIn: client.expiresIn as any });
          const tokenPreview = this.createMaskedPreview(token);

          const now = new Date();
          const expiresAt = this.calculateExpiresAt(client.expiresIn, now);

          const apiKey: ApiKey = {
            id,
            clientId: client.clientId,
            clientName: client.clientName,
            environment: client.environment,
            permissions: client.permissions,
            expiresIn: client.expiresIn,
            expiresAt,
            status: 'active',
            token,
            tokenPreview,
            createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
            lastUsedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
            usageCount: client.usageCount,
            rotationInfo: null,
          };
          this.repo.save(apiKey);
        }
      }
    } catch (err) {
      console.warn('Error during default key seeding', err);
    }
  }

  public createMaskedPreview(token: string): string {
    if (!token || token.length < 20) return 'eyJ...';
    return token.substring(0, 10) + '...' + token.substring(token.length - 8);
  }

  private calculateExpiresAt(expiresIn: string, baseDate = new Date()): string | null {
    if (!expiresIn || expiresIn === 'never') return null;
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return null;
    const val = parseInt(match[1], 10);
    const unit = match[2];
    let ms = 0;
    if (unit === 's') ms = val * 1000;
    else if (unit === 'm') ms = val * 60 * 1000;
    else if (unit === 'h') ms = val * 3600 * 1000;
    else if (unit === 'd') ms = val * 24 * 3600 * 1000;
    return new Date(baseDate.getTime() + ms).toISOString();
  }

  public listKeys(): { keys: ApiKey[]; stats: ApiKeyStats; secretPreview: string } {
    const keys = this.repo.findAll();
    const stats = this.repo.getStats();
    return {
      keys,
      stats,
      secretPreview: this.getSecretPreview(),
    };
  }

  public getKeyById(id: string): ApiKey | undefined {
    return this.repo.findById(id);
  }

  public createKey(dto: CreateApiKeyDto, baseUrl: string = ''): { key: ApiKey; sampleCurl: string } {
    if (!dto.clientName || !dto.clientName.trim()) {
      throw new ValidationError("Parameter 'clientName' (Nama Aplikasi) wajib diisi.");
    }

    const clientId = dto.clientId?.trim() || 'app_' + Math.random().toString(36).substring(2, 9);
    const clientName = dto.clientName.trim();
    const environment = dto.environment || 'production';
    const permissions = dto.permissions && dto.permissions.length > 0
      ? dto.permissions
      : ['otp:send', 'otp:read', 'status:read'];
    const expiresIn = dto.expiresIn || AppConfig.auth.defaultExpiresIn;

    const id = 'key_' + Math.random().toString(36).substring(2, 9);
    const now = new Date();
    const expiresAt = this.calculateExpiresAt(expiresIn, now);

    const payload: DeveloperClaims = {
      sub: clientId,
      name: clientName,
      permissions,
      kid: id,
      env: environment,
    };

    const token = jwt.sign(payload, this.secret, { expiresIn: expiresIn as any });
    const tokenPreview = this.createMaskedPreview(token);

    const apiKey: ApiKey = {
      id,
      clientId,
      clientName,
      environment,
      permissions,
      expiresIn,
      expiresAt,
      status: 'active',
      token,
      tokenPreview,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      lastUsedAt: null,
      usageCount: 0,
      rotationInfo: null,
    };

    this.repo.save(apiKey);

    eventBus.emit('console:log', {
      level: 'info',
      source: 'auth',
      message: `Created new developer API key for '${clientName}' (${clientId}) [env: ${environment}]`,
    });

    const sampleCurl = this.generateSampleCurl(token, clientName, baseUrl);

    return {
      key: apiKey,
      sampleCurl,
    };
  }

  public rotateKey(
    id: string,
    dto: RotateApiKeyDto = {},
    baseUrl: string = ''
  ): { key: ApiKey; newToken: string; previousTokenValidUntil?: string; sampleCurl: string } {
    const existing = this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError(`Kunci API dengan ID '${id}' tidak ditemukan.`);
    }

    if (existing.status === 'revoked') {
      throw new ValidationError(
        'Tidak dapat merotasi kunci yang telah dicabut (revoked). Buat kunci baru sebagai gantinya.',
        ErrorCodes.AUTH_KEY_REVOKED
      );
    }

    const gracePeriodHours = typeof dto.gracePeriodHours === 'number' ? dto.gracePeriodHours : 24;
    const expiresIn = dto.newExpiresIn || existing.expiresIn;
    const permissions = dto.newPermissions || existing.permissions;
    const now = new Date();

    const newKid = 'key_' + Math.random().toString(36).substring(2, 9);
    const newExpiresAt = this.calculateExpiresAt(expiresIn, now);

    const payload: DeveloperClaims = {
      sub: existing.clientId,
      name: existing.clientName,
      permissions,
      kid: newKid,
      env: existing.environment,
    };

    const newToken = jwt.sign(payload, this.secret, { expiresIn: expiresIn as any });
    const tokenPreview = this.createMaskedPreview(newToken);

    let previousTokenExpiresAt: string | undefined;
    if (gracePeriodHours > 0) {
      previousTokenExpiresAt = new Date(now.getTime() + gracePeriodHours * 3600 * 1000).toISOString();
      existing.rotationInfo = {
        previousToken: existing.token,
        previousTokenExpiresAt,
        rotatedAt: now.toISOString(),
        gracePeriodHours,
      };
      existing.status = 'rotating';
    } else {
      // Immediate rotation, no grace period
      existing.rotationInfo = null;
      existing.status = 'active';
    }

    existing.token = newToken;
    existing.tokenPreview = tokenPreview;
    existing.permissions = permissions;
    existing.expiresIn = expiresIn;
    existing.expiresAt = newExpiresAt;
    existing.updatedAt = now.toISOString();

    this.repo.save(existing);

    eventBus.emit('console:log', {
      level: 'info',
      source: 'auth',
      message: `Rotated API key for '${existing.clientName}' (${existing.clientId}) with ${gracePeriodHours}h grace period.`,
    });

    const sampleCurl = this.generateSampleCurl(newToken, existing.clientName, baseUrl);

    return {
      key: existing,
      newToken,
      previousTokenValidUntil: previousTokenExpiresAt,
      sampleCurl,
    };
  }

  public revokeKey(id: string, reason?: string): ApiKey {
    const existing = this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError(`Kunci API dengan ID '${id}' tidak ditemukan.`);
    }

    existing.status = 'revoked';
    existing.revokedAt = new Date().toISOString();
    existing.revocationReason = reason?.trim() || 'Dicabut manual dari dasbor administrator';
    existing.rotationInfo = null;
    existing.updatedAt = new Date().toISOString();

    this.repo.save(existing);

    eventBus.emit('console:log', {
      level: 'warn',
      source: 'auth',
      message: `Revoked API key '${existing.clientName}' (${id}). Reason: ${existing.revocationReason}`,
    });

    return existing;
  }

  public deleteKey(id: string): boolean {
    const existing = this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError(`Kunci API dengan ID '${id}' tidak ditemukan.`);
    }
    const success = this.repo.delete(id);
    eventBus.emit('console:log', {
      level: 'info',
      source: 'auth',
      message: `Deleted API key '${existing.clientName}' (${id}) from registry.`,
    });
    return success;
  }

  public validateToken(token: string): { claims: DeveloperClaims; key?: ApiKey; isGracePeriodKey?: boolean } {
    let claims: DeveloperClaims;
    try {
      claims = jwt.verify(token, this.secret) as DeveloperClaims;
    } catch (err: any) {
      const isExpired = err?.name === 'TokenExpiredError';
      const code = isExpired ? ErrorCodes.AUTH_TOKEN_EXPIRED : ErrorCodes.AUTH_TOKEN_INVALID;
      const message = isExpired ? 'Token JWT telah kedaluwarsa' : 'Token JWT tidak valid atau tanda tangan rusak';
      const suggestedAction = isExpired
        ? 'Generate atau rotate token baru di dasbor dengan masa berlaku lebih panjang.'
        : 'Pastikan token dibuat menggunakan secret yang sama dengan server saat ini.';

      throw new UnauthorizedError(message, code, suggestedAction, {
        rawMessage: err?.message,
      });
    }

    // Check with key registry
    const match = this.repo.findByToken(token);
    if (match) {
      const { key, isPreviousToken } = match;

      if (key.status === 'revoked') {
        throw new UnauthorizedError(
          `Kunci API untuk aplikasi '${key.clientName}' telah dicabut (revoked).`,
          ErrorCodes.AUTH_KEY_REVOKED,
          'Kunci ini dinonaktifkan oleh administrator. Buat atau rotasi kunci baru di dasbor untuk melanjutkan.',
          { revokedAt: key.revokedAt, reason: key.revocationReason }
        );
      }

      if (isPreviousToken) {
        if (key.rotationInfo?.previousTokenExpiresAt) {
          const expiryTime = new Date(key.rotationInfo.previousTokenExpiresAt).getTime();
          if (Date.now() > expiryTime) {
            throw new UnauthorizedError(
              `Kunci API lama untuk '${key.clientName}' telah kedaluwarsa setelah masa tenggang rotasi berakhir.`,
              ErrorCodes.AUTH_TOKEN_EXPIRED,
              'Aplikasi klien masih memanggil API menggunakan kunci lama. Perbarui variabel lingkungan klien dengan kunci aktif terbaru.',
              { rotatedAt: key.rotationInfo.rotatedAt, expiredAt: key.rotationInfo.previousTokenExpiresAt }
            );
          }
        }
      }

      // Record telemetry usage
      this.repo.recordUsage(key.id);

      return {
        claims,
        key,
        isGracePeriodKey: isPreviousToken,
      };
    }

    // Fallback for ad-hoc tokens created prior to registry or via direct test
    return { claims };
  }

  public verifyToken(token: string): DeveloperClaims {
    const res = this.validateToken(token);
    return res.claims;
  }

  public generateToken(dto: GenerateTokenDto, baseUrl: string = ''): TokenResult {
    const created = this.createKey(
      {
        clientId: dto.sub,
        clientName: dto.name || 'Developer Client Application',
        permissions: dto.permissions,
        expiresIn: dto.expiresIn,
      },
      baseUrl
    );

    return {
      token: created.key.token,
      tokenType: 'Bearer',
      expiresIn: created.key.expiresIn,
      payload: {
        sub: created.key.clientId,
        name: created.key.clientName,
        permissions: created.key.permissions,
      },
      sampleCurl: created.sampleCurl,
    };
  }

  public generateSampleCurl(token: string, appName: string, baseUrl: string): string {
    const base = baseUrl || 'https://otp.bacakata.com';
    return `curl -X POST "${base}/api/v1/otp/send" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{"to": "081234567890", "appName": "${appName}"}'`;
  }

  public getSecretPreview(): string {
    if (this.secret.length <= 8) return '****';
    return this.secret.substring(0, 4) + '...' + this.secret.substring(this.secret.length - 4);
  }
}

export const authService = new AuthService();
