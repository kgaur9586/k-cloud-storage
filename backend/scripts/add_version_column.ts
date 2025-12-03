import sequelize from '../src/config/database.js';
import { logger } from '../src/utils/logger.js';

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('Database connected');

        // Add current_version column
        await sequelize.query('ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "current_version" INTEGER DEFAULT 1;');
        console.log('Added current_version column to files table');

        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
