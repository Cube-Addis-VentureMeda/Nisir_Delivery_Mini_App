// src/modules/orders/quote.validation.ts
// Re-export canonical schemas from orders.validation.ts to prevent validation drift
export { cartLineSchema, quoteSchema, checkoutSchema } from './orders.validation';