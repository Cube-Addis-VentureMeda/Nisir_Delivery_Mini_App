// src/modules/drivers/driver.validation.ts
import { z } from 'zod';

export const driverStatusSchema = z.object({
  status: z.enum(['out_for_delivery', 'delivered']),
});

export const collectCashSchema = z.object({
  amountCollected: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be formatted as currency (e.g., "125.00")')
    .refine((val) => Number(val) > 0, 'Amount collected must be greater than zero'),
});

export const claimSchema = z.object({});