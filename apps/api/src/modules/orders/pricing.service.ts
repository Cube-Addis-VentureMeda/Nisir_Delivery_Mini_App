import Decimal from 'decimal.js';
import { PricingRule, Merchant, CatalogItem } from '../../database/models';
import { ApiError } from '../../utils/ApiError';

export interface PricedLine {
  catalogItemId: string;
  merchantId: string;
  itemName: string;
  unitPrice: Decimal;
  quantity: number;
  lineTotal: Decimal; // unitPrice × quantity
}

export interface FeeBreakdown {
  rule: PricingRule;
  lines: PricedLine[];
  merchants: Merchant[];
  subtotal: Decimal;
  totalQuantity: number;
  companyFoodFeeTotal: Decimal; // Br 20 × every unit
  restaurantCount: number; // 1 → base 50, 2+ → base 80
  deliveryBaseFee: Decimal;
  distanceKm: Decimal | null;
  deliveryDistanceFee: Decimal | null;
  deliveryFee: Decimal; // base + distance
  driverDeliveryEarning: Decimal; // deliveryFee × 0.60
  companyDeliveryShareAmount: Decimal; // deliveryFee × 0.40
  hasNonPartner: boolean;
  nonPartnerSubtotal: Decimal;
  nonPartnerServiceFeeTotal: Decimal; // 5% of non-partner subtotals only
  total: Decimal; // THE number the customer pays
  requiresNonPartnerAcceptance: boolean;
}

/**
 * Consolidates lines so duplicate items in cart have their quantities summed.
 */
function consolidateCartLines(lines: { catalogItemId: string; quantity: number }[]) {
  const lineMap = new Map<string, number>();
  for (const line of lines) {
    lineMap.set(line.catalogItemId, (lineMap.get(line.catalogItemId) || 0) + line.quantity);
  }
  return Array.from(lineMap.entries()).map(([catalogItemId, quantity]) => ({
    catalogItemId,
    quantity,
  }));
}

/**
 * Computes fee breakdown from live database catalog records.
 * Used by both quote preview and checkout.
 */
export async function computeFees(
  rawLines: { catalogItemId: string; quantity: number }[],
  distanceKm?: number,
): Promise<FeeBreakdown> {
  // Consolidate duplicate cart lines to prevent false unavailable-item errors
  const lines = consolidateCartLines(rawLines);

  // 0. Load the active pricing rule
  const rule = await PricingRule.findActive();
  if (!rule) throw ApiError.pricingUnavailable();

  // 1. Load catalog items with ACTIVE merchants
  const itemIds = lines.map((l) => l.catalogItemId);
  const catalogItems = await CatalogItem.findAll({
    where: { id: itemIds, isAvailable: true },
    include: [
      {
        model: Merchant,
        as: 'merchant',
        required: true,
        where: { status: 'active' }, // Only active merchants are eligible for checkout
      },
    ],
  });

  if (catalogItems.length !== itemIds.length) {
    throw ApiError.unprocessable('One or more items in your cart are unavailable or from an inactive store');
  }

  // 2. Price each line from verified database prices
  const pricedLines: PricedLine[] = lines.map((line) => {
    const item = catalogItems.find((ci) => String(ci.id) === line.catalogItemId)!;
    const unitPrice = new Decimal(item.currentPrice);
    return {
      catalogItemId: String(item.id),
      merchantId: String(item.merchantId),
      itemName: item.name,
      unitPrice,
      quantity: line.quantity,
      lineTotal: unitPrice.mul(line.quantity),
    };
  });

  const merchants = [
    ...new Map(catalogItems.map((ci) => [String(ci.merchant!.id), ci.merchant!])).values(),
  ];

  // 3. Fee breakdown calculations
  const subtotal = pricedLines.reduce((s, l) => s.plus(l.lineTotal), new Decimal(0));
  const totalQuantity = pricedLines.reduce((s, l) => s + l.quantity, 0);

  // Platform food fee × every item unit
  const companyFoodFeeTotal = new Decimal(rule.companyFoodFeePerUnit).mul(totalQuantity);

  // Base delivery fee (single vs multi-restaurant)
  const restaurantCount = merchants.length;
  const deliveryBaseFee = new Decimal(
    restaurantCount <= 1 ? rule.singleRestaurantBaseFee : rule.multipleRestaurantsBaseFee,
  );

  // Distance fee calculation (strict non-null check so distance 0 produces calculated 0 fee)
  const distance = distanceKm != null ? new Decimal(distanceKm) : null;
  const deliveryDistanceFee = distance !== null ? new Decimal(rule.perKilometerFee).mul(distance) : null;
  const deliveryFee = deliveryBaseFee.plus(deliveryDistanceFee ?? 0);

  // Driver / Company delivery fee split (60/40)
  const driverRate = new Decimal(rule.driverCompanyShareRate);
  const driverDeliveryEarning = deliveryFee.mul(driverRate);
  const companyDeliveryShareAmount = deliveryFee.minus(driverDeliveryEarning);

  // 4. Non-partner service fee
  const hasNonPartner = merchants.some((m) => !m.isPartner);
  const nonPartnerSubtotal = pricedLines
    .filter((l) => merchants.find((m) => String(m.id) === l.merchantId && !m.isPartner))
    .reduce((s, l) => s.plus(l.lineTotal), new Decimal(0));
  const nonPartnerServiceFeeTotal = hasNonPartner
    ? nonPartnerSubtotal.mul(new Decimal(rule.restaurantServiceRate))
    : new Decimal(0);

  // 5. Total amount
  const total = subtotal
    .plus(companyFoodFeeTotal)
    .plus(deliveryFee)
    .plus(nonPartnerServiceFeeTotal);

  return {
    rule,
    lines: pricedLines,
    merchants,
    subtotal,
    totalQuantity,
    companyFoodFeeTotal,
    restaurantCount,
    deliveryBaseFee,
    distanceKm: distance,
    deliveryDistanceFee,
    deliveryFee,
    driverDeliveryEarning,
    companyDeliveryShareAmount,
    hasNonPartner,
    nonPartnerSubtotal,
    nonPartnerServiceFeeTotal,
    total,
    requiresNonPartnerAcceptance: hasNonPartner,
  };
}