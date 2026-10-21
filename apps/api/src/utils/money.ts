// src/utils/money.ts
import Decimal from 'decimal.js';

// Money rule for this entire project: DECIMAL columns arrive from MySQL as STRINGS.
// Convert to Decimal before ANY math. Never use Number() on money.
export function toDecimal(value: string | number | Decimal | null | undefined): Decimal {
  if (value === null || value === undefined) return new Decimal(0);
  return new Decimal(value);
}


export function moneyOut(value: Decimal): string {
  return value.toFixed(2);
}