// src/utils/validate.ts
import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { ApiError } from './ApiError';


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