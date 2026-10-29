// src/database/migrations/011-payment-refunds.ts
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  name: '011-payment-refunds',
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable('payment_refunds', {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      customer_payment_id: {
        type: DataTypes.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'customer_payments', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      provider_refund_id: { type: DataTypes.STRING(255), allowNull: true },
      amount:   { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      status:   { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'pending' },
      reason:   { type: DataTypes.TEXT, allowNull: true },
      completed_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex('payment_refunds', ['customer_payment_id']);
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('payment_refunds');
  },
};