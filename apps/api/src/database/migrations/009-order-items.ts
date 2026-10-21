// src/database/migrations/009-order-items.ts
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  name: '009-order-items',
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable('order_items', {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      merchant_order_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'merchant_orders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      // NULLABLE on purpose: menu item may be deleted AFTER orders exist.
      // The SNAPSHOT (item_name, unit_price below) must survive the deletion.
      catalog_item_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'catalog_items', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      item_name:  { type: DataTypes.STRING(200),   allowNull: false }, // SNAPSHOT of catalog name
      unit_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false }, // SNAPSHOT of price at purchase
      quantity:   { type: DataTypes.INTEGER,        allowNull: false },
      line_total: { type: DataTypes.DECIMAL(12, 2), allowNull: false }, // unit_price × quantity
      company_food_fee: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      instructions: { type: DataTypes.TEXT, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex('order_items', ['merchant_order_id']);
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('order_items');
  },
};