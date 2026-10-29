// src/database/models/CustomerPayment.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded';

export interface CustomerPaymentAttributes {
  id: string;
  orderId: string;
  customerId: string;
  provider: string | null;
  providerTransactionId: string | null;
  paymentReference: string | null;
  idempotencyKey: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  paidAt: Date | null;
  confirmedByStaffId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface CustomerPaymentCreation extends Optional<CustomerPaymentAttributes, 'id'> {}

export class CustomerPayment extends Model<CustomerPaymentAttributes, CustomerPaymentCreation>
  implements CustomerPaymentAttributes {
  declare id: string;
  declare orderId: string;
  declare customerId: string;
  declare provider: string | null;
  declare providerTransactionId: string | null;
  declare paymentReference: string | null;
  declare idempotencyKey: string;
  declare amount: string;
  declare currency: string;
  declare status: PaymentStatus;
  declare paidAt: Date | null;
  declare confirmedByStaffId: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

CustomerPayment.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    orderId:     { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    customerId:  { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    provider:              { type: DataTypes.STRING(100),  allowNull: true },
    providerTransactionId: { type: DataTypes.STRING(255), allowNull: true },
    paymentReference:      { type: DataTypes.STRING(100), allowNull: true, unique: true },
    idempotencyKey:        { type: DataTypes.STRING(100), allowNull: false, unique: true },
    amount:   { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currency: { type: DataTypes.CHAR(3), allowNull: false, defaultValue: 'ETB' },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded', 'partially_refunded'),
      allowNull: false, defaultValue: 'pending',
    },
    paidAt: { type: DataTypes.DATE, allowNull: true },
    confirmedByStaffId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  },
  { sequelize, tableName: 'customer_payments', underscored: true, timestamps: true },
);