import dotenv from 'dotenv';
dotenv.config();
import { sequelize } from './src/models/index.js';

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    const queryInterface = sequelize.getQueryInterface();

    // Add is_public column
    try {
      await queryInterface.addColumn('files', 'is_public', {
        type: 'BOOLEAN',
        defaultValue: false,
      });
      console.log('Added is_public column');
    } catch (e: any) {
      console.log('is_public column might already exist:', e.message);
    }

    // Add share_token column
    try {
      await queryInterface.addColumn('files', 'share_token', {
        type: 'UUID',
        allowNull: true,
        unique: true,
      });
      console.log('Added share_token column');
    } catch (e: any) {
      console.log('share_token column might already exist:', e.message);
    }

    // Add public_access_count column
    try {
      await queryInterface.addColumn('files', 'public_access_count', {
        type: 'INTEGER',
        defaultValue: 0,
      });
      console.log('Added public_access_count column');
    } catch (e: any) {
      console.log('public_access_count column might already exist:', e.message);
    }

    // Create indexes
    try {
      await sequelize.query('CREATE INDEX IF NOT EXISTS "idx_files_share_token" ON "files" ("share_token")');
      await sequelize.query('CREATE INDEX IF NOT EXISTS "idx_files_is_public" ON "files" ("is_public")');
      console.log('Created indexes');
    } catch (e: any) {
      console.log('Failed to create indexes:', e.message);
    }

    console.log('Migration completed');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
