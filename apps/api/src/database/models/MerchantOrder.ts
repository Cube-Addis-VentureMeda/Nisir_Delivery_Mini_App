// src/database/models/MerchantOrder.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface MerchantOrderAttributes {
  id: string;
  orderId: string;
  merchantId: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'collected' | 'cancelled';
  subtotal: string;
  isPartnerAtOrder: boolean;
  restaurantServiceRate: string;
  restaurantServiceAmount: string;
  merchantPayableAmount: string;
  payoutStatus: string;
}
export interface MerchantOrderCreation extends Optional<MerchantOrderAttributes, 'id'> {}

export class MerchantOrder extends Model<MerchantOrderAttributes, MerchantOrderCreation>
  implements MerchantOrderAttributes
{
  declare id: string;
  declare orderId: string;
  declare merchantId: string;
  declare status: MerchantOrderAttributes['status'];
  declare subtotal: string;
  declare isPartnerAtOrder: boolean;
  declare restaurantServiceRate: string;
  declare restaurantServiceAmount: string;
  declare merchantPayableAmount: string;
  declare payoutStatus: string;
}

MerchantOrder.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    orderId:    { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    merchantId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'preparing', 'ready_for_pickup', 'collected', 'cancelled'),
      allowNull: false, defaultValue: 'pending',
    },
    subtotal:                 { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    isPartnerAtOrder:         { type: DataTypes.BOOLEAN,   allowNull: false },
    restaurantServiceRate:    { type: DataTypes.DECIMAL(5, 4),  allowNull: false },
    restaurantServiceAmount:  { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    merchantPayableAmount:    { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    payoutStatus:             { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'unsettled' },
  },
  { sequelize, tableName: 'merchant_orders', underscored: true },
);