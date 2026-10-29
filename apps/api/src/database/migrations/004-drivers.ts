// src/database/migrations/004-drivers.ts
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  name: '004-drivers',
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable('drivers', {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      full_name:     { type: DataTypes.STRING(200), allowNull: false },
      phone:         { type: DataTypes.STRING(30),  allowNull: false, unique: true },
      email:         { type: DataTypes.STRING(255), allowNull: true, unique: true },
      password_hash: { type: DataTypes.STRING(255), allowNull: false },
      status: {
        type: DataTypes.ENUM('active', 'suspended', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
      is_available: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('drivers');
  },
};