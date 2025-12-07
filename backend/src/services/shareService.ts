import SharedLink from '../models/SharedLink.js';
import File from '../models/File.js';
import Folder from '../models/Folder.js';
import storageService from './storageService.js';
import { Op } from 'sequelize';

interface ShareOptions {
    sharedWith?: string; // userId or null for public
    permission: 'view' | 'download' | 'edit';
    expiresAt?: Date;
    password?: string;
    maxAccessCount?: number;
}

interface ShareLinkResponse {
    id: string;
    shareToken: string;
    shareUrl: string;
    permission: string;
    expiresAt: Date | null;
    hasPassword: boolean;
    maxAccessCount: number | null;
    accessCount: number;
    createdAt: Date;
}

class ShareService {
    /**
     * Create a share link for a file or folder
     */
    async createShareLink(
        resourceType: 'file' | 'folder',
        resourceId: string,
        userId: string,
        options: ShareOptions
    ): Promise<ShareLinkResponse> {
        // Verify user owns the resource
        if (resourceType === 'file') {
            const file = await File.findOne({ where: { id: resourceId, userId } });
            if (!file) {
                throw new Error('File not found or access denied');
            }
        } else {
            const folder = await Folder.findOne({ where: { id: resourceId, userId } });
            if (!folder) {
                throw new Error('Folder not found or access denied');
            }
        }

        // Validate expiration date
        if (options.expiresAt && options.expiresAt <= new Date()) {
            throw new Error('Expiration date must be in the future');
        }

        // Hash password if provided
        let passwordHash: string | null = null;
        if (options.password) {
            if (options.password.length < 8) {
                throw new Error('Password must be at least 8 characters');
            }
            passwordHash = await SharedLink.hashPassword(options.password);
            console.log('Password hashed successfully:', !!passwordHash);
        }

        // Generate token explicitly
        const shareToken = SharedLink.generateToken();
        console.log('Generated share token:', shareToken);

        // Create share link
        const shareLink = await SharedLink.create({
            resourceType,
            resourceId,
            sharedBy: userId,
            sharedWith: options.sharedWith || null,
            shareToken,
            permission: options.permission,
            passwordHash,
            expiresAt: options.expiresAt || null,
            maxAccessCount: options.maxAccessCount || null,
        });

        console.log('Created share link object:', shareLink.toJSON());

        return this.formatShareLinkResponse(shareLink);

        return this.formatShareLinkResponse(shareLink);
    }

    /**
     * Get files shared with a user
     */
    async getSharedWithMe(userId: string): Promise<any[]> {
        const shares = await SharedLink.findAll({
            where: {
                sharedWith: userId,
                isActive: true,
                resourceType: 'file',
            },
            include: [
                {
                    model: File,
                    as: 'file',
                    required: true,
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        return shares.map((share: any) => ({
            ...share.toJSON(),
            isExpired: share.isExpired(),
            isAccessLimitReached: share.isAccessLimitReached(),
        }));
    }

    /**
     * Get files shared by a user
     */
    async getSharedByMe(userId: string): Promise<any[]> {
        const shares = await SharedLink.findAll({
            where: {
                sharedBy: userId,
                isActive: true,
            },
            order: [['createdAt', 'DESC']],
        });

        return shares.map((share: any) => ({
            ...share.toJSON(),
            isExpired: share.isExpired(),
            isAccessLimitReached: share.isAccessLimitReached(),
        }));
    }

    /**
     * Access a shared file/folder via token
     */
    async accessSharedResource(token: string, password?: string): Promise<any> {
        const shareLink = await SharedLink.findOne({
            where: { shareToken: token },
        });

        if (!shareLink) {
            throw new Error('Share link not found');
        }

        // Validate share link
        if (!shareLink.isValid()) {
            if (!shareLink.isActive) {
                throw new Error('Share link has been revoked');
            }
            if (shareLink.isExpired()) {
                throw new Error('Share link has expired');
            }
            if (shareLink.isAccessLimitReached()) {
                throw new Error('Share link access limit reached');
            }
        }

        // Verify password if required
        if (shareLink.passwordHash) {
            if (!password) {
                throw new Error('Password required');
            }
            const isValid = await shareLink.verifyPassword(password);
            if (!isValid) {
                throw new Error('Invalid password');
            }
        }

        // Increment access count
        await shareLink.incrementAccessCount();

        // Get resource
        let resource;
        if (shareLink.resourceType === 'file') {
            resource = await File.findByPk(shareLink.resourceId);
        } else {
            resource = await Folder.findByPk(shareLink.resourceId);
        }

        if (!resource) {
            throw new Error('Resource not found');
        }

        return {
            shareLink: this.formatShareLinkResponse(shareLink),
            resource,
            permission: shareLink.permission,
        };
    }

    /**
     * Revoke a share link
     */
    async revokeShareLink(shareId: string, userId: string): Promise<void> {
        const shareLink = await SharedLink.findOne({
            where: { id: shareId, sharedBy: userId },
        });

        if (!shareLink) {
            throw new Error('Share link not found or access denied');
        }

        await shareLink.revoke();
    }

    /**
     * Update share link settings
     */
    async updateShareLink(
        shareId: string,
        userId: string,
        updates: Partial<ShareOptions>
    ): Promise<ShareLinkResponse> {
        const shareLink = await SharedLink.findOne({
            where: { id: shareId, sharedBy: userId },
        });

        if (!shareLink) {
            throw new Error('Share link not found or access denied');
        }

        // Update fields
        if (updates.permission) {
            shareLink.permission = updates.permission;
        }
        if (updates.expiresAt !== undefined) {
            shareLink.expiresAt = updates.expiresAt || null;
        }
        if (updates.maxAccessCount !== undefined) {
            shareLink.maxAccessCount = updates.maxAccessCount || null;
        }
        if (updates.password !== undefined) {
            if (updates.password) {
                shareLink.passwordHash = await SharedLink.hashPassword(updates.password);
            } else {
                shareLink.passwordHash = null;
            }
        }

        await shareLink.save();
        return this.formatShareLinkResponse(shareLink);
    }

    /**
     * Check if user can download a file
     */
    async canDownload(fileId: string, userId?: string): Promise<boolean> {
        // Check if user owns the file
        const file = await File.findByPk(fileId);
        if (!file) return false;
        if (file.userId === userId) return true;

        // Check if file is shared with user with download permission
        if (userId) {
            const share = await SharedLink.findOne({
                where: {
                    resourceId: fileId,
                    resourceType: 'file',
                    sharedWith: userId,
                    isActive: true,
                    permission: {
                        [Op.in]: ['download', 'edit'],
                    },
                },
            });

            if (share && share.isValid()) {
                return true;
            }
        }

        return false;
    }

    /**
     * Format share link response
     */
    private formatShareLinkResponse(shareLink: SharedLink): ShareLinkResponse {
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return {
            id: shareLink.id,
            shareToken: shareLink.shareToken,
            shareUrl: `${baseUrl}/share/${shareLink.shareToken}`,
            permission: shareLink.permission,
            expiresAt: shareLink.expiresAt,
            hasPassword: !!shareLink.passwordHash,
            maxAccessCount: shareLink.maxAccessCount,
            accessCount: shareLink.accessCount,
            createdAt: shareLink.createdAt,
        };
    }
    /**
     * Download shared file content
     */
    async downloadSharedFile(token: string, password?: string, isDownload: boolean = false): Promise<{ buffer: Buffer, filename: string, mimeType: string }> {
        const shareLink = await SharedLink.findOne({
            where: { shareToken: token },
        });

        if (!shareLink) {
            throw new Error('Share link not found');
        }

        // Validate share link
        if (!shareLink.isValid()) {
            if (!shareLink.isActive) throw new Error('Share link has been revoked');
            if (shareLink.isExpired()) throw new Error('Share link has expired');
            if (shareLink.isAccessLimitReached()) throw new Error('Share link access limit reached');
        }

        // Check download permission
        if (isDownload && shareLink.permission === 'view') {
            throw new Error('Download permission denied');
        }

        // Verify password if required
        if (shareLink.passwordHash) {
            if (!password) throw new Error('Password required');
            const isValid = await shareLink.verifyPassword(password);
            if (!isValid) throw new Error('Invalid password');
        }

        // Increment access count
        await shareLink.incrementAccessCount();

        if (shareLink.resourceType !== 'file') {
            throw new Error('Cannot download a folder directly');
        }

        const file = await File.findByPk(shareLink.resourceId);
        if (!file) {
            throw new Error('File not found');
        }

        const buffer = await storageService.readFile(file.path);
        return {
            buffer,
            filename: file.name,
            mimeType: file.mimeType,
        };
    }
}

export default new ShareService();
