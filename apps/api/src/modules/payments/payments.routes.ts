// src/modules/payments/payments.routes.ts
import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { validateBody, validateParams, validateQuery, numericIdParamSchema } from '../../utils/validate';
import * as controller from './payments.controller';
import { confirmBankTransferSchema, listPaymentsQuerySchema } from './payments.validation';

export const paymentsRouter = Router();

// Small finance team: admin is a superuser and finance owns money-in confirmation.
// Both may list pending transfers and record that a bank credit was matched.
paymentsRouter.use(requireAuth, requireRole('admin', 'finance'));

paymentsRouter.get(
  '/payments',
  validateQuery(listPaymentsQuerySchema),
  asyncHandler(controller.listPayments),
);
paymentsRouter.post(
  '/payments/:id/confirm',
  validateParams(numericIdParamSchema),
  validateBody(confirmBankTransferSchema),
  asyncHandler(controller.confirm),
);
