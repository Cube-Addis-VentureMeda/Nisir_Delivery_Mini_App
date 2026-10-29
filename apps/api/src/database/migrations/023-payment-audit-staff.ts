import { DataTypes, QueryInterface } from 'sequelize';

export default {
  name: '023-payment-audit-staff',
  async up(queryInterface: QueryInterface) {
    await queryInterface.addColumn('customer_payments', 'confirmed_by_staff_id', {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: 'staff_users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn('customer_payments', 'confirmed_by_staff_id');
  },
};
