// src/database/models/Merchant.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface MerchantAttributes {
  id: string;
  name: string;
  merchantType: 'restaurant' | 'store';
  storeType: 'supermarket' | 'grocery' | 'convenience_store' | 'other' | null;
  description: string | null;
  phone: string | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  status: 'pending' | 'active' | 'suspended' | 'inactive';
  isPartner: boolean;        // ← THE flag that drives fee logic
  partnerSince: Date | null;
}
export interface MerchantCreation extends Optional<MerchantAttributes, 'id'> {}

export class Merchant extends Model<MerchantAttributes, MerchantCreation> implements MerchantAttributes {
  declare id: string;
  declare name: string;
  declare merchantType: 'restaurant' | 'store';
  declare storeType: MerchantAttributes['storeType'];
  declare description: string | null;
  declare phone: string | null;
  declare address: string | null;
  declare latitude: string | null;
  declare longitude: string | null;
  declare status: MerchantAttributes['status'];
  declare isPartner: boolean;
  declare partnerSince: Date | null;
}

Merchant.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    merchantType: { type: DataTypes.ENUM('restaurant', 'store'), allowNull: false },
    storeType:    { type: DataTypes.ENUM('supermarket', 'grocery', 'convenience_store', 'other'), allowNull: true },
    description:  { type: DataTypes.TEXT, allowNull: true },
    phone:        { type: DataTypes.STRING(30), allowNull: true },
    address:      { type: DataTypes.TEXT, allowNull: true },
    latitude:     { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    longitude:    { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    status:       { type: DataTypes.ENUM('pending', 'active', 'suspended', 'inactive'), allowNull: false, defaultValue: 'pending' },
    isPartner:    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    partnerSince: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, tableName: 'merchants', underscored: true },
);