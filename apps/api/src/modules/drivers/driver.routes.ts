// src/modules/drivers/driver.routes.ts
import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validateBody } from '../../utils/validate';
import { requireAuth, requireDriver } from '../../middleware/auth.middleware';
import * as controller from './driver.controller';
import { driverStatusSchema, collectCashSchema } from './driver.validation';
import { createHandoverSchema } from '../cash-management/cash.validation';

export const driverRouter = Router();

// Everything under /api/v1/driver requires a DRIVER token
driverRouter.use(requireAuth, requireDriver);

driverRouter.get('/orders', asyncHandler(controller.listMyOrders));
driverRouter.get('/orders/available', asyncHandler(controller.availableOrders));
driverRouter.get('/orders/:id', asyncHandler(controller.getDriverOrder));
driverRouter.post('/orders/:id/claim', asyncHandler(controller.claimOrder));
driverRouter.post('/orders/:id/status', validateBody(driverStatusSchema), asyncHandler(controller.advanceStatus));
driverRouter.post('/orders/:id/collect-cash', validateBody(collectCashSchema), asyncHandler(controller.recordCashCollection));

// Driver cash management
driverRouter.get('/collections/pending', asyncHandler(controller.pendingCollections));
driverRouter.post('/cash-handovers', validateBody(createHandoverSchema), asyncHandler(controller.createHandover));

// Driver earnings / weekly payments
driverRouter.get('/weekly-payments', asyncHandler(controller.weeklyPayments));