// src/database/models/CashHandoverItem.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface CashHandoverItemAttributes {
  id: string;
  cashHandoverId: string;
  cashCollectionId: string;
  amountApplied: string;
  createdAt?: Date;
}
export interface CashHandoverItemCreation extends Optional<CashHandoverItemAttributes, 'id'> {}

export class CashHandoverItem extends Model<CashHandoverItemAttributes, CashHandoverItemCreation>
  implements CashHandoverItemAttributes {
  declare id: string;
  declare cashHandoverId: string;
  declare cashCollectionId: string;
  declare amountApplied: string;
  declare createdAt: Date;
}

CashHandoverItem.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    cashHandoverId:   { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    cashCollectionId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    amountApplied:    { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  },
  { sequelize, tableName: 'cash_handover_items', underscored: true, timestamps: true, updatedAt: false },
);