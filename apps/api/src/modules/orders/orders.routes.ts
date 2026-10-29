import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validateBody } from '../../utils/validate';
import { requireAuth, requireCustomer, requireRole } from '../../middleware/auth.middleware';
import * as controller from './orders.controller';
import { quoteSchema, checkoutSchema, updateStatusSchema, assignDriverSchema, setDistanceSchema } from './orders.validation';

export const ordersRouter = Router();

// ── Customer-facing ──
ordersRouter.post('/cart/quote', requireAuth, requireCustomer, validateBody(quoteSchema), asyncHandler(controller.quote));
ordersRouter.post('/orders', requireAuth, requireCustomer, validateBody(checkoutSchema), asyncHandler(controller.checkout));
ordersRouter.get('/orders/:id', requireAuth, asyncHandler(controller.getOrder));

// ── Ops-facing (backend-enforced — frontend hiding buttons is not security) ──
ordersRouter.get('/orders', requireAuth, requireRole('admin', 'finance'), asyncHandler(controller.listOrders));
ordersRouter.patch('/orders/:id/status', requireAuth, requireRole('admin'),
  validateBody(updateStatusSchema), asyncHandler(controller.updateStatus));
ordersRouter.patch('/orders/:id/assign-driver', requireAuth, requireRole('admin'),
  validateBody(assignDriverSchema), asyncHandler(controller.assignDriver));
ordersRouter.patch('/orders/:id/delivery-distance', requireAuth, requireRole('admin'),
  validateBody(setDistanceSchema), asyncHandler(controller.setDistance));