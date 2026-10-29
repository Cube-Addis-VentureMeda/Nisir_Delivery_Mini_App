// src/modules/payments/payments.validation.ts
import { z } from 'zod';
import { paymentReferenceSchema } from '../../utils/validate';

export const CUSTOMER_PAYMENT_STATUSES = [
  'pending',
  'processing',
  'paid',
  'failed',
  'cancelled',
  'refunded',
  'partially_refunded',
] as const;

export const listPaymentsQuerySchema = z.object({
  status: z.enum(CUSTOMER_PAYMENT_STATUSES).optional(),
});

export const confirmBankTransferSchema = z.object({
  reference: paymentReferenceSchema,
});
