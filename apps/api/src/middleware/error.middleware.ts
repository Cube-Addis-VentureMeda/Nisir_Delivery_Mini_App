// src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { UniqueConstraintError, ValidationError } from 'sequelize';
import { ApiError } from '../utils/ApiError';

// Global error handler — registered LAST in app.ts.
// Any error thrown anywhere lands here and gets a consistent JSON envelope.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details ?? null },
    });
  }

  if (err instanceof UniqueConstraintError) {
    return res.status(409).json({
      error: { code: 'CONFLICT', message: 'This record already exists', details: null },
    });
  }

  if (err instanceof ValidationError) {
    return res.status(422).json({
      error: { code: 'UNPROCESSABLE_ENTITY', message: err.message, details: null },
    });
  }

  // Unknown crash — log it fully (so we can debug), send a generic message to the client
  console.error('[UNEXPECTED ERROR]', err);
  return res.status(500).json({
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong on our side' },
  });
}