// src/database/migrations/008-merchant-orders.ts
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  name: '008-merchant-orders',
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable('merchant_orders', {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      order_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      merchant_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'merchants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'preparing', 'ready_for_pickup',
                             'collected', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      is_partner_at_order:        { type: DataTypes.BOOLEAN,   allowNull: false },
      restaurant_service_rate:    { type: DataTypes.DECIMAL(5, 4), allowNull: false },  // e.g. 0.0500
      restaurant_service_amount:  { type: DataTypes.DECIMAL(12, 2), allowNull: false },  // 5% of THIS subtotal
      merchant_payable_amount:    { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      // partner:     subtotal − 5%     (e.g. 1000 → 950)
      // non-partner: full subtotal     (customer already paid the 5% on top)

      payout_status: {
        type: DataTypes.STRING(30),   // 'unsettled' | 'settled' — managed ONLY by payouts module
        allowNull: false,
        defaultValue: 'unsettled',
      },
      ready_at:          { type: DataTypes.DATE, allowNull: true },
      cancelled_at:      { type: DataTypes.DATE, allowNull: true },
      cancellation_reason: { type: DataTypes.TEXT, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    await queryInterface.addIndex('merchant_orders', ['order_id']);
    await queryInterface.addIndex('merchant_orders', ['merchant_id']);
    await queryInterface.addIndex('merchant_orders', ['payout_status']);
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('merchant_orders');
  },
};