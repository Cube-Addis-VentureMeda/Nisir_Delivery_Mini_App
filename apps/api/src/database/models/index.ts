// src/database/models/index.ts  (REPLACES the previous version)
import { Customer } from './Customer';
import { StaffUser } from './StaffUser';
import { Driver } from './Driver';
import { Merchant } from './Merchant';
import { CatalogItem } from './CatalogItem';
import { Order } from './Order';
import { MerchantOrder } from './MerchantOrder';
import { OrderItem } from './OrderItem';
import { CustomerPayment } from './CustomerPayment';
import { PaymentRefund } from './PaymentRefund';
import { CashCollection } from './CashCollection';
import { CashHandover } from './CashHandover';
import { CashHandoverItem } from './CashHandoverItem';
import { PayoutAccount } from './PayoutAccount';
import { MerchantPayout } from './MerchantPayout';
import { MerchantPayoutItem } from './MerchantPayoutItem';
import { DriverWeeklyPayment } from './DriverWeeklyPayment';
import { DriverWeeklyPaymentItem } from './DriverWeeklyPaymentItem';
import { PricingRule } from './PricingRule';

// ── Identity ──
Customer.hasMany(Order, { foreignKey: 'customerId', as: 'orders' });
Order.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// ── Catalog ──
Merchant.hasMany(CatalogItem, { foreignKey: 'merchantId', as: 'items' });
CatalogItem.belongsTo(Merchant, { foreignKey: 'merchantId', as: 'merchant' });

// ── Order structure ──
Order.hasMany(MerchantOrder, { foreignKey: 'orderId', as: 'merchantOrders' });
MerchantOrder.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Merchant.hasMany(MerchantOrder, { foreignKey: 'merchantId', as: 'merchantOrders' });
MerchantOrder.belongsTo(Merchant, { foreignKey: 'merchantId', as: 'merchant' });
MerchantOrder.hasMany(OrderItem, { foreignKey: 'merchantOrderId', as: 'items' });
OrderItem.belongsTo(MerchantOrder, { foreignKey: 'merchantOrderId', as: 'merchantOrder' });

// ── Payments ──
Order.hasMany(CustomerPayment, { foreignKey: 'orderId', as: 'payments' });
CustomerPayment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Customer.hasMany(CustomerPayment, { foreignKey: 'customerId', as: 'payments' });
CustomerPayment.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
CustomerPayment.hasMany(PaymentRefund, { foreignKey: 'customerPaymentId', as: 'refunds' });
PaymentRefund.belongsTo(CustomerPayment, { foreignKey: 'customerPaymentId', as: 'payment' });

// ── COD ledger ──
Order.hasOne(CashCollection, { foreignKey: 'orderId', as: 'cashCollection' });
CashCollection.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Driver.hasMany(CashCollection, { foreignKey: 'driverId', as: 'cashCollections' });
CashCollection.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });
Driver.hasMany(CashHandover, { foreignKey: 'driverId', as: 'cashHandovers' });
CashHandover.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });
StaffUser.hasMany(CashHandover, { foreignKey: 'receivedByStaffId', as: 'receivedHandovers' });
CashHandover.belongsTo(StaffUser, { foreignKey: 'receivedByStaffId', as: 'receivedBy' });
CashHandover.hasMany(CashHandoverItem, { foreignKey: 'cashHandoverId', as: 'items' });
CashHandoverItem.belongsTo(CashHandover, { foreignKey: 'cashHandoverId', as: 'handover' });
CashCollection.hasMany(CashHandoverItem, { foreignKey: 'cashCollectionId', as: 'handoverItems' });
CashHandoverItem.belongsTo(CashCollection, { foreignKey: 'cashCollectionId', as: 'collection' });

// ── Payout accounts ──
Merchant.hasMany(PayoutAccount, { foreignKey: 'merchantId', as: 'payoutAccounts' });
PayoutAccount.belongsTo(Merchant, { foreignKey: 'merchantId', as: 'merchant' });
Driver.hasMany(PayoutAccount, { foreignKey: 'driverId', as: 'payoutAccounts' });
PayoutAccount.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });

// ── Merchant payouts ──
Merchant.hasMany(MerchantPayout, { foreignKey: 'merchantId', as: 'payouts' });
MerchantPayout.belongsTo(Merchant, { foreignKey: 'merchantId', as: 'merchant' });
PayoutAccount.hasMany(MerchantPayout, { foreignKey: 'payoutAccountId', as: 'merchantPayouts' });
MerchantPayout.belongsTo(PayoutAccount, { foreignKey: 'payoutAccountId', as: 'payoutAccount' });
MerchantPayout.hasMany(MerchantPayoutItem, { foreignKey: 'merchantPayoutId', as: 'items' });
MerchantPayoutItem.belongsTo(MerchantPayout, { foreignKey: 'merchantPayoutId', as: 'payout' });
MerchantOrder.hasMany(MerchantPayoutItem, { foreignKey: 'merchantOrderId', as: 'payoutItems' });
MerchantPayoutItem.belongsTo(MerchantOrder, { foreignKey: 'merchantOrderId', as: 'merchantOrder' });

// ── Driver weekly pay ──
Driver.hasMany(DriverWeeklyPayment, { foreignKey: 'driverId', as: 'weeklyPayments' });
DriverWeeklyPayment.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });
DriverWeeklyPayment.hasMany(DriverWeeklyPaymentItem, { foreignKey: 'driverWeeklyPaymentId', as: 'items' });
DriverWeeklyPaymentItem.belongsTo(DriverWeeklyPayment, { foreignKey: 'driverWeeklyPaymentId', as: 'weeklyPayment' });
Order.hasMany(DriverWeeklyPaymentItem, { foreignKey: 'orderId', as: 'weeklyPaymentItems' });
DriverWeeklyPaymentItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

export {
  Customer, StaffUser, Driver, Merchant, CatalogItem, Order, MerchantOrder, OrderItem,
  CustomerPayment, PaymentRefund, CashCollection, CashHandover, CashHandoverItem,
  PayoutAccount, MerchantPayout, MerchantPayoutItem, DriverWeeklyPayment,
  DriverWeeklyPaymentItem, PricingRule,
};