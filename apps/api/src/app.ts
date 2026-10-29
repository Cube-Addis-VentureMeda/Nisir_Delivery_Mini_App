import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env';
import { authRouter } from './modules/auth/auth.routes';
import { ordersRouter } from './modules/orders/orders.routes';
import { driverRouter } from './modules/drivers/driver.routes';
import { cashRouter } from './modules/cash-management/cash.routes';
import { payoutsRouter } from './modules/merchant-payouts/payouts.routes';
import { driverPaymentsRouter } from './modules/driver-payments/driver-payments.routes';
import { merchantsRouter } from './modules/merchants/merchants.routes';
import { paymentsRouter } from './modules/payments/payments.routes';
import { errorHandler } from './middleware/error.middleware';

export function createApp() {
  const app = express();

  // CORS configuration using env.CORS_ORIGINS
  const allowedOrigins = env.CORS_ORIGINS;
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Telegram webviews)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        // In development, permit localhost ports
        if (env.NODE_ENV === 'development' && /^http:\/\/localhost(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS origin not allowed: ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }),
  );
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));    // parse JSON bodies
  app.use(morgan('dev'));                     // log every request

  // Health check — the frontend uses this to confirm the API is alive
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // API routes
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1', ordersRouter);
  app.use('/api/v1', merchantsRouter);
  app.use('/api/v1/driver', driverRouter);
  app.use('/api/v1', cashRouter);
  app.use('/api/v1', payoutsRouter);
  app.use('/api/v1', driverPaymentsRouter);
  app.use('/api/v1', paymentsRouter);
  

  // 404 for unknown routes
  app.use((_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }));

  // Error handler MUST be registered last
  app.use(errorHandler);

  return app;
}