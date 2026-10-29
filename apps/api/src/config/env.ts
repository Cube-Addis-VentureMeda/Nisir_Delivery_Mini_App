// src/config/env.ts
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  DB_HOST: z.string().trim().min(1, 'DB_HOST cannot be empty'),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
  DB_USER: z.string().trim().min(1, 'DB_USER cannot be empty'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().trim().min(1, 'DB_NAME cannot be empty'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters — it protects all logins'),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^(\d+[smhdwy]|\d+)$/, 'JWT_EXPIRES_IN must be a valid time format like "1h", "7d", "30m", or seconds')
    .default('1h'),

  TELEGRAM_BOT_TOKEN: z.string().min(10, 'TELEGRAM_BOT_TOKEN must be at least 10 characters'),

  // Read comma-separated origins and convert them into an array of strings.
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173,http://localhost:3000')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
});

// .parse() throws a detailed error if validation fails → app won't start with bad config
export const env = envSchema.parse(process.env);