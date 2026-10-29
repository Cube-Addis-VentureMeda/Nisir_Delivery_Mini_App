// src/modules/payments/payments.service.ts
import { sequelize } from '../../config/database';
import { CustomerPayment } from '../../database/models/CustomerPayment';
import { Order } from '../../database/models/Order';
import { ApiError } from '../../utils/ApiError';
import { CUSTOMER_PAYMENT_STATUSES } from './payments.validation';

/**
 * Finance records that a bank credit was matched to this payment.
 * This does not talk to a bank; staff must already have seen the transfer.
 */
export async function confirmBankTransfer(staffId: string, paymentId: string, reference: string) {
  return sequelize.transaction(async (t) => {
    const payment = await CustomerPayment.findByPk(paymentId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!payment) throw ApiError.notFound('Payment not found');
    if (payment.provider !== 'bank_transfer') {
      throw ApiError.unprocessable('Only pending bank-transfer payments can be confirmed here');
    }
    if (payment.status !== 'pending') throw ApiError.conflict(`Payment is already ${payment.status}`);

    const order = await Order.findByPk(payment.orderId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!order) throw ApiError.notFound('Order not found for this payment');
    if (order.paymentMethod !== 'bank_transfer') {
      throw ApiError.unprocessable('This payment is not a bank transfer');
    }
    if (order.status !== 'pending') {
      throw ApiError.conflict(
        `Order is ${order.status}; a bank credit for a non-pending order must be reconciled manually (do not mark this payment paid here)`,
      );
    }

    await payment.update(
      {
        status: 'paid',
        paymentReference: reference,
        paidAt: new Date(),
        confirmedByStaffId: staffId,
      },
      { transaction: t },
    );

    const [affected] = await Order.update(
      { status: 'confirmed', confirmedAt: new Date() },
      { where: { id: payment.orderId, status: 'pending' }, transaction: t },
    );
    if (affected !== 1) {
      throw ApiError.conflict('Order was not pending when confirming this transfer; transaction rolled back');
    }

    return payment;
  });
}

export async function listPayments(status?: string) {
  const where =
    status && (CUSTOMER_PAYMENT_STATUSES as readonly string[]).includes(status)
      ? { status }
      : {};

  return CustomerPayment.findAll({
    where,
    include: [{ model: Order, as: 'order' }],
    order: [['created_at', 'DESC']],
    limit: 200,
  });
}
