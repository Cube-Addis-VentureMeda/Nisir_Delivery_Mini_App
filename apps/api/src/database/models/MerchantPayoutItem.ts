// src/database/models/MerchantPayoutItem.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface MerchantPayoutItemAttributes {
  id: string;
  merchantPayoutId: string;
  merchantOrderId: string;
  amountApplied: string;
  createdAt?: Date;
}
export interface MerchantPayoutItemCreation extends Optional<MerchantPayoutItemAttributes, 'id'> {}

export class MerchantPayoutItem extends Model<MerchantPayoutItemAttributes, MerchantPayoutItemCreation>
  implements MerchantPayoutItemAttributes {
  declare id: string;
  declare merchantPayoutId: string;
  declare merchantOrderId: string;
  declare amountApplied: string;
  declare createdAt: Date;
}

MerchantPayoutItem.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    merchantPayoutId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    merchantOrderId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    amountApplied:   { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  },
  {
    sequelize,
    tableName: 'merchant_payout_items',
    underscored: true,
    timestamps: true,
    updatedAt: false,
    indexes: [{ unique: true, fields: ['merchantPayoutId', 'merchantOrderId'], name: 'uq_payout_merchant_order' }],
  },
);