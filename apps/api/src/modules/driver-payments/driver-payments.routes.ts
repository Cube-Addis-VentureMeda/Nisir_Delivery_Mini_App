// src/modules/driver-payments/driver-payments.routes.ts
import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validateBody, validateParams, numericIdParamSchema } from '../../utils/validate';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import * as controller from './driver-payments.controller';
import { generateSchema, paySchema } from './driver-payments.validation';

export const driverPaymentsRouter = Router();
driverPaymentsRouter.use(requireAuth, requireRole('finance', 'admin'));

// generate creates a payment RECORD for the week. It does not send money.
driverPaymentsRouter.post(
  '/driver-weekly-payments/generate',
  validateBody(generateSchema),
  asyncHandler(controller.generate),
);
// pay records that finance already transferred the money and has a bank/Telebirr reference.
driverPaymentsRouter.post(
  '/driver-weekly-payments/:id/pay',
  validateParams(numericIdParamSchema),
  validateBody(paySchema),
  asyncHandler(controller.pay),
);
