// src/database/migrations/002-customers.ts
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  name: '002-customers',
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable('customers', {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      telegram_user_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      first_name: { type: DataTypes.STRING(100), allowNull: false },
      last_name:  { type: DataTypes.STRING(100), allowNull: true },
      phone:      { type: DataTypes.STRING(30),  allowNull: true },
      // ENUMs in Sequelize/MySQL: string column with limited allowed values
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
    await queryInterface.dropTable('customers');
  },
};