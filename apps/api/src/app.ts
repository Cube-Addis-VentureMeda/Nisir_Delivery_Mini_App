import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './middleware/error.middleware';

export function createApp() {
  const app = express();

  // 1. Security headers
  app.use(helmet());

  // 2. CORS — reflect back only whitelisted origins.
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow non-browser tools (curl, Postman) that send no Origin header.
        if (!origin) return callback(null, true);
        if (env.CORS_ORIGINS.includes(origin)) return callback(null, true);
        return callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
      credentials: true,
    }),
  );

  // 3. Parse JSON bodies (max 1mb — a sane default that blocks giant payloads)
  app.use(express.json({ limit: '1mb' }));


  // 4. Errors from anywhere above land here
  app.use(errorHandler);

  return app;
}