// src/database/models/MerchantPayout.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export type FinancialStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';

export interface MerchantPayoutAttributes {
  id: string;
  merchantId: string;
  payoutAccountId: string;
  amount: string;
  currency: string;
  status: FinancialStatus;
  paymentReference: string | null;
  destinationSnapshot: string | null; // JSON string, frozen at approval
  approvedByStaffId: string | null;
  paidByStaffId: string | null;
  approvedAt: Date | null;
  paidAt: Date | null;
}
export interface MerchantPayoutCreation extends Optional<MerchantPayoutAttributes, 'id'> {}

export class MerchantPayout extends Model<MerchantPayoutAttributes, MerchantPayoutCreation>
  implements MerchantPayoutAttributes {
  declare id: string;
  declare merchantId: string;
  declare payoutAccountId: string;
  declare amount: string;
  declare currency: string;
  declare status: FinancialStatus;
  declare paymentReference: string | null;
  declare destinationSnapshot: string | null;
  declare approvedByStaffId: string | null;
  declare paidByStaffId: string | null;
  declare approvedAt: Date | null;
  declare paidAt: Date | null;
}

MerchantPayout.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    merchantId:        { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    payoutAccountId:   { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    amount:   { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currency: { type: DataTypes.CHAR(3), allowNull: false, defaultValue: 'ETB' },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'paid', 'failed', 'cancelled'),
      allowNull: false, defaultValue: 'pending',
    },
    paymentReference:    { type: DataTypes.STRING(100), allowNull: true, unique: true },
    destinationSnapshot: { type: DataTypes.TEXT, allowNull: true },
    approvedByStaffId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    paidByStaffId:     { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    approvedAt: { type: DataTypes.DATE, allowNull: true },
    paidAt:     { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, tableName: 'merchant_payouts', underscored: true },
);