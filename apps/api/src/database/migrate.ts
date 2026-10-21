// src/database/migrate.ts
import { sequelize } from '../config/database';
import { migrations } from './migrations';

// Runs like: npm run db:migrate  (or: tsx src/database/migrate.ts down)
async function run() {
  const direction = process.argv[2] === 'down' ? 'down' : 'up';
  const queryInterface = sequelize.getQueryInterface();

  try {
    if (direction === 'up') {
      for (const m of migrations) {
        console.log(`▶ Running UP: ${m.name}`);
        await m.up(queryInterface);
        console.log(`  ✔ done`);
      }
      console.log(`\n✅ ${migrations.length} migrations applied.`);
    } else {
      // down runs in REVERSE order so children are dropped before parents
      for (const m of [...migrations].reverse()) {
        console.log(`▶ Running DOWN: ${m.name}`);
        await m.down(queryInterface);
      }
      console.log('\n✅ All tables dropped.');
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

run();