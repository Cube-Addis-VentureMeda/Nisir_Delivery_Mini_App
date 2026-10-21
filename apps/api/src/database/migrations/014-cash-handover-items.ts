// src/database/migrations/014-cash-handover-items.ts
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  name: '014-cash-handover-items',
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable('cash_handover_items', {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      cash_handover_id: {
        type: DataTypes.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'cash_handovers', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      cash_collection_id: {
        type: DataTypes.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'cash_collections', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      // How much of THIS collection is being handed over in THIS envelope.
      // Partial allocations allowed (driver deposits some cash, keeps some).
      amount_applied: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    // One collection can appear in many handovers (split deposits) but never twice in the SAME one
    await queryInterface.addIndex('cash_handover_items', ['cash_handover_id', 'cash_collection_id'], {
      unique: true, name: 'uq_handover_collection_line',
    });
    // Over-allocation defense is a SERVICE-layer running-balance check (Issue #5):
    // lock collection → sum allocated → reject if exceeding. Add the positivity net:
    await queryInterface.sequelize.query(`
      ALTER TABLE cash_handover_items
      ADD CONSTRAINT chk_amount_applied_positive CHECK (amount_applied > 0)
    `);
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('cash_handover_items');
  },
};