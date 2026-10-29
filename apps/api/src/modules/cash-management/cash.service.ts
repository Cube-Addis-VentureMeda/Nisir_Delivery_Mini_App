// src/modules/cash-management/cash.service.ts
import Decimal from 'decimal.js';
import { Op } from 'sequelize';
import { sequelize } from '../../config/database';
import { CashCollection, CashHandover, CashHandoverItem } from '../../database/models';
import { ApiError } from '../../utils/ApiError';

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export async function listPendingCollections(driverId: string, options?: PaginationOptions) {
  const limit = Math.min(options?.limit ?? 50, 100);
  const offset = options?.offset ?? 0;

  return CashCollection.findAll({
    where: { driverId, status: { [Op.in]: ['collected', 'partially_handed_over'] } },
    attributes: ['id', 'orderId', 'driverId', 'amountCollected', 'currency', 'status', 'collectedAt'],
    order: [['collected_at', 'ASC']],
    limit,
    offset,
  });
}

export async function listHandovers(driverId: string, options?: PaginationOptions) {
  const limit = Math.min(options?.limit ?? 50, 100);
  const offset = options?.offset ?? 0;

  return CashHandover.findAll({
    where: { driverId },
    attributes: [
      'id',
      'driverId',
      'receivedByStaffId',
      'amountDeclared',
      'amountVerified',
      'status',
      'submittedAt',
      'verifiedAt',
      'notes',
    ],
    include: [
      {
        model: CashHandoverItem,
        as: 'items',
        attributes: ['id', 'cashCollectionId', 'amountApplied', 'createdAt'],
      },
    ],
    order: [['submitted_at', 'DESC']],
    limit,
    offset,
  });
}

export async function createHandover(driverId: string, items: { cashCollectionId: string; amountApplied: string }[]) {
  return sequelize.transaction(async (t) => {
    let declared = new Decimal(0);
    const validatedItems: { collection: CashCollection; applying: Decimal }[] = [];

    // Step 1: Pre-validate all collection items and check allocations
    for (const item of items) {
      // LOCK the collection row: two concurrent handovers can't over-allocate the same cash
      const collection = await CashCollection.findByPk(item.cashCollectionId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!collection) throw ApiError.notFound(`Cash collection ${item.cashCollectionId} not found`);
      if (String(collection.driverId) !== String(driverId)) {
        throw ApiError.forbidden('This collection belongs to another driver');
      }

      const collected = new Decimal(collection.amountCollected);

      // Only count allocations from active (submitted or verified) handovers — ignore rejected
      const activeHandoverItems = await CashHandoverItem.findAll({
        where: { cashCollectionId: collection.id },
        include: [
          {
            model: CashHandover,
            as: 'handover',
            where: { status: { [Op.in]: ['submitted', 'verified'] } },
            required: true,
          },
        ],
        transaction: t,
      });

      const allocated = activeHandoverItems.reduce(
        (sum, hi) => sum.plus(new Decimal(hi.amountApplied)),
        new Decimal(0),
      );
      const remaining = collected.minus(allocated);
      const applying = new Decimal(item.amountApplied);

      if (applying.lte(0) || applying.gt(remaining)) {
        throw ApiError.unprocessable(
          `Collection ${collection.id}: only ETB ${remaining.toFixed(2)} remaining, ETB ${applying.toFixed(2)} requested`,
        );
      }

      validatedItems.push({ collection, applying });
      declared = declared.plus(applying);
    }

    // Step 2: Create parent CashHandover record with real data (no dummy staff ID or fake verified amount)
    const handover = await CashHandover.create(
      {
        driverId,
        receivedByStaffId: null,
        amountDeclared: declared.toFixed(2),
        amountVerified: null,
        status: 'submitted',
      },
      { transaction: t },
    );

    // Step 3: Insert CashHandoverItems referencing the valid parent handover.id
    for (const { collection, applying } of validatedItems) {
      await CashHandoverItem.create(
        {
          cashHandoverId: String(handover.id),
          cashCollectionId: String(collection.id),
          amountApplied: applying.toFixed(2),
        },
        { transaction: t },
      );

      // Step 4: Update collection status (fully allocated → handed_over, else partial)
      const totalAllocatedNow = (
        await CashHandoverItem.findAll({
          where: { cashCollectionId: collection.id },
          include: [
            {
              model: CashHandover,
              as: 'handover',
              where: { status: { [Op.in]: ['submitted', 'verified'] } },
              required: true,
            },
          ],
          transaction: t,
        })
      ).reduce((sum, hi) => sum.plus(new Decimal(hi.amountApplied)), new Decimal(0));

      const collected = new Decimal(collection.amountCollected);
      await collection.update(
        { status: totalAllocatedNow.gte(collected) ? 'handed_over' : 'partially_handed_over' },
        { transaction: t },
      );
    }

    return handover;
  });
}

export async function verifyHandover(staffId: string, handoverId: string, amountVerified: string, notes?: string) {
  return sequelize.transaction(async (t) => {
    const handover = await CashHandover.findByPk(handoverId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!handover) throw ApiError.notFound('Handover not found');
    if (handover.status !== 'submitted') {
      throw ApiError.conflict(`Handover is already ${handover.status}`);
    }

    const verified = new Decimal(amountVerified);
    const declared = new Decimal(handover.amountDeclared);
    const matches = verified.equals(declared);
    const finalStatus = matches ? 'verified' : 'rejected';
    // Rejected handovers restore collection remaining balances below so the same
    // cash can be included in a new handover. Do not treat a rejected envelope as settled.

    await handover.update(
      {
        receivedByStaffId: staffId,
        amountVerified: verified.toFixed(2),
        status: finalStatus,
        verifiedAt: new Date(),
        notes: notes ?? (matches ? null : `Discrepancy: declared ETB ${declared.toFixed(2)} but counted ETB ${verified.toFixed(2)}`),
      },
      { transaction: t },
    );

    // If handover was rejected, reconcile collection statuses back to active state so the cash is not locked
    if (!matches) {
      const handoverItems = await CashHandoverItem.findAll({
        where: { cashHandoverId: handover.id },
        transaction: t,
      });

      for (const item of handoverItems) {
        const col = await CashCollection.findByPk(item.cashCollectionId, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (col) {
          const activeAllocations = (
            await CashHandoverItem.findAll({
              where: {
                cashCollectionId: col.id,
                cashHandoverId: { [Op.ne]: handover.id },
              },
              include: [
                {
                  model: CashHandover,
                  as: 'handover',
                  where: { status: { [Op.in]: ['submitted', 'verified'] } },
                  required: true,
                },
              ],
              transaction: t,
            })
          ).reduce((s, i) => s.plus(new Decimal(i.amountApplied)), new Decimal(0));

          const collected = new Decimal(col.amountCollected);
          const restoredStatus = activeAllocations.gte(collected)
            ? 'handed_over'
            : activeAllocations.gt(0)
            ? 'partially_handed_over'
            : 'collected';

          await col.update({ status: restoredStatus }, { transaction: t });
        }
      }
    }

    return handover;
  });
}