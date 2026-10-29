// src/database/migrations/019-driver-weekly-payment-items.ts
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  name: '019-driver-weekly-payment-items',
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable('driver_weekly_payment_items', {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      driver_weekly_payment_id: {
        type: DataTypes.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'driver_weekly_payments', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      order_id: {
        type: DataTypes.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'orders', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      earning_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    await queryInterface.addIndex('driver_weekly_payment_items', ['order_id'], {
      unique: true,
      name: 'uniq_order_in_weekly_payment',
    });
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('driver_weekly_payment_items');
  },
};