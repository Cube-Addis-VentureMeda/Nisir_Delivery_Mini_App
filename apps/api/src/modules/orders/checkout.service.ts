import Decimal from 'decimal.js';
import { sequelize } from '../../config/database';
import { Customer, Order, MerchantOrder, OrderItem, CustomerPayment } from '../../database/models';
import { computeFees } from './pricing.service';
import { ApiError } from '../../utils/ApiError';

interface CheckoutDto {
  lines: { catalogItemId: string; quantity: number }[];
  distanceKm?: number;
  recipientPhone: string;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  deliveryLandmark: string;
  deliveryInstructions?: string;
  paymentMethod: 'cod' | 'online' | 'bank_transfer';
  nonPartnerFeesAccepted: boolean;
  idempotencyKey?: string;
}

export async function checkout(customerId: string, dto: CheckoutDto) {
  // ── Verify Customer status ──
  const customer = await Customer.findByPk(customerId);
  if (!customer || customer.status !== 'active') {
    throw ApiError.forbidden('Customer account is not active');
  }

  // ── Idempotent replay: customer-scoped idempotency check ──
  if (dto.idempotencyKey) {
    const existing = await Order.findOne({ where: { idempotencyKey: dto.idempotencyKey } });
    if (existing) {
      if (String(existing.customerId) === String(customerId)) {
        return existing;
      }
      throw ApiError.conflict('Idempotency key was already used by another account');
    }
  }

  return sequelize.transaction(async (t) => {
    const fees = await computeFees(dto.lines, dto.distanceKm);

    if (fees.hasNonPartner && !dto.nonPartnerFeesAccepted) {
      throw ApiError.unprocessable(
        'This order includes restaurants with a service fee. Please accept the fees to continue.',
      );
    }

    // Online provider payments don't exist yet (Phase 8 / Decision #1).
    if (dto.paymentMethod === 'online') {
      throw new ApiError(
        503,
        'PAYMENTS_NOT_ENABLED',
        'Online payments are not enabled yet. Please use cash on delivery or bank transfer.',
      );
    }

    const order = await Order.create(
      {
        orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        customerId,
        driverId: null,
        orderType: 'food',
        status: 'pending',
        paymentMethod: dto.paymentMethod,
        currency: 'ETB',
        idempotencyKey: dto.idempotencyKey ?? null,

        subtotal: fees.subtotal.toFixed(2),
        companyFoodFeeTotal: fees.companyFoodFeeTotal.toFixed(2),
        deliveryFee: fees.deliveryFee.toFixed(2),
        nonPartnerServiceFeeTotal: fees.nonPartnerServiceFeeTotal.toFixed(2),
        totalAmount: fees.total.toFixed(2),

        restaurantCount: fees.restaurantCount,
        deliveryDistanceKm: (fees.distanceKm ?? new Decimal(0)).toFixed(2),
        deliveryBaseFee: fees.deliveryBaseFee.toFixed(2),
        deliveryDistanceFee: (fees.deliveryDistanceFee ?? new Decimal(0)).toFixed(2),
        driverCompanyShareRate: new Decimal(fees.rule.driverCompanyShareRate).toFixed(4),
        driverDeliveryEarning: fees.driverDeliveryEarning.toFixed(2),
        companyDeliveryShareAmount: fees.companyDeliveryShareAmount.toFixed(2),

        recipientPhone: dto.recipientPhone,
        deliveryAddress: dto.deliveryAddress,
        deliveryLatitude: dto.deliveryLatitude.toFixed(7),
        deliveryLongitude: dto.deliveryLongitude.toFixed(7),
        deliveryLandmark: dto.deliveryLandmark,
        deliveryInstructions: dto.deliveryInstructions ?? null,

        nonPartnerFeesAccepted: fees.hasNonPartner,
        nonPartnerFeesAcceptedAt: fees.hasNonPartner ? new Date() : null,
      },
      { transaction: t },
    );

    // Group items by merchant
    const byMerchant = new Map<string, typeof fees.lines>();
    for (const line of fees.lines) {
      const list = byMerchant.get(line.merchantId) ?? [];
      list.push(line);
      byMerchant.set(line.merchantId, list);
    }
    const rate = new Decimal(fees.rule.restaurantServiceRate);

    for (const [merchantId, merchantLines] of byMerchant) {
      const merchant = fees.merchants.find((m) => String(m.id) === merchantId)!;
      const moSubtotal = merchantLines.reduce((s, l) => s.plus(l.lineTotal), new Decimal(0));
      const serviceAmount = moSubtotal.mul(rate);
      const payable = merchant.isPartner ? moSubtotal.minus(serviceAmount) : moSubtotal;

      const merchantOrder = await MerchantOrder.create(
        {
          orderId: String(order.id),
          merchantId,
          status: 'pending',
          subtotal: moSubtotal.toFixed(2),
          isPartnerAtOrder: merchant.isPartner,
          restaurantServiceRate: rate.toFixed(4),
          restaurantServiceAmount: serviceAmount.toFixed(2),
          merchantPayableAmount: payable.toFixed(2),
          payoutStatus: 'unsettled',
        },
        { transaction: t },
      );

      // Unit food fee: snapshot of rule.companyFoodFeePerUnit for each unit
      const unitFoodFee = new Decimal(fees.rule.companyFoodFeePerUnit);
      for (const line of merchantLines) {
        await OrderItem.create(
          {
            merchantOrderId: String(merchantOrder.id),
            catalogItemId: line.catalogItemId,
            itemName: line.itemName,
            unitPrice: line.unitPrice.toFixed(2),
            quantity: line.quantity,
            lineTotal: line.lineTotal.toFixed(2),
            companyFoodFee: unitFoodFee.toFixed(2),
            instructions: null,
          },
          { transaction: t },
        );
      }
    }

    // ── Bank transfer: record payment INTENT (finance confirms later) ──
    if (dto.paymentMethod === 'bank_transfer') {
      await CustomerPayment.create(
        {
          orderId: String(order.id),
          customerId,
          provider: 'bank_transfer',
          providerTransactionId: null,
          paymentReference: null, // set when finance confirms transfer
          idempotencyKey: dto.idempotencyKey ?? `bt-${order.id}`,
          amount: fees.total.toFixed(2),
          currency: 'ETB',
          status: 'pending',
        },
        { transaction: t },
      );
    }

    return Order.findByPk(order.id, {
      transaction: t,
      include: [
        {
          model: MerchantOrder,
          as: 'merchantOrders',
          include: [{ model: OrderItem, as: 'items' }],
        },
      ],
    });
  });
}