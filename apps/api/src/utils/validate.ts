// src/utils/validate.ts
import { z, ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { ApiError } from './ApiError';

export const numericIdString = z
  .string()
  .regex(/^\d+$/, 'ID must be numeric')
  .max(20, 'ID exceeds maximum length');

export const numericIdParamSchema = z.object({
  id: numericIdString,
});

export const merchantIdParamSchema = z.object({
  merchantId: numericIdString,
});

export const paginationQuerySchema = z.object({
  limit: z
    .string()
    .regex(/^\d+$/, 'limit must be numeric')
    .transform(Number)
    .pipe(z.number().int().min(1).max(100))
    .optional(),
  offset: z
    .string()
    .regex(/^\d+$/, 'offset must be numeric')
    .transform(Number)
    .pipe(z.number().int().min(0))
    .optional(),
});

/** Bank / mobile-money references entered by staff after a real transfer. */
export const paymentReferenceSchema = z
  .string()
  .trim()
  .min(3, 'Payment reference is required')
  .max(100, 'Payment reference is too long');

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(ApiError.unprocessable('Validation failed', result.error.flatten()));
    }
    req.body = result.data;
    next();
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return next(ApiError.badRequest('Invalid route parameters', result.error.flatten()));
    }
    req.params = result.data as any;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(ApiError.badRequest('Invalid query parameters', result.error.flatten()));
    }
    req.query = result.data as any;
    next();
  };
}