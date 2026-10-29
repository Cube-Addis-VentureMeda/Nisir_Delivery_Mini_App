// src/modules/auth/telegram.service.ts
import crypto from 'crypto';
import { z } from 'zod';
import { ApiError } from '../../utils/ApiError';
import { env } from '../../config/env';

const telegramUserSchema = z.object({
  id: z.number().int().positive('Telegram user ID must be a positive integer'),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
});

const telegramChatSchema = z.object({
  id: z.number().int(),
});

/**
 * Telegram Mini Apps send an `initData` query string containing:
 *   query_id=...&user={"id":123,...}&auth_date=1699000000&hash=xyz...
 *
 * Verification:
 * 1. Remove the `hash` field. Sort remaining key=value pairs alphabetically.
 * 2. Join with '\n' → data_check_string.
 * 3. secret = HMAC_SHA256(key="WebAppData", msg=botToken).
 * 4. hash    = HMAC_SHA256(key=secret, msg=data_check_string) in hex.
 * 5. Compare with the received hash using timingSafeEqual.
 * 6. Check auth_date is fresh (<= 24h) and not in the future (<= 300s clock skew tolerance).
 * 7. Safely parse and validate the embedded user object with Zod runtime schema.
 */
export function verifyTelegramInitData(initData: string): { telegramUserId: string; firstName: string } {
  const params = new URLSearchParams(initData);
  const receivedHash = params.get('hash');
  if (!receivedHash) throw new ApiError(401, 'AUTH_FAILED', 'Missing Telegram hash');

  // Build the check string: all fields EXCEPT hash, sorted, joined by newline
  params.delete('hash');
  const checkString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  // Step 3: secret key derivation
  const secret = crypto.createHmac('sha256', 'WebAppData').update(env.TELEGRAM_BOT_TOKEN).digest();

  // Step 4: compute expected hash
  const expectedHash = crypto.createHmac('sha256', secret).update(checkString).digest('hex');

  // Step 5: timing-safe compare
  const a = Buffer.from(expectedHash, 'hex');
  const b = Buffer.from(receivedHash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new ApiError(401, 'AUTH_FAILED', 'Telegram signature verification failed');
  }

  // Step 6: freshness validation — reject data older than 24h OR in the future beyond 300s clock skew
  const authDate = Number(params.get('auth_date'));
  const nowSec = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(authDate) || authDate <= 0) {
    throw new ApiError(401, 'AUTH_EXPIRED', 'Invalid Telegram auth timestamp');
  }
  if (nowSec - authDate > 86400) {
    throw new ApiError(401, 'AUTH_EXPIRED', 'Telegram auth data is too old. Please reopen the app.');
  }
  if (authDate - nowSec > 300) {
    throw new ApiError(401, 'AUTH_EXPIRED', 'Telegram auth timestamp is unreasonably far in the future.');
  }

  // Step 7: Parse and runtime-validate embedded user object
  const userJson = params.get('user');
  if (!userJson) throw new ApiError(401, 'AUTH_FAILED', 'No user data in Telegram initData');

  let rawUser: unknown;
  try {
    rawUser = JSON.parse(userJson);
  } catch {
    throw new ApiError(401, 'AUTH_FAILED', 'Malformed JSON in Telegram user payload');
  }

  const parseResult = telegramUserSchema.safeParse(rawUser);
  if (!parseResult.success) {
    throw new ApiError(401, 'AUTH_FAILED', 'Telegram user payload does not contain a valid user ID');
  }

  const user = parseResult.data;
  return {
    telegramUserId: String(user.id),
    firstName: user.first_name?.trim() || 'User',
  };
}

/**
 * Extracts the chat ID from verified Telegram initData if available.
 * Note: Caller must ensure initData has been verified with verifyTelegramInitData first.
 */
export function extractChatId(initData: string): string | null {
  const params = new URLSearchParams(initData);
  const chatJson = params.get('chat');
  if (!chatJson) return null;

  try {
    const rawChat = JSON.parse(chatJson);
    const parsed = telegramChatSchema.safeParse(rawChat);
    if (!parsed.success) return null;
    return String(parsed.data.id);
  } catch {
    return null;
  }
}