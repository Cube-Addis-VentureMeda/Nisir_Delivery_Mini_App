// src/database/seed.ts
import { sequelize } from '../config/database';
import './models'; // ensure associations registered
import { PricingRule } from './models/PricingRule';
import { Customer } from './models/Customer';
import { StaffUser } from './models/StaffUser';
import { Driver } from './models/Driver';
import { Merchant } from './models/Merchant';
import { CatalogItem } from './models/CatalogItem';
import bcrypt from 'bcryptjs';

// Seed = predictable starter data so you can test fee logic immediately.
// The mixed partner/non-partner merchant pair is ESSENTIAL for testing.
async function seed() {
  // 1. Pricing defaults (exact values from the roadmap)
  await PricingRule.create({
    singleRestaurantBaseFee: '50.00',
    multipleRestaurantsBaseFee: '80.00',
    perKilometerFee: '5.00',
    companyFoodFeePerUnit: '20.00',
    driverCompanyShareRate: '0.6000',   // driver 60%
    restaurantServiceRate: '0.0500',    // 5%
    effectiveFrom: new Date('2026-01-01'),
    effectiveUntil: null,
    isActive: true,
  });

  // 2. Staff user (admin) — password hashed, never plain
  const passwordHash = await bcrypt.hash('Admin123!', 10);
  await StaffUser.create({
    fullName: 'System Admin',
    email: 'admin@nisir.local',
    passwordHash,
    role: 'admin',
    status: 'active',
  });

  // 3. One driver
  await Driver.create({
    fullName: 'Test Driver',
    phone: '+251900000001',
    email: 'driver@nisir.local',
    passwordHash: await bcrypt.hash('Driver123!', 10),
    status: 'active',
  });

  // 4. One customer (fake telegram id for local testing)
  await Customer.create({
    telegramUserId: '999000111',
    firstName: 'Test',
    lastName: 'Customer',
    phone: '+251900000002',
    status: 'active',
  });

  // 5. TWO merchants: one PARTNER, one NOT — critical for fee testing
  const partner = await Merchant.create({
    name: 'Partner Restaurant A',
    merchantType: 'restaurant',
    status: 'active',
    isPartner: true,
    partnerSince: new Date(),
  });
  const nonPartner = await Merchant.create({
    name: 'Regular Restaurant B',
    merchantType: 'restaurant',
    status: 'active',
    isPartner: false,
  });

  // 6. Menu items
  await CatalogItem.bulkCreate([
    { merchantId: partner.id,    name: 'Burger', currentPrice: '250.00', isAvailable: true },
    { merchantId: partner.id,    name: 'Juice',  currentPrice: '80.00', isAvailable: true },
    { merchantId: nonPartner.id, name: 'Pizza',  currentPrice: '400.00', isAvailable: true },
    { merchantId: nonPartner.id, name: 'Salad',  currentPrice: '150.00', isAvailable: true },
    
  ]);

  console.log('✅ Seed complete: 1 pricing rule, 1 admin, 1 driver, 1 customer, 2 merchants (mixed partner), 4 items');
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });