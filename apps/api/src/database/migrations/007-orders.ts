// src/database/migrations/007-orders.ts
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  name: '007-orders',
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable('orders', {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      order_number: { type: DataTypes.STRING(50), allowNull: false, unique: true }, 
      customer_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'customers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',  
      },
      
      driver_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'drivers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      order_type: {
        type: DataTypes.ENUM('food', 'store_purchase', 'customer_parcel', 'mixed'),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'preparing', 'ready_for_pickup',
                             'out_for_delivery', 'delivered', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      payment_method: {
        type: DataTypes.ENUM('cod', 'online'),
        allowNull: false,
      },
      currency: { type: DataTypes.CHAR(3), allowNull: false, defaultValue: 'ETB' },

      // ── Money columns (all DECIMAL(12,2) — never float) ──
      subtotal:                     { type: DataTypes.DECIMAL(12, 2), allowNull: false }, // Σ merchant subtotals
      company_food_fee_total:       { type: DataTypes.DECIMAL(12, 2), allowNull: false }, // Σ Br 20 × qty
      delivery_fee:                 { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      non_partner_service_fee_total:{ type: DataTypes.DECIMAL(12, 2), allowNull: false },
      total_amount:                 { type: DataTypes.DECIMAL(12, 2), allowNull: false }, // what customer pays

      // ── Snapshot columns: copied from pricing rules at checkout, NEVER updated later ──
      restaurant_count:             { type: DataTypes.INTEGER,        allowNull: false }, // 1 → Br 50 base, 2+ → Br 80
      delivery_distance_km:         { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      delivery_base_fee:            { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      delivery_distance_fee:        { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      driver_company_share_rate:    { type: DataTypes.DECIMAL(5, 4),  allowNull: false }, // 0.6000
      company_delivery_share_amount:{ type: DataTypes.DECIMAL(12, 2), allowNull: false }, // fee × 40%
      driver_delivery_earning:      { type: DataTypes.DECIMAL(12, 2), allowNull: false }, // fee × 60%

      // ── Delivery details ──
      recipient_name:    { type: DataTypes.STRING(200), allowNull: true },
      recipient_phone:   { type: DataTypes.STRING(30),  allowNull: false },
      delivery_address:  { type: DataTypes.TEXT,         allowNull: false },
      delivery_latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
      delivery_longitude:{ type: DataTypes.DECIMAL(10, 7), allowNull: false },
      delivery_landmark: { type: DataTypes.STRING(255),  allowNull: false }, // MANDATORY per roadmap
      delivery_instructions: { type: DataTypes.TEXT, allowNull: true },

      // ── Non-partner consent (audit trail — required for dispute resolution) ──
      non_partner_fees_accepted:    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      non_partner_fees_accepted_at: { type: DataTypes.DATE, allowNull: true },

      // ── Status timestamps ──
      placed_at:       { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      confirmed_at:    { type: DataTypes.DATE, allowNull: true },
      delivered_at:    { type: DataTypes.DATE, allowNull: true },
      cancelled_at:    { type: DataTypes.DATE, allowNull: true },
      cancellation_reason: { type: DataTypes.TEXT, allowNull: true },

      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    // ── Database-level safety nets: even if service code has a bug, the DB refuses bad data ──
    await queryInterface.sequelize.query(`
      ALTER TABLE orders
      ADD CONSTRAINT chk_order_total CHECK (
        total_amount = subtotal + company_food_fee_total + delivery_fee + non_partner_service_fee_total
      ),
      ADD CONSTRAINT chk_delivery_fee CHECK (
        delivery_fee = delivery_base_fee + delivery_distance_fee
      ),
      ADD CONSTRAINT chk_amounts_nonnegative CHECK (
        subtotal >= 0 AND delivery_fee >= 0 AND total_amount >= 0
        AND company_food_fee_total >= 0 AND non_partner_service_fee_total >= 0
      )
    `);

    await queryInterface.addIndex('orders', ['customer_id']);
    await queryInterface.addIndex('orders', ['driver_id']);
    await queryInterface.addIndex('orders', ['status']);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('orders');
  },
};