// src/database/migrations/021-payment-method-and-idempotency.ts
import { QueryInterface } from 'sequelize';

export default {
  name: '021-payment-method-and-idempotency',
  async up(queryInterface: QueryInterface) {
    // Bank transfer is a manual payment method: order + pending payment row,
    // finance confirms later. 'online' stays reserved for the Phase 8 provider integration.
    await queryInterface.sequelize.query(`
      ALTER TABLE orders
      MODIFY payment_method ENUM('cod', 'online', 'bank_transfer') NOT NULL
    `);
    // Replaying the same checkout (network retry / double tap) returns the original
    // order instead of creating a duplicate. Unique index = the enforcement.
    await queryInterface.addColumn('orders', 'idempotency_key', {
      type: (await import('sequelize')).DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    });
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn('orders', 'idempotency_key');
    await queryInterface.sequelize.query(`
      ALTER TABLE orders MODIFY payment_method ENUM('cod', 'online') NOT NULL
    `);
  },
};