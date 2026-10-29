// src/modules/cash-management/cash.validation.ts
import { z } from 'zod';
import Decimal from 'decimal.js';

export const createHandoverSchema = z.object({
  items: z
    .array(
      z.object({
        cashCollectionId: z.string().regex(/^\d+$/, 'Collection ID must be numeric').max(20, 'ID too long'),
        amountApplied: z
          .string()
          .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be formatted like "500.00"')
          .refine((val) => {
            try {
              return new Decimal(val).gt(0);
            } catch {
              return false;
            }
          }, 'Amount applied must be greater than zero'),
      }),
    )
    .min(1, 'At least one collection item is required')
    .refine(
      (items) => new Set(items.map((i) => i.cashCollectionId)).size === items.length,
      'Duplicate collection IDs are not allowed in the same handover',
    ),
});

export const verifyHandoverSchema = z.object({
  // Zero is allowed: staff may count an empty envelope. That is a discrepancy
  // against a positive declared amount and the service will reject the handover.
  amountVerified: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be formatted like "500.00"')
    .refine((val) => {
      try {
        return new Decimal(val).gte(0);
      } catch {
        return false;
      }
    }, 'Verified amount cannot be negative'),
  notes: z.string().trim().max(1000).optional(),
});