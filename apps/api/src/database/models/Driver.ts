// src/database/models/Driver.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface DriverAttributes {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  passwordHash: string;
  status: 'active' | 'suspended' | 'inactive';
  isAvailable: boolean;
}
export interface DriverCreation extends Optional<DriverAttributes, 'id' | 'email' | 'isAvailable'> {}

export class Driver extends Model<DriverAttributes, DriverCreation> implements DriverAttributes {
  declare id: string;
  declare fullName: string;
  declare phone: string;
  declare email: string | null;
  declare passwordHash: string;
  declare status: DriverAttributes['status'];
  declare isAvailable: boolean;
}

Driver.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    fullName:     { type: DataTypes.STRING(200), allowNull: false },
    phone:        { type: DataTypes.STRING(30),  allowNull: false, unique: true },
    email:        { type: DataTypes.STRING(255), allowNull: true, unique: true },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
    status:       { type: DataTypes.ENUM('active', 'suspended', 'inactive'), allowNull: false, defaultValue: 'active' },
    isAvailable:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, tableName: 'drivers', underscored: true },
);