import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

class Folder extends Model<InferAttributes<Folder>, InferCreationAttributes<Folder>> {
  declare id: CreationOptional<string>;
  declare userId: ForeignKey<string>;
  declare parentId: CreationOptional<string | null>;
  declare name: string;
  declare path: string;
  declare isDeleted: CreationOptional<boolean>;
  declare deletedAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  /**
   * Get folder depth level (0 for root)
   */
  public getDepth(): number {
    return this.path.split('/').filter(p => p.length > 0).length;
  }

  /**
   * Check if this is a root folder
   */
  public isRoot(): boolean {
    return this.parentId === null;
  }

  /**
   * Get parent path
   */
  public getParentPath(): string {
    const parts = this.path.split('/').filter(p => p.length > 0);
    parts.pop();
    return '/' + parts.join('/');
  }

  toJSON(): any {
    const values = { ...this.get() };
    
    // Convert Dates to ISO strings
    if (values.createdAt instanceof Date) values.createdAt = values.createdAt.toISOString() as any;
    if (values.updatedAt instanceof Date) values.updatedAt = values.updatedAt.toISOString() as any;
    if (values.deletedAt instanceof Date) values.deletedAt = values.deletedAt.toISOString() as any;
    
    return values;
  }
}

Folder.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
    comment: 'Owner of the folder',
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'parent_id',
    references: {
      model: 'folders',
      key: 'id',
    },
    onDelete: 'CASCADE',
    comment: 'Parent folder (null for root)',
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255],
    },
    comment: 'Folder name',
  },
  path: {
    type: DataTypes.STRING(1000),
    allowNull: false,
    unique: false, // Not globally unique, but unique per user
    comment: 'Full path from root (e.g., /Documents/Work)',
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_deleted',
    comment: 'Soft delete flag',
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'deleted_at',
    comment: 'Timestamp of deletion',
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize,
  tableName: 'folders',
  timestamps: true,
  underscored: true,
  paranoid: false, // We handle soft delete manually
  indexes: [
    {
      fields: ['user_id'],
      name: 'idx_folders_user_id',
    },
    {
      fields: ['parent_id'],
      name: 'idx_folders_parent_id',
    },
    {
      fields: ['user_id', 'path'],
      unique: true,
      name: 'idx_folders_user_path_unique',
    },
    {
      fields: ['user_id', 'is_deleted'],
      name: 'idx_folders_user_active',
    },
  ],
});

export default Folder;
