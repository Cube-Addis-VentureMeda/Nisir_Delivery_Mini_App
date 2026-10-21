// src/database/models/CatalogItem.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface CatalogItemAttributes {
  id: string;
  merchantId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  currentPrice: string;
  isAvailable: boolean;
}
export interface CatalogItemCreation extends Optional<CatalogItemAttributes, 'id'> {}

export class CatalogItem extends Model<CatalogItemAttributes, CatalogItemCreation> implements CatalogItemAttributes {
  declare id: string;
  declare merchantId: string;
  declare name: string;
  declare description: string | null;
  declare imageUrl: string | null;
  declare currentPrice: string;
  declare isAvailable: boolean;
}

CatalogItem.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    merchantId:   { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    name:         { type: DataTypes.STRING(200), allowNull: false },
    description:  { type: DataTypes.TEXT, allowNull: true },
    imageUrl:     { type: DataTypes.TEXT, allowNull: true },
    currentPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    isAvailable:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, tableName: 'catalog_items', underscored: true },
);