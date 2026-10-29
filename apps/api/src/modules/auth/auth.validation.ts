// src/modules/auth/auth.validation.ts
import { z } from 'zod';

export const telegramLoginSchema = z.object({
  // Enforce realistic bounds on Telegram initData string (typically ~300-800 chars)
  initData: z.string().min(1, 'initData is required').max(4096, 'initData exceeds maximum length limit'),
  // Explicitly constrain to valid client roles; no silent fall-through
  role: z.enum(['customer', 'driver']).default('customer'),
});

export const staffLoginSchema = z.object({
  // Normalize email casing and whitespace at the validation boundary
  email: z.string().trim().toLowerCase().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

export type TelegramLoginInput = z.infer<typeof telegramLoginSchema>;
export type StaffLoginInput = z.infer<typeof staffLoginSchema>;