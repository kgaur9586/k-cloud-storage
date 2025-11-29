import sequelize from './database.js';
import '../models/User.js'; // Import models to ensure they are registered
import { logger } from '../utils/logger.js';

const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    // Sync all models
    await sequelize.sync({ force: true });
    console.log('✅ Database synchronized successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database synchronization failed:', error);
    process.exit(1);
  }
};

syncDatabase();
