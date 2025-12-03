import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey } from 'sequelize';
import sequelize from '../config/database.js';
import File from './File.js';
import User from './User.js';

class FileVersion extends Model<InferAttributes<FileVersion>, InferCreationAttributes<FileVersion>> {
    declare id: CreationOptional<string>;
    declare fileId: ForeignKey<string>;
    declare versionNumber: number;
    declare path: string;
    declare size: number;
    declare mimeType: string;
    declare createdBy: ForeignKey<string>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

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

        // Convert BIGINT size to number
        if (typeof values.size === 'string') values.size = parseInt(values.size, 10) as any;

        return values;
    }
}

FileVersion.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    fileId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'file_id',
        references: {
            model: 'files',
            key: 'id',
        },
        onDelete: 'CASCADE',
        comment: 'Parent file',
    },
    versionNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'version_number',
        comment: 'Version number (1, 2, 3...)',
    },
    path: {
        type: DataTypes.STRING(500),
        allowNull: false,
        comment: 'Storage path for this version',
    },
    size: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: 'File size in bytes',
    },
    mimeType: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'mime_type',
        comment: 'MIME type of this version',
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'created_by',
        references: {
            model: 'users',
            key: 'id',
        },
        comment: 'User who created this version',
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
}, {
    sequelize,
    tableName: 'file_versions',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            fields: ['file_id'],
            name: 'idx_file_versions_file_id',
        },
        {
            fields: ['file_id', 'version_number'],
            unique: true,
            name: 'idx_file_versions_file_version',
        },
    ],
});

export default FileVersion;
