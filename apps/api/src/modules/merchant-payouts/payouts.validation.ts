// src/modules/merchant-payouts/payouts.validation.ts
import { z } from 'zod';
import { numericIdString, paymentReferenceSchema } from '../../utils/validate';

export const createPayoutSchema = z.object({
  merchantId: numericIdString,
  payoutAccountId: numericIdString,
  merchantOrderIds: z
    .array(numericIdString)
    .min(1, 'At least one merchant order is required')
    .refine((ids) => new Set(ids).size === ids.length, 'Duplicate merchant order IDs are not allowed'),
});

export const markPaidSchema = z.object({
  paymentReference: paymentReferenceSchema,
});
