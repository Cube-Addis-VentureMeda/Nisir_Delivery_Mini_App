// src/database/migrations/001-platform-pricing-rules.ts
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  name: '001-platform-pricing-rules',
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable('platform_pricing_rules', {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      
      single_restaurant_base_fee:    { type: DataTypes.DECIMAL(12, 2), allowNull: false }, // Br 50
      multiple_restaurants_base_fee: { type: DataTypes.DECIMAL(12, 2), allowNull: false }, // Br 80
      per_kilometer_fee:             { type: DataTypes.DECIMAL(12, 2), allowNull: false }, // Br 5/km
      company_food_fee_per_unit:     { type: DataTypes.DECIMAL(12, 2), allowNull: false }, // Br 20 per item unit
      driver_company_share_rate:     { type: DataTypes.DECIMAL(5, 4),  allowNull: false }, // 0.6000 = driver 60%
      restaurant_service_rate:       { type: DataTypes.DECIMAL(5, 4),  allowNull: false }, // 0.0500 = 5%

      // ── Effective window ──
      effective_from:  { type: DataTypes.DATE, allowNull: false },
      effective_until: { type: DataTypes.DATE, allowNull: true },  // null = still active
      is_active:       { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });


    await queryInterface.sequelize.query(`
      ALTER TABLE platform_pricing_rules
      ADD COLUMN active_marker TINYINT(1) GENERATED ALWAYS AS (IF(is_active = 1, 1, NULL)) VIRTUAL,
      ADD UNIQUE KEY uq_one_active_pricing_rule (active_marker)
    `);
    
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('platform_pricing_rules');
  },
};