import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import sequelize from '../config/database.js';

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<string>;
  declare logtoUserId: string;
  declare email: string;
  declare name: CreationOptional<string>;
  declare phone: CreationOptional<string>;
  declare age: CreationOptional<number>;
  declare gender: CreationOptional<'male' | 'female' | 'other' | 'prefer_not_to_say'>;
  declare picture: CreationOptional<string>;
  declare storageQuota: CreationOptional<number>;
  declare storageUsed: CreationOptional<number>;
  declare role: CreationOptional<'user' | 'admin'>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  public getStorageUsagePercentage(): number {
    return (Number(this.storageUsed) / Number(this.storageQuota)) * 100;
  }

  public hasAvailableStorage(requiredBytes: number): boolean {
    return (Number(this.storageUsed) + requiredBytes) <= Number(this.storageQuota);
  }

  toJSON() {
    const values = { ...this.get() };
    // Cast BIGINT to Number
    if (values.storageQuota) values.storageQuota = Number(values.storageQuota);
    if (values.storageUsed !== undefined) values.storageUsed = Number(values.storageUsed);
    
    // Convert Dates to ISO strings
    if (values.createdAt instanceof Date) values.createdAt = values.createdAt.toISOString() as any;
    if (values.updatedAt instanceof Date) values.updatedAt = values.updatedAt.toISOString() as any;
    
    return values;
  }
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  logtoUserId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'logto_user_id',
    comment: 'Logto user ID (sub claim)',
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
    comment: 'User email address',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'User display name',
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'User phone number',
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 13,
      max: 120,
    },
    comment: 'User age',
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
    allowNull: true,
    comment: 'User gender',
  },
  picture: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'User profile picture URL',
  },
  storageQuota: {
    type: DataTypes.BIGINT,
    defaultValue: 10737418240, // 10GB in bytes
    field: 'storage_quota',
    comment: 'Storage quota in bytes',
  },
  storageUsed: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    field: 'storage_used',
    comment: 'Storage used in bytes',
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user',
    comment: 'User role for authorization',
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize,
  tableName: 'users',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['logto_user_id'],
    },
    {
      unique: true,
      fields: ['email'],
    },
  ],
});

export default User;
