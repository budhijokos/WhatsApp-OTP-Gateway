import { MiddlewareHandler } from 'hono';
import { authService } from '../application/auth.service.js';
import { ErrorCodes } from '../../../core/errors/error-codes.js';
import { ForbiddenError, UnauthorizedError } from '../../../core/errors/app-error.js';
import { DeveloperClaims } from '../domain/auth.types.js';

export function createAuthGuard(requiredPermission?: string): MiddlewareHandler<{
  Variables: { developer: DeveloperClaims };
}> {
  return async (c, next) => {
    const authHeader = c.req.header('Authorization') || c.req.header('authorization');

    if (!authHeader) {
      throw new UnauthorizedError(
        'Header Authorization tidak ditemukan',
        ErrorCodes.AUTH_HEADER_MISSING,
        "Tambahkan header 'Authorization: Bearer <JWT_TOKEN>' ke request Anda. Anda dapat menghasilkan token melalui antarmuka Developer Auth di dasbor atau POST /api/v1/auth/token."
      );
    }

    const parts = authHeader.trim().split(/\s+/);
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      throw new UnauthorizedError(
        "Format header otentikasi tidak valid. Harapkan 'Bearer <TOKEN>'",
        ErrorCodes.AUTH_FORMAT_INVALID,
        "Pastikan format header adalah 'Authorization: Bearer <TOKEN>' (dengan spasi antara Bearer dan token)."
      );
    }

    const token = parts[1];
    const decoded = authService.verifyToken(token);

    if (requiredPermission && (!decoded.permissions || !decoded.permissions.includes(requiredPermission))) {
      throw new ForbiddenError(
        `Akses ditolak: Token tidak memiliki izin '${requiredPermission}'`,
        ErrorCodes.AUTH_FORBIDDEN_PERMISSION,
        `Buat ulang token JWT dengan menambahkan izin '${requiredPermission}' pada array permissions.`
      );
    }

    c.set('developer', decoded);
    await next();
  };
}
