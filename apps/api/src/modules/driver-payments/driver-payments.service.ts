import Decimal from 'decimal.js';
import { Op, UniqueConstraintError } from 'sequelize';
import { sequelize } from '../../config/database';
import { Order, Driver, PayoutAccount, DriverWeeklyPayment, DriverWeeklyPaymentItem } from '../../database/models';
import { ApiError } from '../../utils/ApiError';

function periodBounds(periodStart: string, periodEnd: string) {
  const [sy, sm, sd] = periodStart.split('-').map(Number);
  const [ey, em, ed] = periodEnd.split('-').map(Number);
  const start = new Date(Date.UTC(sy, sm - 1, sd, 0, 0, 0, 0));
  const endExclusive = new Date(Date.UTC(ey, em - 1, ed + 1, 0, 0, 0, 0));
  return { start, endExclusive };
}

function accountIsPayable(account: PayoutAccount) {
  return account.status === 'verified';
}

/**
 * Builds a weekly earning record. No bank or Telebirr transfer is executed.
 * Finance later calls pay() after sending the money outside the system.
 */
export async function generate(
  staffId: string,
  dto: {
    driverId: string;
    periodStart: string;
    periodEnd: string;
    payoutAccountId?: string;
  },
) {
  const { start, endExclusive } = periodBounds(dto.periodStart, dto.periodEnd);

  try {
    return await sequelize.transaction(async (t) => {
      const driver = await Driver.findByPk(dto.driverId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!driver) throw ApiError.notFound('Driver not found');
      // Inactive/suspended drivers can still be paid for work already delivered.

      const orders = await Order.findAll({
        where: {
          driverId: dto.driverId,
          status: 'delivered',
          deliveredAt: { [Op.gte]: start, [Op.lt]: endExclusive },
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
        order: [['delivered_at', 'ASC']],
      });

      const alreadyPaid = orders.length
        ? await DriverWeeklyPaymentItem.findAll({
            where: { orderId: { [Op.in]: orders.map((order) => order.id) } },
            attributes: ['orderId'],
            transaction: t,
          })
        : [];
      const taken = new Set(alreadyPaid.map((item) => String(item.orderId)));
      const eligible = orders.filter((order) => !taken.has(String(order.id)));

      if (eligible.length === 0) {
        throw ApiError.unprocessable('No unpaid delivered orders found for this driver in this period');
      }

      let payoutAccount: PayoutAccount | null = null;
      if (dto.payoutAccountId) {
        payoutAccount = await PayoutAccount.findByPk(dto.payoutAccountId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!payoutAccount || String(payoutAccount.driverId) !== dto.driverId) {
          throw ApiError.unprocessable('Payout account does not belong to this driver');
        }
      } else {
        payoutAccount = await PayoutAccount.findOne({
          where: { driverId: dto.driverId, isDefault: true },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
      }

      if (!payoutAccount || !accountIsPayable(payoutAccount)) {
        throw ApiError.unprocessable(
          'Driver has no verified payout account. Add or verify an account before generating a payment.',
        );
      }

      let total = new Decimal(0);
      for (const order of eligible) {
        total = total.plus(new Decimal(order.driverDeliveryEarning));
      }

      const destinationSnapshot = JSON.stringify({
        method: payoutAccount.method,
        providerName: payoutAccount.providerName,
        accountHolderName: payoutAccount.accountHolderName,
        accountNumber: payoutAccount.accountNumber,
        phoneNumber: payoutAccount.phoneNumber,
        snapshotAt: new Date().toISOString(),
      });

      const payment = await DriverWeeklyPayment.create(
        {
          driverId: dto.driverId,
          periodStart: dto.periodStart,
          periodEnd: dto.periodEnd,
          totalEarning: total.toFixed(2),
          currency: 'ETB',
          status: 'processing',
          payoutAccountId: String(payoutAccount.id),
          destinationSnapshot,
          paymentReference: null,
          generatedByStaffId: staffId,
          paidByStaffId: null,
          paidAt: null,
        },
        { transaction: t },
      );

      for (const order of eligible) {
        await DriverWeeklyPaymentItem.create(
          {
            driverWeeklyPaymentId: String(payment.id),
            orderId: String(order.id),
            earningAmount: new Decimal(order.driverDeliveryEarning).toFixed(2),
          },
          { transaction: t },
        );
      }

      return payment;
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw ApiError.conflict('One or more orders are already included in another driver payment');
    }
    throw error;
  }
}

/**
 * Records that staff completed an off-platform transfer.
 * Status 'processing' is the only payable state created by generate().
 * 'pending' is reserved for a future two-step approval flow and is not used here.
 */
export async function pay(staffId: string, paymentId: string, paymentReference: string) {
  return sequelize.transaction(async (t) => {
    const payment = await DriverWeeklyPayment.findByPk(paymentId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!payment) throw ApiError.notFound('Driver payment not found');
    if (payment.status !== 'processing') {
      throw ApiError.conflict(`Invalid payment state: ${payment.status}. Only processing records can be marked paid.`);
    }

    const items = await DriverWeeklyPaymentItem.findAll({
      where: { driverWeeklyPaymentId: paymentId },
      transaction: t,
    });

    const computed = items.reduce(
      (sum, item) => sum.plus(new Decimal(item.earningAmount)),
      new Decimal(0),
    );

    if (!computed.equals(new Decimal(payment.totalEarning))) {
      throw ApiError.conflict('Stored total does not match item sum — regenerate this payment');
    }

    await payment.update(
      {
        status: 'paid',
        paidByStaffId: staffId,
        paidAt: new Date(),
        paymentReference,
      },
      { transaction: t },
    );

    return payment;
  });
}
