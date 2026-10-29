// src/utils/jwt.ts
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthPayload } from '../middleware/auth.middleware';

/**
 * Signs authentication tokens for Customers, Drivers, and Staff.
 *
 * Security & Revocation Policy:
 * 1. Tokens are short-lived (default 1h, validated at startup in env.ts).
 * 2. On sensitive / financial actions (e.g. driver order claiming, cash handover, staff payouts),
 *    services re-query the account in the database to verify the account is currently 'active'.
 *    A suspended customer, driver, or staff member cannot execute state-changing actions even if
 *    their unexpired token is presented.
 * 3. The signing secret is guarded in env.JWT_SECRET and must never be exposed or logged.
 */
export function signToken(payload: AuthPayload): string {
  const options: SignOptions = {
    // env.JWT_EXPIRES_IN is validated at boot via envSchema regex
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}