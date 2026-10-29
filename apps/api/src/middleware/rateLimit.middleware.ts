// src/middleware/rateLimit.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

interface ClientRecord {
  count: number;
  resetAt: number;
}

/**
 * In-memory sliding rate limiter middleware for sensitive endpoints.
 * Protects against brute-force attacks on login and credential stuffing.
 */
export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later.',
    keyGenerator = (req: Request) => req.ip || req.socket.remoteAddress || 'unknown-client',
  } = options;

  const hits = new Map<string, ClientRecord>();

  // Periodically clean up expired entries every 5 minutes to prevent memory leaks
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now > record.resetAt) {
        hits.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  // Unref interval so it does not block Node process exit in tests
  if (cleanupInterval.unref) cleanupInterval.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    let record = hits.get(key);
    if (!record || now > record.resetAt) {
      record = {
        count: 1,
        resetAt: now + windowMs,
      };
      hits.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetAt - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (record.count > max) {
      return next(new ApiError(429, 'TOO_MANY_REQUESTS', message));
    }

    next();
  };
}

// Preset limiters for auth routes
export const staffLoginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 attempts per 15 min per IP/email
  message: 'Too many staff login attempts. Please wait 15 minutes before trying again.',
  keyGenerator: (req) => `${req.ip || 'ip'}_${req.body?.email || ''}`,
});

export const telegramLoginLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30,             // 30 launches/logins per minute per IP
  message: 'Too many Telegram auth requests. Please slow down.',
});
