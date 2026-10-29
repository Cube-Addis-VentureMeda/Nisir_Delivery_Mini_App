// src/database/migrate.ts
import { QueryTypes } from 'sequelize';
import type { QueryInterface } from 'sequelize';
import { sequelize } from '../config/database';
import { migrations } from './migrations';

const MIGRATION_TABLE = 'schema_migrations';
const ADVISORY_LOCK_NAME = 'nisir_db_migration_lock';
const ADVISORY_LOCK_TIMEOUT_SECONDS = 60;

// Mapping of initial migrations to their created tables for baselining
const migrationTables: Record<string, string> = {
  '001-platform-pricing-rules': 'platform_pricing_rules',
  '002-customers': 'customers',
  '003-staff-users': 'staff_users',
  '004-drivers': 'drivers',
  '005-merchants': 'merchants',
  '006-catalog-items': 'catalog_items',
  '007-orders': 'orders',
  '008-merchant-orders': 'merchant_orders',
  '009-order-items': 'order_items',
  '010-customer-payments': 'customer_payments',
  '011-payment-refunds': 'payment_refunds',
  '012-cash-collections': 'cash_collections',
  '013-cash-handovers': 'cash_handovers',
  '014-cash-handover-items': 'cash_handover_items',
  '015-payout-accounts': 'payout_accounts',
  '016-merchant-payouts': 'merchant_payouts',
  '017-merchant-payout-items': 'merchant_payout_items',
  '018-driver-weekly-payments': 'driver_weekly_payments',
  '019-driver-weekly-payment-items': 'driver_weekly_payment_items',
};

type AppliedMigration = {
  migration_name: string;
};

async function acquireMigrationLock(): Promise<boolean> {
  const result = await sequelize.query<{ lock_acquired: number }>(
    `SELECT GET_LOCK('${ADVISORY_LOCK_NAME}', ${ADVISORY_LOCK_TIMEOUT_SECONDS}) AS lock_acquired`,
    { type: QueryTypes.SELECT },
  );
  return result[0]?.lock_acquired === 1;
}

async function releaseMigrationLock(): Promise<void> {
  try {
    await sequelize.query(`SELECT RELEASE_LOCK('${ADVISORY_LOCK_NAME}')`, {
      type: QueryTypes.SELECT,
    });
  } catch (err) {
    console.warn('⚠️ Warning: failed to release migration advisory lock:', err);
  }
}

async function ensureMigrationTable(queryInterface: QueryInterface) {
  const exists = await queryInterface.tableExists(MIGRATION_TABLE);

  if (!exists) {
    await queryInterface.createTable(MIGRATION_TABLE, {
      migration_name: {
        type: 'VARCHAR(255)',
        primaryKey: true,
        allowNull: false,
      },
      executed_at: {
        type: 'DATETIME',
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    console.log(`Created migration tracking table: ${MIGRATION_TABLE}`);
  }
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const rows = await sequelize.query<AppliedMigration>(
    `SELECT migration_name FROM ${MIGRATION_TABLE} ORDER BY executed_at ASC`,
    { type: QueryTypes.SELECT },
  );

  return new Set(rows.map((row) => row.migration_name));
}

async function baselineExistingDatabase(queryInterface: QueryInterface) {
  const applied = await getAppliedMigrations();

  if (applied.size > 0) {
    throw new Error(
      'Baseline refused: migration history is not empty. Inspect schema_migrations before proceeding.',
    );
  }

  const missingTables: string[] = [];

  for (const migration of migrations) {
    const tableName = migrationTables[migration.name];
    if (tableName && !(await queryInterface.tableExists(tableName))) {
      missingTables.push(tableName);
    }
  }

  if (missingTables.length > 0) {
    throw new Error(
      `Baseline refused. These expected tables are missing: ${missingTables.join(', ')}`,
    );
  }

  await queryInterface.bulkInsert(
    MIGRATION_TABLE,
    migrations.map((migration) => ({
      migration_name: migration.name,
      executed_at: new Date(),
    })),
  );

  console.log(`Baseline complete: recorded ${migrations.length} existing migrations.`);
}

async function run() {
  const direction = process.argv[2] ?? 'up';
  const stepsArg = process.argv[3];
  const queryInterface = sequelize.getQueryInterface();

  if (!['up', 'down', 'baseline'].includes(direction)) {
    console.error('Invalid command. Use: up, down [steps], or baseline.');
    process.exitCode = 1;
    return;
  }

  // 1. Acquire distributed advisory lock to guarantee concurrent executions are serialized
  console.log('🔒 Acquiring database migration lock...');
  const locked = await acquireMigrationLock();
  if (!locked) {
    console.error('❌ Could not acquire migration lock within timeout. Another migration is actively executing.');
    process.exitCode = 1;
    return;
  }

  try {
    await ensureMigrationTable(queryInterface);

    if (direction === 'baseline') {
      await baselineExistingDatabase(queryInterface);
      return;
    }

    const applied = await getAppliedMigrations();

    if (direction === 'up') {
      let pendingCount = 0;
      for (const migration of migrations) {
        if (applied.has(migration.name)) {
          continue;
        }

        pendingCount++;
        console.log(`▶ Running UP: ${migration.name}`);

        // Run migration DDL
        try {
          await migration.up(queryInterface);
        } catch (migrationError) {
          console.error(`❌ Migration UP failed on ${migration.name}:`, migrationError);
          console.error('⚠️ Halting migration sequence. No subsequent migrations will run.');
          throw migrationError;
        }

        // Record in schema_migrations ONLY after up succeeds
        await queryInterface.bulkInsert(MIGRATION_TABLE, [
          {
            migration_name: migration.name,
            executed_at: new Date(),
          },
        ]);

        console.log(`✔ Completed: ${migration.name}`);
      }

      if (pendingCount === 0) {
        console.log('✅ Database is already up to date. No pending migrations.');
      } else {
        console.log(`✅ All ${pendingCount} pending migration(s) completed successfully.`);
      }
    } else {
      // Direction === 'down'
      // Safe step limit: default to reverting 1 migration unless explicitly passed 'all' or a positive integer
      const appliedList = [...migrations].filter((m) => applied.has(m.name)).reverse();

      if (appliedList.length === 0) {
        console.log('ℹ️ No applied migrations found to revert.');
        return;
      }

      let steps = 1;
      if (stepsArg === 'all') {
        steps = appliedList.length;
      } else if (stepsArg && !isNaN(Number(stepsArg))) {
        steps = Math.max(1, Math.min(Number(stepsArg), appliedList.length));
      }

      console.log(`⚠️ Reverting ${steps} migration(s)...`);
      const toRevert = appliedList.slice(0, steps);

      for (const migration of toRevert) {
        console.log(`▶ Running DOWN: ${migration.name}`);

        try {
          await migration.down(queryInterface);
        } catch (rollbackError) {
          console.error(`❌ Migration DOWN failed on ${migration.name}:`, rollbackError);
          throw rollbackError;
        }

        await queryInterface.bulkDelete(MIGRATION_TABLE, {
          migration_name: migration.name,
        });

        console.log(`✔ Reverted: ${migration.name}`);
      }

      console.log(`✅ Reverted ${toRevert.length} migration(s).`);
    }
  } catch (error) {
    console.error('❌ Migration process encountered an error:', error);
    process.exitCode = 1;
  } finally {
    console.log('🔓 Releasing migration lock...');
    await releaseMigrationLock();
    await sequelize.close();
  }
}

run();
