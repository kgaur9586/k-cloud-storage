import sequelize from './database.js';
import '../models/User.js'; // Import models to ensure they are registered
import '../models/AuditLog.js'; // Import AuditLog model
import { logger } from '../utils/logger.js';

const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Sync all models (create missing tables)
    await sequelize.sync();
    console.log('✅ Database synchronized successfully');

    process.exit(0);
  } catch (error) {
    console.error('❌ Database synchronization failed:', error);
    process.exit(1);
  }
};

syncDatabase();
