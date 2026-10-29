// src/modules/cash-management/cash.routes.ts
import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validateBody, validateParams, validateQuery, numericIdParamSchema, paginationQuerySchema } from '../../utils/validate';
import { requireAuth, requireDriver, requireRole } from '../../middleware/auth.middleware';
import * as controller from './cash.controller';
import { createHandoverSchema, verifyHandoverSchema } from './cash.validation';

export const cashRouter = Router();

// Driver side
cashRouter.get(
  '/collections/pending',
  requireAuth,
  requireDriver,
  validateQuery(paginationQuerySchema),
  asyncHandler(controller.pendingCollections),
);
cashRouter.get(
  '/cash-handovers',
  requireAuth,
  requireDriver,
  validateQuery(paginationQuerySchema),
  asyncHandler(controller.handovers),
);
cashRouter.post('/cash-handovers', requireAuth, requireDriver, validateBody(createHandoverSchema), asyncHandler(controller.createHandover));

// Staff side — admin and finance count the envelope. :id is validated before the controller runs.
cashRouter.post(
  '/cash-handovers/:id/verify',
  requireAuth,
  requireRole('admin', 'finance'),
  validateParams(numericIdParamSchema),
  validateBody(verifyHandoverSchema),
  asyncHandler(controller.verifyHandover),
);