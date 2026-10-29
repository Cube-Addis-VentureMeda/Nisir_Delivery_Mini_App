// src/database/models/PaymentRefund.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface PaymentRefundAttributes {
  id: string;
  customerPaymentId: string;
  providerRefundId: string | null;
  amount: string;
  status: string;
  reason: string | null;
  completedAt: Date | null;
  createdAt?: Date;
}
export interface PaymentRefundCreation extends Optional<PaymentRefundAttributes, 'id'> {}

export class PaymentRefund extends Model<PaymentRefundAttributes, PaymentRefundCreation>
  implements PaymentRefundAttributes {
  declare id: string;
  declare customerPaymentId: string;
  declare providerRefundId: string | null;
  declare amount: string;
  declare status: string;
  declare reason: string | null;
  declare completedAt: Date | null;
  declare createdAt: Date;
}

PaymentRefund.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    customerPaymentId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    providerRefundId:  { type: DataTypes.STRING(255), allowNull: true },
    amount:   { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    status:   { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'pending' },
    reason:   { type: DataTypes.TEXT, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, tableName: 'payment_refunds', underscored: true, timestamps: true, updatedAt: false },
);