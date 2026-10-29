// src/modules/driver-payments/driver-payments.validation.ts
import { z } from 'zod';
import { numericIdString, paymentReferenceSchema } from '../../utils/validate';

function isRealIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function utcDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
  .refine(isRealIsoDate, 'Date is not a valid calendar date');

export const generateSchema = z
  .object({
    driverId: numericIdString,
    periodStart: isoDate, // Monday
    periodEnd: isoDate,   // Sunday
    payoutAccountId: numericIdString.optional(),
  })
  .superRefine((value, ctx) => {
    const start = utcDate(value.periodStart);
    const end = utcDate(value.periodEnd);
    if (start.getTime() > end.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'periodStart must be on or before periodEnd',
        path: ['periodStart'],
      });
    }
    if (start.getUTCDay() !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'periodStart must be a Monday',
        path: ['periodStart'],
      });
    }
    if (end.getUTCDay() !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'periodEnd must be a Sunday',
        path: ['periodEnd'],
      });
    }
    const days = (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
    if (days !== 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Weekly period must be exactly Monday through Sunday',
        path: ['periodEnd'],
      });
    }
  });

export const paySchema = z.object({
  paymentReference: paymentReferenceSchema,
});
