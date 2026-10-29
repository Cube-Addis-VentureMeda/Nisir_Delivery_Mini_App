// src/database/migrations/013-cash-handovers.ts
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  name: '013-cash-handovers',
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable('cash_handovers', {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      driver_id: {
        type: DataTypes.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'drivers', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      received_by_staff_id: {
        type: DataTypes.BIGINT.UNSIGNED, allowNull: true,
        references: { model: 'staff_users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      amount_declared: { type: DataTypes.DECIMAL(12, 2), allowNull: false }, // driver says "I have X"
      amount_verified: { type: DataTypes.DECIMAL(12, 2), allowNull: true }, // staff counts and confirms on verification
      status: {
        type: DataTypes.ENUM('submitted', 'verified', 'rejected'),
        allowNull: false, defaultValue: 'submitted',
      },
      submitted_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      verified_at:  { type: DataTypes.DATE, allowNull: true },
      notes:        { type: DataTypes.TEXT, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex('cash_handovers', ['driver_id']);
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('cash_handovers');
  },
};