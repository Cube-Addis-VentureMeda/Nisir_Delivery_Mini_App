// src/modules/orders/quote.service.ts
import { computeFees } from './pricing.service';
import { moneyOut } from '../../utils/money';

// The quote is a display aid. Checkout recomputes all fees independently from database prices.
export async function quote(
  _customerId: string,
  lines: { catalogItemId: string; quantity: number }[],
  distanceKm?: number,
) {
  const fees = await computeFees(lines, distanceKm);

  return {
    subtotal: moneyOut(fees.subtotal),
    companyFoodFeeTotal: moneyOut(fees.companyFoodFeeTotal),
    deliveryBaseFee: moneyOut(fees.deliveryBaseFee),
    deliveryDistanceFee: fees.deliveryDistanceFee !== null ? moneyOut(fees.deliveryDistanceFee) : null,
    deliveryFee: moneyOut(fees.deliveryFee),
    nonPartnerServiceFeeTotal: moneyOut(fees.nonPartnerServiceFeeTotal),
    restaurantCount: fees.restaurantCount,
    total: moneyOut(fees.total),
    requiresNonPartnerAcceptance: fees.requiresNonPartnerAcceptance,
  };
}