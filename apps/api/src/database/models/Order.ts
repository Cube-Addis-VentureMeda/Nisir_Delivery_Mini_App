// src/database/models/Order.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup'
                        | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface OrderAttributes {
  id: string;
  orderNumber: string;
  customerId: string;
  driverId: string | null;
  orderType: 'food' | 'store_purchase' | 'customer_parcel' | 'mixed';
  status: OrderStatus;
  paymentMethod: 'cod' | 'online';
  currency: string;
  subtotal: string;
  companyFoodFeeTotal: string;
  deliveryFee: string;
  nonPartnerServiceFeeTotal: string;
  totalAmount: string;
  restaurantCount: number;
  deliveryDistanceKm: string;
  deliveryBaseFee: string;
  deliveryDistanceFee: string;
  driverCompanyShareRate: string;
  companyDeliveryShareAmount: string;
  driverDeliveryEarning: string;
  recipientName: string | null;
  recipientPhone: string;
  deliveryAddress: string;
  deliveryLatitude: string;
  deliveryLongitude: string;
  deliveryLandmark: string;
  deliveryInstructions: string | null;
  nonPartnerFeesAccepted: boolean;
  nonPartnerFeesAcceptedAt: Date | null;
  placedAt: Date;
}
export interface OrderCreation extends Optional<OrderAttributes, 'id' | 'placedAt'> {}

export class Order extends Model<OrderAttributes, OrderCreation> implements OrderAttributes {
  declare id: string;
  declare orderNumber: string;
  declare customerId: string;
  declare driverId: string | null;
  declare orderType: OrderAttributes['orderType'];
  declare status: OrderStatus;
  declare paymentMethod: 'cod' | 'online';
  declare currency: string;
  declare subtotal: string;
  declare companyFoodFeeTotal: string;
  declare deliveryFee: string;
  declare nonPartnerServiceFeeTotal: string;
  declare totalAmount: string;
  declare restaurantCount: number;
  declare deliveryDistanceKm: string;
  declare deliveryBaseFee: string;
  declare deliveryDistanceFee: string;
  declare driverCompanyShareRate: string;
  declare companyDeliveryShareAmount: string;
  declare driverDeliveryEarning: string;
  declare recipientName: string | null;
  declare recipientPhone: string;
  declare deliveryAddress: string;
  declare deliveryLatitude: string;
  declare deliveryLongitude: string;
  declare deliveryLandmark: string;
  declare deliveryInstructions: string | null;
  declare nonPartnerFeesAccepted: boolean;
  declare nonPartnerFeesAcceptedAt: Date | null;
  declare placedAt: Date;
}

Order.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    orderNumber: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    customerId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    driverId:   { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    orderType:  { type: DataTypes.ENUM('food', 'store_purchase', 'customer_parcel', 'mixed'), allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled'),
      allowNull: false, defaultValue: 'pending',
    },
    paymentMethod: { type: DataTypes.ENUM('cod', 'online'), allowNull: false },
    currency: { type: DataTypes.CHAR(3), allowNull: false, defaultValue: 'ETB' },
    subtotal:                      { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    companyFoodFeeTotal:           { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    deliveryFee:                   { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    nonPartnerServiceFeeTotal:     { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    totalAmount:                   { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    restaurantCount:               { type: DataTypes.INTEGER,        allowNull: false },
    deliveryDistanceKm:            { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    deliveryBaseFee:               { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    deliveryDistanceFee:           { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    driverCompanyShareRate:        { type: DataTypes.DECIMAL(5, 4),  allowNull: false },
    companyDeliveryShareAmount:    { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    driverDeliveryEarning:         { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    recipientName:    { type: DataTypes.STRING(200), allowNull: true },
    recipientPhone:   { type: DataTypes.STRING(30),  allowNull: false },
    deliveryAddress:  { type: DataTypes.TEXT, allowNull: false },
    deliveryLatitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
    deliveryLongitude:{ type: DataTypes.DECIMAL(10, 7), allowNull: false },
    deliveryLandmark: { type: DataTypes.STRING(255), allowNull: false },
    deliveryInstructions: { type: DataTypes.TEXT, allowNull: true },
    nonPartnerFeesAccepted:    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    nonPartnerFeesAcceptedAt:  { type: DataTypes.DATE, allowNull: true },
    placedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { sequelize, tableName: 'orders', underscored: true },
);