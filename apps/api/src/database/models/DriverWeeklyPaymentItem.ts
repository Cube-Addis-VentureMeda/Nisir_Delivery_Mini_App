// src/database/models/DriverWeeklyPaymentItem.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface DriverWeeklyPaymentItemAttributes {
  id: string;
  driverWeeklyPaymentId: string;
  orderId: string; // UNIQUE — one order paid at most once, enforced by DB
  earningAmount: string;
  createdAt?: Date;
}
export interface DriverWeeklyPaymentItemCreation extends Optional<DriverWeeklyPaymentItemAttributes, 'id'> {}

export class DriverWeeklyPaymentItem extends Model<DriverWeeklyPaymentItemAttributes, DriverWeeklyPaymentItemCreation>
  implements DriverWeeklyPaymentItemAttributes {
  declare id: string;
  declare driverWeeklyPaymentId: string;
  declare orderId: string;
  declare earningAmount: string;
  declare createdAt: Date;
}

DriverWeeklyPaymentItem.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    driverWeeklyPaymentId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    orderId: {
      type: DataTypes.BIGINT.UNSIGNED, allowNull: false,
      unique: 'uniq_order_in_weekly_payment',
    },
    earningAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  },
  { sequelize, tableName: 'driver_weekly_payment_items', underscored: true, timestamps: true, updatedAt: false },
);