// src/database/migrations/018-driver-weekly-payments.ts
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  name: '018-driver-weekly-payments',
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable('driver_weekly_payments', {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      driver_id: {
        type: DataTypes.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'drivers', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      period_start: { type: DataTypes.DATEONLY, allowNull: false }, // Monday
      period_end:   { type: DataTypes.DATEONLY, allowNull: false }, // Sunday
      total_earning: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      currency: { type: DataTypes.CHAR(3), allowNull: false, defaultValue: 'ETB' },
      status: {
        type: DataTypes.ENUM('pending', 'processing', 'paid', 'failed', 'cancelled'),
        allowNull: false, defaultValue: 'pending',
      },
      payout_account_id: {
        type: DataTypes.BIGINT.UNSIGNED, allowNull: true,
        references: { model: 'payout_accounts', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      payment_reference:    { type: DataTypes.STRING(100), allowNull: true, unique: true },
      destination_snapshot: { type: DataTypes.TEXT, allowNull: true },
      generated_by_staff_id: {
        type: DataTypes.BIGINT.UNSIGNED, allowNull: true,
        references: { model: 'staff_users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      paid_by_staff_id: {
        type: DataTypes.BIGINT.UNSIGNED, allowNull: true,
        references: { model: 'staff_users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      paid_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex('driver_weekly_payments', ['driver_id', 'period_start']);
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('driver_weekly_payments');
  },
};