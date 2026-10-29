// src/modules/merchants/merchants.validation.ts
import { z } from 'zod';

export const listMerchantsQuerySchema = z.object({
  type: z.enum(['restaurant', 'store']).optional(),
  partnerOnly: z.enum(['true', 'false']).optional(),
});

export const createMerchantSchema = z.object({
  name: z.string().trim().min(1, 'Merchant name is required').max(200),
  merchantType: z.enum(['restaurant', 'store']),
  storeType: z.enum(['supermarket', 'grocery', 'convenience_store', 'other']).nullable().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  phone: z.string().trim().min(7).max(30).nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
  latitude: z.string().regex(/^-?\d+(\.\d+)?$/, 'Latitude must be numeric string').nullable().optional(),
  longitude: z.string().regex(/^-?\d+(\.\d+)?$/, 'Longitude must be numeric string').nullable().optional(),
  status: z.enum(['pending', 'active', 'suspended', 'inactive']).default('pending'),
  isPartner: z.boolean().default(false),
  partnerSince: z.string().datetime().nullable().optional(),
});

export const updateMerchantSchema = createMerchantSchema.partial();

export const createCatalogItemSchema = z.object({
  merchantId: z.string().regex(/^\d+$/, 'merchantId must be a numeric string'),
  name: z.string().trim().min(1, 'Item name is required').max(200),
  description: z.string().trim().max(1000).nullable().optional(),
  imageUrl: z.string().max(2000).nullable().optional(),
  currentPrice: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'currentPrice must look like "150.00"')
    .refine((v) => Number(v) >= 0, 'Price must be non-negative'),
  isAvailable: z.boolean().default(true),
});

export const updateCatalogItemSchema = createCatalogItemSchema.partial();
