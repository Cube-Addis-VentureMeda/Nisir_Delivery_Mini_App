// src/database/models/PayoutAccount.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface PayoutAccountAttributes {
  id: string;
  merchantId: string | null;
  driverId: string | null;
  method: 'bank_transfer' | 'telebirr';
  providerName: string | null;
  accountHolderName: string;
  accountNumber: string | null;
  phoneNumber: string | null;
  isDefault: boolean;
  status: 'pending_verification' | 'verified' | 'disabled';
  verifiedAt: Date | null;
}
export interface PayoutAccountCreation extends Optional<PayoutAccountAttributes, 'id'> {}

export class PayoutAccount extends Model<PayoutAccountAttributes, PayoutAccountCreation>
  implements PayoutAccountAttributes {
  declare id: string;
  declare merchantId: string | null;
  declare driverId: string | null;
  declare method: PayoutAccountAttributes['method'];
  declare providerName: string | null;
  declare accountHolderName: string;
  declare accountNumber: string | null;
  declare phoneNumber: string | null;
  declare isDefault: boolean;
  declare status: PayoutAccountAttributes['status'];
  declare verifiedAt: Date | null;
}

PayoutAccount.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    merchantId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    driverId:   { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    method: {
      type: DataTypes.ENUM('bank_transfer', 'telebirr'),
      allowNull: false,
    },
    providerName:      { type: DataTypes.STRING(100), allowNull: true },
    accountHolderName: { type: DataTypes.STRING(200), allowNull: false },
    accountNumber:     { type: DataTypes.STRING(100), allowNull: true },
    phoneNumber:       { type: DataTypes.STRING(30),  allowNull: true },
    isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    status: {
      type: DataTypes.ENUM('pending_verification', 'verified', 'disabled'),
      allowNull: false, defaultValue: 'pending_verification',
    },
    verifiedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, tableName: 'payout_accounts', underscored: true },
);