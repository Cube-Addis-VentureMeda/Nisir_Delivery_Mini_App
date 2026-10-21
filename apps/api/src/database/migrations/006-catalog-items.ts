// src/database/migrations/006-catalog-items.ts
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  name: '006-catalog-items',
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable('catalog_items', {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      merchant_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'merchants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // can't delete a merchant that still has items
      },
      name:          { type: DataTypes.STRING(200),  allowNull: false },
      description:   { type: DataTypes.TEXT,         allowNull: true },
      image_url:     { type: DataTypes.TEXT,         allowNull: true },
      current_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      is_available:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    // Index so "get all items for merchant X" is fast
    await queryInterface.addIndex('catalog_items', ['merchant_id']);
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('catalog_items');
  },
};