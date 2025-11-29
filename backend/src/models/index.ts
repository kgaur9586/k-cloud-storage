import sequelize from '../config/database.js';
import User from './User.js';

/**
 * Models registry
 * Central place to manage all database models and their associations
 */
const models = {
    User,
};

/**
 * Define model associations here
 * Example: User.hasMany(File);
 * Example: File.belongsTo(User);
 */
export const setupAssociations = () => {
    // Will add associations as we create more models
};

export { sequelize, models };
export default models;
