// src/modules/auth/auth.routes.ts
import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validateBody } from '../../utils/validate';
import { telegramLoginSchema, staffLoginSchema } from './auth.validation';
import * as authController from './auth.controller';
import { telegramLoginLimiter, staffLoginLimiter } from '../../middleware/rateLimit.middleware';

export const authRouter = Router();

// Telegram Mini App authentication for customers and drivers
authRouter.post(
  '/telegram',
  telegramLoginLimiter,
  validateBody(telegramLoginSchema),
  asyncHandler(authController.telegramLogin),
);

// Password login for staff (admin, finance) with rate limit abuse protection
authRouter.post(
  '/staff/login',
  staffLoginLimiter,
  validateBody(staffLoginSchema),
  asyncHandler(authController.staffLogin),
);