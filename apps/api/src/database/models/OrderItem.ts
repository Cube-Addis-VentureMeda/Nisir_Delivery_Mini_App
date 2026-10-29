// src/database/models/OrderItem.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface OrderItemAttributes {
  id: string;
  merchantOrderId: string;
  catalogItemId: string | null;
  itemName: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
  companyFoodFee: string;
  instructions: string | null;
  createdAt?: Date;
}
export interface OrderItemCreation extends Optional<OrderItemAttributes, 'id'> {}

export class OrderItem extends Model<OrderItemAttributes, OrderItemCreation> implements OrderItemAttributes {
  declare id: string;
  declare merchantOrderId: string;
  declare catalogItemId: string | null;
  declare itemName: string;
  declare unitPrice: string;
  declare quantity: number;
  declare lineTotal: string;
  declare companyFoodFee: string;
  declare instructions: string | null;
  declare createdAt: Date;
}

OrderItem.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    merchantOrderId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    catalogItemId:   { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },  // null = item deleted later
    itemName:       { type: DataTypes.STRING(200),   allowNull: false },
    unitPrice:      { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    quantity:       { type: DataTypes.INTEGER,        allowNull: false },
    lineTotal:      { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    companyFoodFee: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    instructions:   { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, tableName: 'order_items', underscored: true, timestamps: true, updatedAt: false },
);