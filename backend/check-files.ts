import dotenv from 'dotenv';
dotenv.config();
import { sequelize } from './src/models/index.js';
import File from './src/models/File.js';

async function checkFiles() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    const files = await File.findAll({
        attributes: ['id', 'name', 'isPublic', 'shareToken']
    });

    console.log('Files in database:');
    files.forEach(f => {
        console.log(`- ${f.name} (${f.id}): isPublic=${f.isPublic}, shareToken=${f.shareToken}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Check failed:', error);
    process.exit(1);
  }
}

checkFiles();
