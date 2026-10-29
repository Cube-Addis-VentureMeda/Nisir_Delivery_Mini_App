
import { sequelize } from './database';

async function testDatabaseConnection(): Promise<void> {
  try {
    await sequelize.authenticate();

    console.log('✅ MySQL connection established successfully!');

    const [results] = await sequelize.query(
      'SELECT DATABASE() AS databaseName, VERSION() AS mysqlVersion',
    );

    console.log('📦 Database information:', results);
  } catch (error) {
    console.error('❌ Unable to connect to MySQL:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

testDatabaseConnection();