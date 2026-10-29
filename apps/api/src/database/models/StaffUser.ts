// src/database/models/StaffUser.ts
import bcrypt from 'bcryptjs';
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface StaffUserAttributes {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'finance';
  status: 'active' | 'suspended' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}
export interface StaffUserCreation extends Optional<StaffUserAttributes, 'id'> {}

export class StaffUser extends Model<StaffUserAttributes, StaffUserCreation> implements StaffUserAttributes {
  declare id: string;
  declare fullName: string;
  declare email: string;
  declare passwordHash: string;
  declare role: StaffUserAttributes['role'];
  declare status: StaffUserAttributes['status'];
  declare createdAt: Date;
  declare updatedAt: Date;
}

StaffUser.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    fullName:     { type: DataTypes.STRING(200), allowNull: false },
    email:        { type: DataTypes.STRING(255), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
    role:         { type: DataTypes.ENUM('admin', 'finance'), allowNull: false },
    status:       { type: DataTypes.ENUM('active', 'suspended', 'inactive'), allowNull: false, defaultValue: 'active' },
  },
  { sequelize, tableName: 'staff_users', underscored: true, timestamps: true },
);

function looksHashed(value: string) {
  return value.startsWith('$2a$') || value.startsWith('$2b$') || value.startsWith('$2y$');
}

StaffUser.addHook('beforeValidate', (staff: StaffUser) => {
  if (staff.email) staff.email = staff.email.trim().toLowerCase();
});

StaffUser.addHook('beforeCreate', async (staff: StaffUser) => {
  if (staff.passwordHash && !looksHashed(staff.passwordHash)) {
    staff.passwordHash = await bcrypt.hash(staff.passwordHash, 10);
  }
});

StaffUser.addHook('beforeUpdate', async (staff: StaffUser) => {
  if (staff.changed('passwordHash') && staff.passwordHash && !looksHashed(staff.passwordHash)) {
    staff.passwordHash = await bcrypt.hash(staff.passwordHash, 10);
  }
});