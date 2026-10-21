// src/database/migrations/015-payout-accounts.ts
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  name: '015-payout-accounts',
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable('payout_accounts', {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      merchant_id: {
        type: DataTypes.BIGINT.UNSIGNED, allowNull: true,
        references: { model: 'merchants', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      driver_id: {
        type: DataTypes.BIGINT.UNSIGNED, allowNull: true,
        references: { model: 'drivers', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      },
      method: {
        type: DataTypes.ENUM('bank_transfer', 'telebirr'),
        allowNull: false,
      },
      provider_name:       { type: DataTypes.STRING(100), allowNull: true },
      account_holder_name: { type: DataTypes.STRING(200), allowNull: false },
      account_number:      { type: DataTypes.STRING(100), allowNull: true },
      phone_number:        { type: DataTypes.STRING(30),  allowNull: true },
      is_default: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      status: {
        type: DataTypes.ENUM('pending_verification', 'verified', 'disabled'),
        allowNull: false, defaultValue: 'pending_verification',
      },
      verified_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE payout_accounts
      ADD CONSTRAINT chk_exactly_one_owner
        CHECK ((merchant_id IS NULL) != (driver_id IS NULL)),
      ADD COLUMN default_owner_key BIGINT UNSIGNED
        GENERATED ALWAYS AS (IF(is_default = 1, COALESCE(merchant_id, driver_id), NULL)) VIRTUAL,
      ADD UNIQUE KEY uq_default_payout_account (default_owner_key)
    `);
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('payout_accounts');
  },
};