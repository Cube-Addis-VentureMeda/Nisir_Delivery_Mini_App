// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { StaffUser } from '../database/models/StaffUser';

export type StaffRole = 'admin' | 'finance';
export type AuthKind = 'customer' | 'staff' | 'driver';

export interface AuthPayload {
  sub: string;            // subject = customer, driver, or staff id (BIGINT as string)
  kind: AuthKind;
  role?: StaffRole;       // only for staff: admin | finance
}

// Zod schema to validate decoded token payload shape at runtime
const authPayloadSchema = z
  .object({
    sub: z.string().min(1, 'Token sub is required'),
    kind: z.enum(['customer', 'staff', 'driver']),
    role: z.enum(['admin', 'finance']).optional(),
  })
  .refine(
    (payload) => {
      if (payload.kind === 'staff') {
        return payload.role === 'admin' || payload.role === 'finance';
      }
      return true;
    },
    { message: 'Staff token must contain a valid staff role (admin or finance)' },
  );

// Extend Express's Request so TypeScript knows req.auth exists everywhere
declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

// Step 1: verify and validate token shape at runtime
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new ApiError(401, 'UNAUTHENTICATED', 'Missing or malformed Authorization header'));
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const parsed = authPayloadSchema.safeParse(decoded);
    if (!parsed.success) {
      return next(new ApiError(401, 'UNAUTHENTICATED', 'Invalid token payload shape'));
    }

    // Staff role and status are re-read so a suspended account or a role change
    // takes effect immediately instead of waiting for the JWT to expire.
    if (parsed.data.kind === 'staff') {
      const staff = await StaffUser.findByPk(parsed.data.sub, {
        attributes: ['id', 'role', 'status'],
      });
      if (!staff || staff.status !== 'active') {
        return next(new ApiError(401, 'UNAUTHENTICATED', 'Session is no longer valid'));
      }
      req.auth = { sub: String(staff.id), kind: 'staff', role: staff.role };
      return next();
    }

    req.auth = parsed.data;
    next();
  } catch {
    next(new ApiError(401, 'UNAUTHENTICATED', 'Invalid or expired token'));
  }
}

// Step 2: prove staff permissions — strongly typed to defined StaffRole ('admin' | 'finance')
export function requireRole(...roles: StaffRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      return next(new ApiError(401, 'UNAUTHENTICATED', 'Authentication required'));
    }
    if (req.auth.kind !== 'staff' || !req.auth.role || !roles.includes(req.auth.role)) {
      return next(new ApiError(403, 'FORBIDDEN', 'You do not have permission to access this resource'));
    }
    next();
  };
}

// Step 3: verify driver identity
export function requireDriver(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth) {
    return next(new ApiError(401, 'UNAUTHENTICATED', 'Authentication required'));
  }
  if (req.auth.kind !== 'driver') {
    return next(new ApiError(403, 'FORBIDDEN', 'Driver access required'));
  }
  next();
}

// Step 4: verify customer identity
export function requireCustomer(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth) {
    return next(new ApiError(401, 'UNAUTHENTICATED', 'Authentication required'));
  }
  if (req.auth.kind !== 'customer') {
    return next(new ApiError(403, 'FORBIDDEN', 'Customer access required'));
  }
  next();
}