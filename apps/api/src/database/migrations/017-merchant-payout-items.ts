// src/database/migrations/017-merchant-payout-items.ts
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  name: '017-merchant-payout-items',
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable('merchant_payout_items', {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      merchant_payout_id: {
        type: DataTypes.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'merchant_payouts', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      merchant_order_id: {
        type: DataTypes.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'merchant_orders', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      amount_applied: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    await queryInterface.sequelize.query(`
      ALTER TABLE merchant_payout_items
      ADD CONSTRAINT chk_payout_item_amount_positive CHECK (amount_applied > 0)
    `);
    // Over-settlement (Issue #6) is prevented in the service with row locks + running sums.
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('merchant_payout_items');
  },
};