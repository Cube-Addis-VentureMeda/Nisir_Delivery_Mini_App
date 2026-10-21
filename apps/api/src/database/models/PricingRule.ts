// src/database/models/PricingRule.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';


export interface PricingRuleAttributes {
  id: string;
  singleRestaurantBaseFee: string;
  multipleRestaurantsBaseFee: string;
  perKilometerFee: string;
  companyFoodFeePerUnit: string;
  driverCompanyShareRate: string;   // "0.6000"
  restaurantServiceRate: string;    // "0.0500"
  effectiveFrom: Date;
  effectiveUntil: Date | null;
  isActive: boolean;
}

// Fields the DB generates — not required when creating a new row
export interface PricingRuleCreation extends Optional<PricingRuleAttributes, 'id'> {}

export class PricingRule
  extends Model<PricingRuleAttributes, PricingRuleCreation>
  implements PricingRuleAttributes
{
  declare id: string;
  declare singleRestaurantBaseFee: string;
  declare multipleRestaurantsBaseFee: string;
  declare perKilometerFee: string;
  declare companyFoodFeePerUnit: string;
  declare driverCompanyShareRate: string;
  declare restaurantServiceRate: string;
  declare effectiveFrom: Date;
  declare effectiveUntil: Date | null;
  declare isActive: boolean;

  // Class method: finds the ONE rule that is currently in effect.
  // Used by BOTH the quote endpoint and checkout — one source of truth.
  static async findActive(): Promise<PricingRule | null> {
    const now = new Date();
    return PricingRule.findOne({
      where: {
        isActive: true,
        effectiveFrom: { [require('sequelize').Op.lte]: now }, // effective_from <= now
        // effective_until IS NULL OR effective_until > now
      },
    });
  }
}

PricingRule.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    singleRestaurantBaseFee:    { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    multipleRestaurantsBaseFee: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    perKilometerFee:            { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    companyFoodFeePerUnit:      { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    driverCompanyShareRate:     { type: DataTypes.DECIMAL(5, 4),  allowNull: false },
    restaurantServiceRate:      { type: DataTypes.DECIMAL(5, 4),  allowNull: false },
    effectiveFrom:  { type: DataTypes.DATE, allowNull: false },
    effectiveUntil: { type: DataTypes.DATE, allowNull: true },
    isActive:       { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'platform_pricing_rules',
    underscored: true,      // camelCase in JS ⇄ snake_case in DB
    timestamps: true,       // created_at / updated_at
  },
);