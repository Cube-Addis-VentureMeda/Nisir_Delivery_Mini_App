// src/database/models/CashHandover.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface CashHandoverAttributes {
  id: string;
  driverId: string;
  receivedByStaffId: string;
  amountDeclared: string;
  amountVerified: string;
  status: 'submitted' | 'verified' | 'rejected';
  submittedAt: Date;
  verifiedAt: Date | null;
  notes: string | null;
}
export interface CashHandoverCreation extends Optional<CashHandoverAttributes, 'id' | 'submittedAt'> {}

export class CashHandover extends Model<CashHandoverAttributes, CashHandoverCreation>
  implements CashHandoverAttributes {
  declare id: string;
  declare driverId: string;
  declare receivedByStaffId: string;
  declare amountDeclared: string;
  declare amountVerified: string;
  declare status: CashHandoverAttributes['status'];
  declare submittedAt: Date;
  declare verifiedAt: Date | null;
  declare notes: string | null;
}

CashHandover.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    driverId:          { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    receivedByStaffId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    amountDeclared:  { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    amountVerified:  { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    status: { type: DataTypes.ENUM('submitted', 'verified', 'rejected'), allowNull: false, defaultValue: 'submitted' },
    submittedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    verifiedAt:  { type: DataTypes.DATE, allowNull: true },
    notes:       { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, tableName: 'cash_handovers', underscored: true },
);