// src/modules/orders/orders.validation.ts
import { z } from 'zod';

export const cartLineSchema = z.object({
  catalogItemId: z.string().regex(/^\d+$/, 'catalogItemId must be a numeric string'),
  quantity: z.number().int().min(1).max(50),
});

export const quoteSchema = z.object({
  lines: z.array(cartLineSchema).min(1, 'At least one item is required in the cart'),
  distanceKm: z.number().min(0).max(50).optional(),
});

export const checkoutSchema = quoteSchema.extend({
  recipientPhone: z
    .string()
    .trim()
    .min(7, 'Phone number too short')
    .max(30, 'Phone number too long')
    .regex(/^[+0-9\s()-]+$/, 'Invalid phone number format'),
  deliveryAddress: z.string().trim().min(5, 'Delivery address must be at least 5 characters'),
  deliveryLatitude: z.number().min(-90).max(90),
  deliveryLongitude: z.number().min(-180).max(180),
  deliveryLandmark: z.string().trim().min(2, 'Landmark is required in Debre Birhan').max(255),
  deliveryInstructions: z.string().trim().max(1000).optional(),
  paymentMethod: z.enum(['cod', 'online', 'bank_transfer']),
  nonPartnerFeesAccepted: z.boolean().default(false),
  idempotencyKey: z.string().trim().min(8).max(100).optional(),
});

export const orderStatusEnum = z.enum([
  'pending',
  'confirmed',
  'preparing',
  'ready_for_pickup',
  'out_for_delivery',
  'delivered',
  'cancelled',
]);

export const updateStatusSchema = z
  .object({
    status: orderStatusEnum,
    cancellationReason: z.string().trim().max(1000).optional(),
  })
  .refine(
    (data) => {
      if (data.status === 'cancelled') {
        return Boolean(data.cancellationReason && data.cancellationReason.length > 0);
      }
      return true;
    },
    {
      message: 'cancellationReason is required when cancelling an order',
      path: ['cancellationReason'],
    },
  );

export const assignDriverSchema = z.object({
  driverId: z.string().regex(/^\d+$/, 'driverId must be a numeric string'),
});

export const setDistanceSchema = z.object({
  distanceKm: z.number().min(0).max(50), // server-side sanity cap
});

export const listOrdersQuerySchema = z.object({
  status: orderStatusEnum.optional(),
});