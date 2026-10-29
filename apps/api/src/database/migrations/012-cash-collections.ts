// src/database/migrations/012-cash-collections.ts
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  name: '012-cash-collections',
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable('cash_collections', {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      order_id: {
        type: DataTypes.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'orders', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      driver_id: {
        type: DataTypes.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'drivers', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      amount_expected:  { type: DataTypes.DECIMAL(12, 2), allowNull: false }, // order totalAmount at delivery
      amount_collected: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      status: {
        type: DataTypes.ENUM('pending', 'collected', 'partially_handed_over', 'handed_over', 'disputed'),
        allowNull: false, defaultValue: 'pending',
      },
      collected_at:      { type: DataTypes.DATE, allowNull: true },
      discrepancy_note:  { type: DataTypes.TEXT, allowNull: true }, // e.g. "customer paid 10 less"
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex('cash_collections', ['driver_id', 'status']); // "my undeposited cash" query
    await queryInterface.addIndex('cash_collections', ['order_id']);
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('cash_collections');
  },
};