// src/database/models/CashCollection.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface CashCollectionAttributes {
  id: string;
  orderId: string;
  driverId: string;
  amountExpected: string;
  amountCollected: string;
  status: 'pending' | 'collected' | 'partially_handed_over' | 'handed_over' | 'disputed';
  collectedAt: Date | null;
  discrepancyNote: string | null;
}
export interface CashCollectionCreation extends Optional<CashCollectionAttributes, 'id'> {}

export class CashCollection extends Model<CashCollectionAttributes, CashCollectionCreation>
  implements CashCollectionAttributes {
  declare id: string;
  declare orderId: string;
  declare driverId: string;
  declare amountExpected: string;
  declare amountCollected: string;
  declare status: CashCollectionAttributes['status'];
  declare collectedAt: Date | null;
  declare discrepancyNote: string | null;
}

CashCollection.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    orderId:         { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    driverId:        { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    amountExpected:  { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    amountCollected: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'collected', 'partially_handed_over', 'handed_over', 'disputed'),
      allowNull: false, defaultValue: 'pending',
    },
    collectedAt:     { type: DataTypes.DATE, allowNull: true },
    discrepancyNote: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, tableName: 'cash_collections', underscored: true },
);