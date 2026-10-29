import Decimal from 'decimal.js';
import { Op, UniqueConstraintError } from 'sequelize';
import { sequelize } from '../../config/database';
import { Merchant, MerchantOrder, PayoutAccount, MerchantPayout, MerchantPayoutItem } from '../../database/models';
import { ApiError } from '../../utils/ApiError';

const ACTIVE_PAYOUT_STATUSES = ['pending', 'processing', 'paid'] as const;

async function settledAmountForOrder(merchantOrderId: string, transaction: unknown) {
  const items = await MerchantPayoutItem.findAll({
    where: { merchantOrderId },
    include: [
      {
        model: MerchantPayout,
        as: 'payout',
        required: true,
        where: { status: { [Op.in]: [...ACTIVE_PAYOUT_STATUSES] } },
      },
    ],
    transaction: transaction as never,
  });
  return items.reduce((sum, item) => sum.plus(new Decimal(item.amountApplied)), new Decimal(0));
}

async function outstandingForOrder(mo: MerchantOrder, transaction: unknown) {
  const settled = await settledAmountForOrder(String(mo.id), transaction);
  return new Decimal(mo.merchantPayableAmount).minus(settled);
}

// Eligibility: collected AND still has outstanding against successful/in-flight payouts.
// Failed/cancelled payouts do not consume the balance.
export async function listUnsettledOrders(merchantId: string) {
  const orders = await MerchantOrder.findAll({
    where: { merchantId, status: 'collected' },
    order: [['created_at', 'ASC']],
    limit: 200,
  });

  const unsettled: MerchantOrder[] = [];
  for (const mo of orders) {
    const outstanding = await outstandingForOrder(mo, undefined);
    if (outstanding.gt(0)) unsettled.push(mo);
  }
  return unsettled;
}

export async function createPayout(
  staffId: string,
  dto: { merchantId: string; payoutAccountId: string; merchantOrderIds: string[] },
) {
  const merchantOrderIds = [...new Set(dto.merchantOrderIds)];
  if (merchantOrderIds.length !== dto.merchantOrderIds.length) {
    throw ApiError.unprocessable('Duplicate merchant order IDs are not allowed');
  }

  try {
    return await sequelize.transaction(async (t) => {
      const merchant = await Merchant.findByPk(dto.merchantId, { transaction: t });
      if (!merchant) throw ApiError.notFound('Merchant not found');
      // Suspended merchants can still be paid for orders already collected.

      const account = await PayoutAccount.findByPk(dto.payoutAccountId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!account || String(account.merchantId) !== dto.merchantId) {
        throw ApiError.unprocessable('Payout account does not belong to this merchant');
      }
      if (account.status !== 'verified') {
        throw ApiError.conflict('Payout account is not verified yet');
      }

      let total = new Decimal(0);
      const settlements: { mo: MerchantOrder; amount: Decimal }[] = [];

      for (const moId of merchantOrderIds) {
        const mo = await MerchantOrder.findOne({
          where: { id: moId, merchantId: dto.merchantId },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!mo) throw ApiError.notFound(`Merchant order ${moId} not found`);
        if (mo.status !== 'collected') {
          throw ApiError.conflict(`Merchant order ${moId} is not eligible (status=${mo.status})`);
        }

        const outstanding = await outstandingForOrder(mo, t);
        if (outstanding.lte(0)) {
          throw ApiError.conflict(`Merchant order ${moId} is already fully settled`);
        }
        settlements.push({ mo, amount: outstanding });
        total = total.plus(outstanding);
      }

      const payout = await MerchantPayout.create(
        {
          merchantId: dto.merchantId,
          payoutAccountId: account.id,
          amount: total.toFixed(2),
          currency: 'ETB',
          status: 'processing',
          destinationSnapshot: JSON.stringify({
            method: account.method,
            providerName: account.providerName,
            accountHolderName: account.accountHolderName,
            accountNumber: account.accountNumber,
            phoneNumber: account.phoneNumber,
            snapshotAt: new Date().toISOString(),
          }),
          approvedByStaffId: staffId,
          approvedAt: new Date(),
        },
        { transaction: t },
      );

      for (const { mo, amount } of settlements) {
        await MerchantPayoutItem.create(
          {
            merchantPayoutId: String(payout.id),
            merchantOrderId: String(mo.id),
            amountApplied: amount.toFixed(2),
          },
          { transaction: t },
        );
        await mo.update({ payoutStatus: 'settled' }, { transaction: t });
      }
      return payout;
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw ApiError.conflict('One or more orders are already included in this payout');
    }
    throw error;
  }
}

/**
 * Records that staff sent the money outside the system. Does not execute a bank transfer.
 */
export async function markPaid(staffId: string, payoutId: string, paymentReference: string) {
  return sequelize.transaction(async (t) => {
    const payout = await MerchantPayout.findByPk(payoutId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!payout) throw ApiError.notFound('Payout not found');
    if (payout.status !== 'processing') {
      throw ApiError.conflict(`Payout is ${payout.status}; only 'processing' payouts can be marked paid`);
    }
    await payout.update(
      { status: 'paid', paidByStaffId: staffId, paidAt: new Date(), paymentReference },
      { transaction: t },
    );
    return payout;
  });
}

/**
 * Cancels a processing payout and restores remaining outstanding on its orders
 * so they can be paid again. Paid payouts cannot be cancelled here.
 */
export async function cancelPayout(_staffId: string, payoutId: string) {
  return sequelize.transaction(async (t) => {
    const payout = await MerchantPayout.findByPk(payoutId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!payout) throw ApiError.notFound('Payout not found');
    if (payout.status !== 'processing') {
      throw ApiError.conflict(`Payout is ${payout.status}; only processing payouts can be cancelled`);
    }

    await payout.update({ status: 'cancelled' }, { transaction: t });

    const items = await MerchantPayoutItem.findAll({
      where: { merchantPayoutId: payout.id },
      transaction: t,
    });

    for (const item of items) {
      const mo = await MerchantOrder.findByPk(item.merchantOrderId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!mo) continue;
      const outstanding = await outstandingForOrder(mo, t);
      await mo.update(
        { payoutStatus: outstanding.gt(0) ? 'unsettled' : 'settled' },
        { transaction: t },
      );
    }

    return payout;
  });
}

export async function getBalance(merchantId: string) {
  const rows = await MerchantOrder.findAll({
    where: { merchantId, status: 'collected' },
    attributes: ['id', 'merchantPayableAmount'],
  });
  let total = new Decimal(0);
  let unsettledOrders = 0;
  for (const row of rows) {
    const outstanding = await outstandingForOrder(row, undefined);
    if (outstanding.gt(0)) {
      total = total.plus(outstanding);
      unsettledOrders += 1;
    }
  }
  return { merchantId, outstandingPayable: total.toFixed(2), unsettledOrders };
}
