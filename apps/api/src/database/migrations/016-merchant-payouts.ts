// src/database/migrations/016-merchant-payouts.ts 
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  name: '016-merchant-payouts',
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable('merchant_payouts', {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      merchant_id: {
        type: DataTypes.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'merchants', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      payout_account_id: {
        type: DataTypes.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'payout_accounts', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      amount:   { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      currency: { type: DataTypes.CHAR(3), allowNull: false, defaultValue: 'ETB' },
      status: {
        type: DataTypes.ENUM('pending', 'processing', 'paid', 'failed', 'cancelled'),
        allowNull: false, defaultValue: 'pending',
      },
      payment_reference:    { type: DataTypes.STRING(100), allowNull: true, unique: true },
      // Frozen copy of the destination at approval. New payouts always write a snapshot;
      // the service rejects creation without a verified account.
      destination_snapshot: { type: DataTypes.TEXT, allowNull: false },
      approved_by_staff_id: {
        type: DataTypes.BIGINT.UNSIGNED, allowNull: true,
        references: { model: 'staff_users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      paid_by_staff_id: {
        type: DataTypes.BIGINT.UNSIGNED, allowNull: true,
        references: { model: 'staff_users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      approved_at: { type: DataTypes.DATE, allowNull: true },
      paid_at:     { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex('merchant_payouts', ['merchant_id', 'status']);
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('merchant_payouts');
  },
};