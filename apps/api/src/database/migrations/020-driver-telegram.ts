// src/database/migrations/020-driver-telegram.ts
import { DataTypes, QueryInterface } from 'sequelize';

// Drivers log in via Telegram Mini App — link their account to their telegram id,
// and store their chat id so the bot can push "new delivery assigned" messages.
export default {
  name: '020-driver-telegram',
  async up(queryInterface: QueryInterface) {
    await queryInterface.addColumn('drivers', 'telegram_user_id', {
      type: DataTypes.STRING(100),
      allowNull: true,   // nullable: staff creates the driver record BEFORE the driver opens the app
      unique: true,
    });
    await queryInterface.addColumn('drivers', 'telegram_chat_id', {
      type: DataTypes.STRING(100),
      allowNull: true,   // filled when the driver messages the bot /start
    });
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn('drivers', 'telegram_user_id');
    await queryInterface.removeColumn('drivers', 'telegram_chat_id');
  },
};