// src/database/migrations/010-customer-payments.ts
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  name: '010-customer-payments',
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable('customer_payments', {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      // BIGINT — matches parent exactly (Issue #1: never INT vs BIGINT mismatch)
      order_id: {
        type: DataTypes.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'orders', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      customer_id: {
        type: DataTypes.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'customers', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      provider:              { type: DataTypes.STRING(100),  allowNull: true }, //null for COD
      provider_transaction_id: { type: DataTypes.STRING(255), allowNull: true },
      payment_reference:     { type: DataTypes.STRING(100), allowNull: true, unique: true },
      // Idempotency: client sends the same key on retries → one payment row, ever
      idempotency_key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      amount:   { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      currency: { type: DataTypes.CHAR(3), allowNull: false, defaultValue: 'ETB' },
      status: {
        type: DataTypes.ENUM('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded', 'partially_refunded'),
        allowNull: false, defaultValue: 'pending',
      },
      paid_at:    { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    // Composite unique: when the provider DOES return a transaction id, the same
    // (provider, transaction) pair can never be recorded twice (webhook dedup).
    await queryInterface.addIndex('customer_payments', ['provider', 'provider_transaction_id'], {
      unique: true, name: 'uq_provider_transaction',
    });
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('customer_payments');
  },
};