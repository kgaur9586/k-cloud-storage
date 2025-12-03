import sequelize from '../config/database.js';
import User from './User.js';
import File from './File.js';
import Folder from './Folder.js';
import FileVersion from './FileVersion.js';

/**
 * Models registry
 * Central place to manage all database models and their associations
 */
const models = {
    User,
    File,
    Folder,
    FileVersion,
};

/**
 * Define model associations
 * Sets up relationships between models
 */
export const setupAssociations = () => {
    // User associations
    User.hasMany(File, { foreignKey: 'userId', as: 'files' });
    User.hasMany(Folder, { foreignKey: 'userId', as: 'folders' });

    // File associations
    File.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
    File.belongsTo(Folder, { foreignKey: 'folderId', as: 'folder' });
    File.hasMany(FileVersion, { foreignKey: 'fileId', as: 'versions' });

    // FileVersion associations
    FileVersion.belongsTo(File, { foreignKey: 'fileId', as: 'file' });
    FileVersion.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

    // Folder associations
    Folder.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
    Folder.belongsTo(Folder, { foreignKey: 'parentId', as: 'parent' });
    Folder.hasMany(Folder, { foreignKey: 'parentId', as: 'children' });
    Folder.hasMany(File, { foreignKey: 'folderId', as: 'files' });
};

export { sequelize, models };
export default models;
