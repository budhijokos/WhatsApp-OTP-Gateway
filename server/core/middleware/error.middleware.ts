import { ErrorHandler } from 'hono';
import { AppError } from '../errors/app-error.js';
import { ErrorCodes } from '../errors/error-codes.js';
import { eventBus } from '../events/event-bus.js';

export const globalErrorHandler: ErrorHandler = (err, c) => {
  if (err instanceof AppError) {
    eventBus.emit('error:logged', {
      category: err.category,
      code: err.code,
      title: err.message,
      details: err.details,
      suggestedAction: err.suggestedAction,
    });

    return c.json(
      {
        success: false,
        error: err.message,
        code: err.code,
        suggestedAction: err.suggestedAction,
        details: err.details,
        documentation: '/api/docs',
      },
      err.statusCode as any
    );
  }

  // Unhandled / Internal Server Error
  const message = err.message || 'Terjadi kesalahan internal pada server';
  eventBus.emit('error:logged', {
    category: 'system',
    code: ErrorCodes.SERVER_INTERNAL_ERROR,
    title: `Unhandled Exception: ${message}`,
    details: { stack: err.stack, path: c.req.path, method: c.req.method },
    suggestedAction: 'Periksa konsol server untuk rincian stack trace dan lakukan reload jika diperlukan.',
  });

  return c.json(
    {
      success: false,
      error: 'Terjadi kesalahan internal pada server',
      code: ErrorCodes.SERVER_INTERNAL_ERROR,
      message,
    },
    500
  );
};
