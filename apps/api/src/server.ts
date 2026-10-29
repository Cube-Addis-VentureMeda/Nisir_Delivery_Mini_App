// src/server.ts
import { createApp } from './app';
import { env } from './config/env';
import { sequelize } from './config/database';
import './database/models'; // registers all model associations

async function start() {
  try {
    // Verify DB connectivity before accepting traffic
    await sequelize.authenticate();
    console.log('✅ MySQL connected');

    const app = createApp();
    app.listen(env.PORT, () => {
      console.log(`🚀 Nisir API running on http://localhost:${env.PORT}`);
      console.log(`   Health check: http://localhost:${env.PORT}/health`);
    });
  } catch (err) {
    console.error('❌ Failed to start:', err);
    process.exit(1);
  }
}

start();