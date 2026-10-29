import { Op } from 'sequelize';
import Decimal from 'decimal.js';
import { sequelize } from '../../config/database';
import { Order, MerchantOrder, OrderItem, Merchant, Driver, CashCollection, DriverWeeklyPayment, DriverWeeklyPaymentItem } from '../../database/models';
import { OrderStatus } from '../../database/models/Order';
import { ApiError } from '../../utils/ApiError';
import { notifyDriverAssigned } from '../orders/orders.service';

// The allowed forward moves for the PARENT order (driver's side).
// Ops uses a wider map (orders.service.ts); the driver app is intentionally limited.
const DRIVER_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  ready_for_pickup: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
};

export async function listMyOrders(driverId: string) {
  return Order.findAll({
    where: {
      driverId,
      status: { [Op.in]: ['confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery'] },
    },
    include: [{ model: MerchantOrder, as: 'merchantOrders', include: [{ model: OrderItem, as: 'items' }] }],
    order: [['placed_at', 'DESC']],
  });
}

export async function getOrderForDriver(driverId: string, orderId: string) {
  const order = await Order.findOne({
    where: { id: orderId, driverId },
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
    throw ApiError.notFound('Order not found or not assigned to you');
  }

  return order;
}

export async function advanceStatus(driverId: string, orderId: string, target: OrderStatus) {
  return sequelize.transaction(async (t) => {
    // Row lock: two requests cannot race each other on state transitions
    const order = await Order.findOne({
      where: { id: orderId, driverId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!order) throw ApiError.notFound('Order not found or not assigned to you');

    const allowed = DRIVER_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(target)) {
      throw ApiError.conflict(`Cannot move order from ${order.status} to ${target}`);
    }

    await order.update(
      {
        status: target,
        ...(target === 'delivered' ? { deliveredAt: new Date() } : {}),
      },
      { transaction: t },
    );

    return order;
  });
}

export async function recordCashCollection(driverId: string, orderId: string, amountCollected: string) {
  const collected = new Decimal(amountCollected);
  if (collected.lte(0)) {
    throw ApiError.unprocessable('Amount collected must be greater than zero');
  }

  return sequelize.transaction(async (t) => {
    const order = await Order.findOne({
      where: { id: orderId, driverId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!order) throw ApiError.notFound('Order not found or not assigned to you');
    if (order.paymentMethod !== 'cod') {
      throw ApiError.unprocessable('This order is not cash-on-delivery');
    }
    if (order.status !== 'delivered') {
      throw ApiError.conflict('Cash can only be recorded after delivery');
    }

    // Protection against duplicate cash collections on retry
    const existing = await CashCollection.findOne({
      where: { orderId: order.id },
      transaction: t,
    });

    if (existing) {
      // Idempotency: if already recorded with same amount, return existing record
      if (new Decimal(existing.amountCollected).equals(collected)) {
        return existing;
      }
      throw ApiError.conflict('Cash collection has already been recorded for this order');
    }

    const expected = new Decimal(order.totalAmount);

    return CashCollection.create(
      {
        orderId: order.id,
        driverId,
        amountExpected: expected.toFixed(2),
        amountCollected: collected.toFixed(2),
        status: 'collected',
        collectedAt: new Date(),
        discrepancyNote: collected.equals(expected) ? null : `Collected ${collected} of expected ${expected}`,
      },
      { transaction: t },
    );
  });
}

// ── Driver picks orders (grab model) ──
export async function listAvailableOrders(limit = 30, offset = 0) {
  return Order.findAll({
    where: {
      driverId: null,
      status: { [Op.in]: ['confirmed', 'preparing', 'ready_for_pickup'] },
    },
    include: [
      {
        model: MerchantOrder,
        as: 'merchantOrders',
        include: [{ model: Merchant, as: 'merchant' }],
      },
    ],
    order: [['placed_at', 'ASC']],
    limit: Math.min(Math.max(1, limit), 100),
    offset: Math.max(0, offset),
  });
}

export async function claimOrder(driverId: string, orderId: string) {
  const order = await sequelize.transaction(async (t) => {
    // 1. Verify driver is active and eligible to claim orders
    const driver = await Driver.findByPk(driverId, { transaction: t });
    if (!driver || driver.status !== 'active') {
      throw ApiError.forbidden('Driver account is not active or eligible to claim orders');
    }

    // 2. Lock the row: two drivers tapping "claim" simultaneously → one waits,
    // then sees driverId set and gets 409. This is the whole enforcement.
    const locked = await Order.findOne({
      where: { id: orderId, driverId: null },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!locked) throw ApiError.conflict('This order was just taken by another driver');
    if (!['confirmed', 'preparing', 'ready_for_pickup'].includes(locked.status)) {
      throw ApiError.conflict(`Order is ${locked.status} and cannot be claimed`);
    }

    await locked.update({ driverId }, { transaction: t });
    return locked;
  });

  const driver = await Driver.findByPk(driverId);
  if (driver?.telegramChatId) {
    await notifyDriverAssigned(driver.telegramChatId, order);
  }

  return order;
}

export async function listWeeklyPayments(driverId: string) {
  return DriverWeeklyPayment.findAll({
    where: { driverId },
    include: [{ model: DriverWeeklyPaymentItem, as: 'items' }],
    order: [['periodEnd', 'DESC']],
  });
}
