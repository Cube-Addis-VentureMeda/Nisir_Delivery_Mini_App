import Decimal from 'decimal.js';
import { sequelize } from '../../config/database';
import { Op } from 'sequelize';
import { Order, MerchantOrder, Driver, PricingRule, Merchant, OrderItem } from '../../database/models';
import { OrderStatus } from '../../database/models/Order';
import { ApiError } from '../../utils/ApiError';
import { env } from '../../config/env';
import { AuthPayload } from '../../middleware/auth.middleware';

// Legal status moves for operations
const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:          ['confirmed', 'cancelled'],
  confirmed:        ['preparing', 'cancelled'],
  preparing:        ['ready_for_pickup', 'cancelled'],
  ready_for_pickup: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered'],
  delivered:        [],
  cancelled:        [],
};

export async function listAllOrders(status?: OrderStatus) {
  return Order.findAll({
    where: status ? { status } : {},
    include: [
      {
        model: MerchantOrder,
        as: 'merchantOrders',
        include: [
          { model: Merchant, as: 'merchant' },
          { model: OrderItem, as: 'items' },
        ],
      },
    ],
    order: [['placed_at', 'DESC']],
    limit: 100,
  });
}

/**
 * Scoped order retrieval enforcing authorization by caller identity:
 * - Customers can only view their own orders.
 * - Drivers can only view orders assigned to them.
 * - Staff (admin, finance) can view any order.
 */
export async function getOrderScoped(auth: AuthPayload, orderId: string) {
  const where: any = { id: orderId };

  if (auth.kind === 'customer') {
    where.customerId = auth.sub;
  } else if (auth.kind === 'driver') {
    where.driverId = auth.sub;
  }
  // Staff accounts (admin, finance) have global view access

  const order = await Order.findOne({
    where,
    include: [
      {
        model: MerchantOrder,
        as: 'merchantOrders',
        include: [
          { model: Merchant, as: 'merchant' },
          { model: OrderItem, as: 'items' },
        ],
      },
    ],
  });

  if (!order) {
    throw ApiError.notFound('Order not found or access denied');
  }

  return order;
}

export async function getOrderForCustomer(customerId: string, orderId: string) {
  return getOrderScoped({ sub: customerId, kind: 'customer' }, orderId);
}

export async function updateStatus(
  _staffId: string,
  orderId: string,
  target: OrderStatus,
  reason?: string,
) {
  return sequelize.transaction(async (t) => {
    // Row lock: two staff clicking simultaneously → the second waits, then sees fresh state
    const order = await Order.findByPk(orderId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!order) throw ApiError.notFound('Order not found');

    const allowed = ORDER_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(target)) {
      throw ApiError.conflict(`Illegal status transition: ${order.status} → ${target}`);
    }

    await order.update(
      {
        status: target,
        ...(target === 'delivered' ? { deliveredAt: new Date() } : {}),
        ...(target === 'cancelled'
          ? { cancelledAt: new Date(), cancellationReason: reason ?? null }
          : {}),
      },
      { transaction: t },
    );
    return order;
  });
}

export async function assignDriver(orderId: string, driverId: string) {
  // 1. Verify driver exists and is active before locking order
  const driver = await Driver.findByPk(driverId);
  if (!driver || driver.status !== 'active') {
    throw ApiError.unprocessable('Driver not found or account is not active');
  }

  const order = await sequelize.transaction(async (t) => {
    const locked = await Order.findByPk(orderId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!locked) throw ApiError.notFound('Order not found');

    // 2. Only allow assignment on eligible order statuses
    if (!['confirmed', 'preparing', 'ready_for_pickup'].includes(locked.status)) {
      throw ApiError.conflict(`Cannot assign driver to an order in status "${locked.status}"`);
    }

    if (locked.driverId !== null) {
      // Idempotent: re-assigning the SAME driver is a harmless no-op
      if (String(locked.driverId) === String(driverId)) return locked;
      throw ApiError.conflict('Driver already assigned — one driver per checkout');
    }

    await locked.update({ driverId }, { transaction: t });
    return locked;
  });

  // Notify AFTER transaction commits
  if (driver.telegramChatId) {
    await notifyDriverAssigned(driver.telegramChatId, order);
  }

  return order;
}

export async function setDeliveryDistance(_staffId: string, orderId: string, distanceKm: number) {
  return sequelize.transaction(async (t) => {
    const order = await Order.findByPk(orderId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!order) throw ApiError.notFound('Order not found');
    if (['delivered', 'cancelled'].includes(order.status)) {
      throw ApiError.conflict(`Cannot change distance on a ${order.status} order`);
    }

    const rule = await PricingRule.findActive();
    if (!rule) throw ApiError.pricingUnavailable();

    const km = new Decimal(distanceKm);
    const distanceFee = new Decimal(rule.perKilometerFee).mul(km);
    const baseFee = new Decimal(order.deliveryBaseFee); // frozen snapshot
    const deliveryFee = baseFee.plus(distanceFee);

    const driverRate = new Decimal(order.driverCompanyShareRate); // frozen snapshot
    const driverEarning = deliveryFee.mul(driverRate);
    const companyShare = deliveryFee.minus(driverEarning);

    // total = subtotal + food fees + new delivery fee + service fee
    const newTotal = new Decimal(order.subtotal)
      .plus(new Decimal(order.companyFoodFeeTotal))
      .plus(deliveryFee)
      .plus(new Decimal(order.nonPartnerServiceFeeTotal));

    await order.update(
      {
        deliveryDistanceKm: km.toFixed(2),
        deliveryDistanceFee: distanceFee.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        driverDeliveryEarning: driverEarning.toFixed(2),
        companyDeliveryShareAmount: companyShare.toFixed(2),
        totalAmount: newTotal.toFixed(2),
      },
      { transaction: t },
    );
    return order;
  });
}

// Push a message to the driver via the Telegram Bot API with response check
export async function notifyDriverAssigned(chatId: string, order: Order) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text:
          `📦 New delivery assigned!\nOrder: ${order.orderNumber}\n` +
          (order.paymentMethod === 'cod' ? `Collect: ${order.totalAmount} ETB (cash)\n` : '') +
          `Address: ${order.deliveryAddress}\nLandmark: ${order.deliveryLandmark}`,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[notifyDriverAssigned] Telegram API returned HTTP ${res.status}:`, errText);
    }
  } catch (e) {
    // Notification failure must never break dispatch — log and move on
    console.error('[notifyDriverAssigned] Network error:', e);
  }
}