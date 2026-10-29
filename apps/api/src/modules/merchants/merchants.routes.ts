// src/modules/merchants/merchants.routes.ts
import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validateBody } from '../../utils/validate';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import * as controller from './merchants.controller';
import {
  createMerchantSchema,
  updateMerchantSchema,
  createCatalogItemSchema,
  updateCatalogItemSchema,
} from './merchants.validation';

export const merchantsRouter = Router();

// ── Public / Customer-accessible routes ──
merchantsRouter.get('/merchants', asyncHandler(controller.listMerchants));
merchantsRouter.get('/merchants/:id', asyncHandler(controller.getMerchant));
merchantsRouter.get('/merchants/:id/items', asyncHandler(controller.listMerchantItems));

// ── Admin-facing management (strict validation & authorization) ──
merchantsRouter.post(
  '/merchants',
  requireAuth,
  requireRole('admin'),
  validateBody(createMerchantSchema),
  asyncHandler(controller.createMerchant),
);

merchantsRouter.patch(
  '/merchants/:id',
  requireAuth,
  requireRole('admin'),
  validateBody(updateMerchantSchema),
  asyncHandler(controller.updateMerchant),
);

merchantsRouter.post(
  '/catalog-items',
  requireAuth,
  requireRole('admin'),
  validateBody(createCatalogItemSchema),
  asyncHandler(controller.createCatalogItem),
);

merchantsRouter.patch(
  '/catalog-items/:id',
  requireAuth,
  requireRole('admin'),
  validateBody(updateCatalogItemSchema),
  asyncHandler(controller.updateCatalogItem),
);
