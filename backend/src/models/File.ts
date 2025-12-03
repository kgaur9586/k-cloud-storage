import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

class File extends Model<InferAttributes<File>, InferCreationAttributes<File>> {
  declare id: CreationOptional<string>;
  declare userId: ForeignKey<string>;
  declare folderId: CreationOptional<string | null>;
  declare name: string;
  declare originalName: string;
  declare mimeType: string;
  declare size: number;
  declare path: string;
  declare hash: string;
  declare thumbnailPath: CreationOptional<string | null>;
  declare metadata: CreationOptional<object | null>;
  declare isPublic: CreationOptional<boolean>;
  declare shareToken: CreationOptional<string | null>;
  declare publicAccessCount: CreationOptional<number>;
  declare currentVersion: CreationOptional<number>;
  declare isDeleted: CreationOptional<boolean>;
  declare deletedAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  /**
   * Get file extension
   */
  public getExtension(): string {
    return this.name.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Check if file is an image
   */
  public isImage(): boolean {
    return this.mimeType.startsWith('image/');
  }

  /**
   * Check if file is a video
   */
  public isVideo(): boolean {
    return this.mimeType.startsWith('video/');
  }

  /**
   * Check if file is a document
   */
  public isDocument(): boolean {
    const docTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument'];
    return docTypes.some(type => this.mimeType.includes(type));
  }

  /**
   * Format file size for display
   */
  public getFormattedSize(): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = this.size;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  toJSON(): any {
    const values = { ...this.get() };

    // Convert Dates to ISO strings
    if (values.createdAt instanceof Date) values.createdAt = values.createdAt.toISOString() as any;
    if (values.updatedAt instanceof Date) values.updatedAt = values.updatedAt.toISOString() as any;
    if (values.deletedAt instanceof Date) values.deletedAt = values.deletedAt.toISOString() as any;

    // Convert BIGINT size to number (PostgreSQL returns BIGINT as string)
    if (typeof values.size === 'string') values.size = parseInt(values.size, 10) as any;

    return values;
  }
}

File.init({
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
    comment: 'Owner of the file',
  },
  folderId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'folder_id',
    references: {
      model: 'folders',
      key: 'id',
    },
    onDelete: 'SET NULL',
    comment: 'Parent folder (null for root)',
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Current file name',
  },
  originalName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'original_name',
    comment: 'Original uploaded file name',
  },
  mimeType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'mime_type',
    comment: 'MIME type of the file',
  },
  size: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: 'File size in bytes',
  },
  path: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Relative path in storage',
  },
  hash: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: 'SHA256 hash for duplicate detection',
  },
  thumbnailPath: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'thumbnail_path',
    comment: 'Path to thumbnail image',
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional metadata (dimensions, duration, etc.)',
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_public',
    comment: 'Whether file is publicly accessible',
  },
  shareToken: {
    type: DataTypes.UUID,
    allowNull: true,
    unique: true,
    field: 'share_token',
    comment: 'Unique token for public access',
  },
  publicAccessCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'public_access_count',
    comment: 'Number of times file was accessed publicly',
  },
  currentVersion: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'current_version',
    comment: 'Current version number',
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
  tableName: 'files',
  timestamps: true,
  underscored: true,
  paranoid: false, // We handle soft delete manually
  indexes: [
    {
      fields: ['user_id'],
      name: 'idx_files_user_id',
    },
    {
      fields: ['folder_id'],
      name: 'idx_files_folder_id',
    },
    {
      fields: ['hash'],
      name: 'idx_files_hash',
    },
    {
      fields: ['user_id', 'is_deleted'],
      name: 'idx_files_user_active',
    },
    {
      fields: ['mime_type'],
      name: 'idx_files_mime_type',
    },
    {
      fields: ['share_token'],
      name: 'idx_files_share_token',
    },
    {
      fields: ['is_public'],
      name: 'idx_files_is_public',
    },
  ],
});

export default File;
