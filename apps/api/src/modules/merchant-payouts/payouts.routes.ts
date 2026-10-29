// src/modules/merchant-payouts/payouts.routes.ts
import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validateBody, validateParams, numericIdParamSchema, merchantIdParamSchema } from '../../utils/validate';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import * as controller from './payouts.controller';
import { createPayoutSchema, markPaidSchema } from './payouts.validation';

export const payoutsRouter = Router();
payoutsRouter.use(requireAuth, requireRole('finance', 'admin'));

payoutsRouter.get(
  '/merchants/:merchantId/balance',
  validateParams(merchantIdParamSchema),
  asyncHandler(controller.balance),
);
payoutsRouter.get(
  '/merchants/:merchantId/unsettled-orders',
  validateParams(merchantIdParamSchema),
  asyncHandler(controller.unsettled),
);
// Creating a payout is the approval step in this workflow (status starts at processing).
payoutsRouter.post('/merchant-payouts', validateBody(createPayoutSchema), asyncHandler(controller.createPayout));
payoutsRouter.post(
  '/merchant-payouts/:id/mark-paid',
  validateParams(numericIdParamSchema),
  validateBody(markPaidSchema),
  asyncHandler(controller.markPaid),
);
payoutsRouter.post(
  '/merchant-payouts/:id/cancel',
  validateParams(numericIdParamSchema),
  asyncHandler(controller.cancelPayout),
);
