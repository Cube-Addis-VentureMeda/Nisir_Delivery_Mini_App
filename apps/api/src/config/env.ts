// src/config/env.ts
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();


const envSchema = z.object({
  PORT: z.coerce.number().default(4000),        // coerce: string "4000" → number 4000
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters — it protects all logins'),
  JWT_EXPIRES_IN: z.string().default('1h'),

  TELEGRAM_BOT_TOKEN: z.string().min(10),
    // Read comma-separated origins and convert them into an array.
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
)
});

// .parse() throws a detailed error if validation fails → app won't start with bad config
export const env = envSchema.parse(process.env);