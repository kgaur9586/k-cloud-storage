import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface AuditLogAttributes {
    id: string;
    adminId: string;
    action: string;
    targetUserId?: string;
    details: object;
    ipAddress: string;
    userAgent: string;
    createdAt?: Date;
}

interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id' | 'targetUserId' | 'createdAt'> { }

class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
    public id!: string;
    public adminId!: string;
    public action!: string;
    public targetUserId?: string;
    public details!: object;
    public ipAddress!: string;
    public userAgent!: string;
    public readonly createdAt!: Date;
}

AuditLog.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        adminId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'admin_id',
            references: {
                model: 'users',
                key: 'id',
            },
        },
        action: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Action type: quota_update, role_change, user_delete, settings_update, etc.',
        },
        targetUserId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: 'target_user_id',
            references: {
                model: 'users',
                key: 'id',
            },
            comment: 'User affected by the action (if applicable)',
        },
        details: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
            comment: 'Additional details about the action (old/new values, reason, etc.)',
        },
        ipAddress: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'ip_address',
        },
        userAgent: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'user_agent',
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'created_at',
        },
    },
    {
        sequelize,
        tableName: 'audit_logs',
        timestamps: false, // We only need createdAt, not updatedAt
        underscored: true,
        indexes: [
            {
                fields: ['admin_id'],
            },
            {
                fields: ['target_user_id'],
            },
            {
                fields: ['action'],
            },
            {
                fields: ['created_at'],
            },
        ],
    }
);

export default AuditLog;
