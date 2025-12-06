import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

interface SharedLinkAttributes {
    id: string;
    resourceType: 'file' | 'folder';
    resourceId: string;
    sharedBy: string;
    sharedWith: string | null;
    shareToken: string;
    permission: 'view' | 'download' | 'edit';
    passwordHash: string | null;
    expiresAt: Date | null;
    accessCount: number;
    maxAccessCount: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface SharedLinkCreationAttributes extends Optional<SharedLinkAttributes, 'id' | 'shareToken' | 'accessCount' | 'isActive' | 'createdAt' | 'updatedAt' | 'sharedWith' | 'passwordHash' | 'expiresAt' | 'maxAccessCount'> { }

class SharedLink extends Model<SharedLinkAttributes, SharedLinkCreationAttributes> implements SharedLinkAttributes {
    declare public id: string;
    declare public resourceType: 'file' | 'folder';
    declare public resourceId: string;
    declare public sharedBy: string;
    declare public sharedWith: string | null;
    declare public shareToken: string;
    declare public permission: 'view' | 'download' | 'edit';
    declare public passwordHash: string | null;
    declare public expiresAt: Date | null;
    declare public accessCount: number;
    declare public maxAccessCount: number | null;
    declare public isActive: boolean;
    declare public readonly createdAt: Date;
    declare public readonly updatedAt: Date;

    /**
     * Generate a unique share token
     */
    static generateToken(): string {
        return crypto.randomBytes(32).toString('base64url');
    }

    /**
     * Hash a password for share link protection
     */
    static async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }

    /**
     * Verify password for share link
     */
    async verifyPassword(password: string): Promise<boolean> {
        if (!this.passwordHash) return true; // No password set
        return bcrypt.compare(password, this.passwordHash);
    }

    /**
     * Check if share link has expired
     */
    isExpired(): boolean {
        if (!this.expiresAt) return false;
        return new Date() > this.expiresAt;
    }

    /**
     * Check if access limit has been reached
     */
    isAccessLimitReached(): boolean {
        if (!this.maxAccessCount) return false;
        return this.accessCount >= this.maxAccessCount;
    }

    /**
     * Check if share link is valid (active, not expired, not at limit)
     */
    isValid(): boolean {
        return this.isActive && !this.isExpired() && !this.isAccessLimitReached();
    }

    /**
     * Increment access count
     */
    async incrementAccessCount(): Promise<void> {
        this.accessCount += 1;
        await this.save();
    }

    /**
     * Revoke share link
     */
    async revoke(): Promise<void> {
        this.isActive = false;
        await this.save();
    }
}

SharedLink.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        resourceType: {
            type: DataTypes.STRING(10),
            allowNull: false,
            validate: {
                isIn: [['file', 'folder']],
            },
        },
        resourceId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        sharedBy: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        sharedWith: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        shareToken: {
            type: DataTypes.STRING(64),
            allowNull: false,
            unique: true,
            defaultValue: () => SharedLink.generateToken(),
        },
        permission: {
            type: DataTypes.STRING(20),
            allowNull: false,
            validate: {
                isIn: [['view', 'download', 'edit']],
            },
        },
        passwordHash: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        accessCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
        },
        maxAccessCount: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'shared_links',
        underscored: true,
        timestamps: true,
    }
);

export default SharedLink;
