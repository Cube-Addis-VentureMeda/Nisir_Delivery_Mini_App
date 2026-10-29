// src/database/models/DriverWeeklyPayment.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
import { FinancialStatus } from './MerchantPayout';

export interface DriverWeeklyPaymentAttributes {
  id: string;
  driverId: string;
  periodStart: string; // DATEONLY
  periodEnd: string;
  totalEarning: string;
  currency: string;
  status: FinancialStatus;
  payoutAccountId: string | null;
  paymentReference: string | null;
  destinationSnapshot: string | null;
  generatedByStaffId: string | null;
  paidByStaffId: string | null;
  paidAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface DriverWeeklyPaymentCreation extends Optional<DriverWeeklyPaymentAttributes, 'id'> {}

export class DriverWeeklyPayment extends Model<DriverWeeklyPaymentAttributes, DriverWeeklyPaymentCreation>
  implements DriverWeeklyPaymentAttributes {
  declare id: string;
  declare driverId: string;
  declare periodStart: string;
  declare periodEnd: string;
  declare totalEarning: string;
  declare currency: string;
  declare status: FinancialStatus;
  declare payoutAccountId: string | null;
  declare paymentReference: string | null;
  declare destinationSnapshot: string | null;
  declare generatedByStaffId: string | null;
  declare paidByStaffId: string | null;
  declare paidAt: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

DriverWeeklyPayment.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    driverId:        { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    periodStart:     { type: DataTypes.DATEONLY, allowNull: false },
    periodEnd:       { type: DataTypes.DATEONLY, allowNull: false },
    totalEarning:    { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currency:        { type: DataTypes.CHAR(3), allowNull: false, defaultValue: 'ETB' },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'paid', 'failed', 'cancelled'),
      allowNull: false, defaultValue: 'pending',
    },
    payoutAccountId:     { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    paymentReference:    { type: DataTypes.STRING(100), allowNull: true, unique: true },
    destinationSnapshot: { type: DataTypes.TEXT, allowNull: true },
    generatedByStaffId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    paidByStaffId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    paidAt:        { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, tableName: 'driver_weekly_payments', underscored: true, timestamps: true },
);