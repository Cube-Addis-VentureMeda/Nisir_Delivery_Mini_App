// src/database/migrations/index.ts 
import { QueryInterface } from 'sequelize';
import m001 from './001-platform-pricing-rules';
import m002 from './002-customers';
import m003 from './003-staff-users';
import m004 from './004-drivers';
import m005 from './005-merchants';
import m006 from './006-catalog-items';
import m007 from './007-orders';
import m008 from './008-merchant-orders';
import m009 from './009-order-items';
import m010 from './010-customer-payments';
import m011 from './011-payment-refunds';
import m012 from './012-cash-collections';
import m013 from './013-cash-handovers';
import m014 from './014-cash-handover-items';
import m015 from './015-payout-accounts';
import m016 from './016-merchant-payouts';
import m017 from './017-merchant-payout-items';
import m018 from './018-driver-weekly-payments';
import m019 from './019-driver-weekly-payment-items';
import m020 from './020-driver-telegram';
import m021 from './021-payment-method-and-idempotency';
import m022 from './022-staff-roles';
import m023 from './023-payment-audit-staff';

export interface Migration {
  name: string;
  up: (qi: QueryInterface) => Promise<void>;
  down: (qi: QueryInterface) => Promise<void>;
}

export const migrations: Migration[] = [
  m001, m002, m003, m004, m005, m006, m007, m008, m009,
  m010, m011, m012, m013, m014, m015, m016, m017, m018, m019, m020, m021, m022, m023,
];