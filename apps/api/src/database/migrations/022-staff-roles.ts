// src/database/migrations/022-staff-roles.ts
import { QueryInterface } from 'sequelize';

export default {
  name: '022-staff-roles',
  async up(queryInterface: QueryInterface) {
    // Small team: admin does dispatch + everything; finance handles money-out.
    // Role checks in middleware are data-driven, so this is the ONLY change needed.
    await queryInterface.sequelize.query(`
      ALTER TABLE staff_users
      MODIFY role ENUM('admin', 'finance') NOT NULL
    `);
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE staff_users
      MODIFY role ENUM('admin', 'operations', 'finance') NOT NULL
    `);
  },
};