// src/database/models/Customer.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface CustomerAttributes {
  id: string;
  telegramUserId: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  status: 'active' | 'suspended' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}
export interface CustomerCreation extends Optional<CustomerAttributes, 'id' | 'status'> {}

export class Customer extends Model<CustomerAttributes, CustomerCreation> implements CustomerAttributes {
  declare id: string;
  declare telegramUserId: string;
  declare firstName: string;
  declare lastName: string | null;
  declare phone: string | null;
  declare status: 'active' | 'suspended' | 'inactive';
  declare createdAt: Date;
  declare updatedAt: Date;
}

Customer.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    telegramUserId: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    firstName: { type: DataTypes.STRING(100), allowNull: false },
    lastName:  { type: DataTypes.STRING(100), allowNull: true },
    phone:     { type: DataTypes.STRING(30),  allowNull: true },
    status:    { type: DataTypes.ENUM('active', 'suspended', 'inactive'), allowNull: false, defaultValue: 'active' },
  },
  { sequelize, tableName: 'customers', underscored: true, timestamps: true },
);