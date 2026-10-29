// src/database/migrations/003-staff-users.ts
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  name: '003-staff-users',
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable('staff_users', {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      full_name:     { type: DataTypes.STRING(200), allowNull: false },
      email:         { type: DataTypes.STRING(255), allowNull: false, unique: true },
      password_hash: { type: DataTypes.STRING(255), allowNull: false }, 
      role: {
        type: DataTypes.ENUM('admin', 'operations', 'finance'),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('active', 'suspended', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('staff_users');
  },
};