// src/database/models/StaffUser.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface StaffUserAttributes {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'operations' | 'finance';
  status: 'active' | 'suspended' | 'inactive';
}
export interface StaffUserCreation extends Optional<StaffUserAttributes, 'id'> {}

export class StaffUser extends Model<StaffUserAttributes, StaffUserCreation> implements StaffUserAttributes {
  declare id: string;
  declare fullName: string;
  declare email: string;
  declare passwordHash: string;
  declare role: StaffUserAttributes['role'];
  declare status: StaffUserAttributes['status'];
}

StaffUser.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    fullName:     { type: DataTypes.STRING(200), allowNull: false },
    email:        { type: DataTypes.STRING(255), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
    role:   { type: DataTypes.ENUM('admin', 'operations', 'finance'), allowNull: false },
    status: { type: DataTypes.ENUM('active', 'suspended', 'inactive'), allowNull: false, defaultValue: 'active' },
  },
  { sequelize, tableName: 'staff_users', underscored: true },
);