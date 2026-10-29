// src/database/migrations/005-merchants.ts
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  name: '005-merchants',
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable('merchants', {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name:     { type: DataTypes.STRING(200), allowNull: false },
      merchant_type: {
        type: DataTypes.ENUM('restaurant', 'store'),
        allowNull: false,
      },
      store_type: {  // only meaningful when merchant_type = 'store'
        type: DataTypes.ENUM('supermarket', 'grocery', 'convenience_store', 'other'),
        allowNull: true,
      },
      description: { type: DataTypes.TEXT, allowNull: true },
      phone:       { type: DataTypes.STRING(30), allowNull: true },
      address:     { type: DataTypes.TEXT, allowNull: true },
      latitude:    { type: DataTypes.DECIMAL(10, 7), allowNull: true },
      longitude:   { type: DataTypes.DECIMAL(10, 7), allowNull: true },
      status: {
        type: DataTypes.ENUM('pending', 'active', 'suspended', 'inactive'),
        allowNull: false,
        defaultValue: 'pending',
      },
      is_partner:   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      partner_since:{ type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('merchants');
  },
};