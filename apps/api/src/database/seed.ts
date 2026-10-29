// src/database/seed.ts
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database';
import './models';
import { PricingRule } from './models/PricingRule';
import { Customer } from './models/Customer';
import { StaffUser } from './models/StaffUser';
import { Driver } from './models/Driver';
import { Merchant } from './models/Merchant';
import { CatalogItem } from './models/CatalogItem';

async function seed() {
  // All-or-nothing: a failed seed leaves no half-populated database behind.
  await sequelize.transaction(async () => {
    await PricingRule.create({
      singleRestaurantBaseFee: '50.00',
      multipleRestaurantsBaseFee: '80.00',
      perKilometerFee: '5.00',
      companyFoodFeePerUnit: '20.00',
      driverCompanyShareRate: '0.6000',
      restaurantServiceRate: '0.0500',
      effectiveFrom: new Date('2026-01-01'),
      effectiveUntil: null,
      isActive: true,
    });

    // Two roles only: admin (dispatch + everything) and finance (money-out).
    await StaffUser.create({
      fullName: 'System Admin',
      email: 'admin@nisir.local',
      passwordHash: await bcrypt.hash('Admin123!', 10),
      role: 'admin',
      status: 'active',
    });
    await StaffUser.create({
      fullName: 'Finance Officer',
      email: 'finance@nisir.local',
      passwordHash: await bcrypt.hash('Finance123!', 10),
      role: 'finance',
      status: 'active',
    });

    await Driver.create({
      fullName: 'Test Driver',
      phone: '+251900000001',
      email: 'driver@nisir.local',
      passwordHash: await bcrypt.hash('Driver123!', 10),
      telegramUserId: '888000222',
      status: 'active',
    });

    await Customer.create({
      telegramUserId: '999000111',
      firstName: 'Test',
      lastName: 'Customer',
      phone: '+251900000002',
    });

    const partner = await Merchant.create({
      name: 'Partner Restaurant A', merchantType: 'restaurant',
      status: 'active', isPartner: true, partnerSince: new Date(),
    });
    const nonPartner = await Merchant.create({
      name: 'Regular Restaurant B', merchantType: 'restaurant',
      status: 'active', isPartner: false,
    });

    await CatalogItem.bulkCreate([
      { merchantId: partner.id,    name: 'Burger', currentPrice: '250.00' , isAvailable: true},
      { merchantId: partner.id,    name: 'Juice',  currentPrice: '80.00'  , isAvailable: true},
      { merchantId: nonPartner.id, name: 'Pizza',  currentPrice: '400.00' , isAvailable: true},
      { merchantId: nonPartner.id, name: 'Salad',  currentPrice: '150.00' , isAvailable: true},
    ]);
  });

  console.log('✅ Seed complete (transaction committed)');
  process.exit(0);
}

seed().catch((e) => { console.error('❌ Seed failed (rolled back):', e); process.exit(1); });