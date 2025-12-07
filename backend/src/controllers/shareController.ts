import { Request, Response } from 'express';
import shareService from '../services/shareService.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * Create a share link for a file
 */
export const createFileShareLink = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.dbUser!.id;
        const { sharedWith, permission, expiresAt, password, maxAccessCount } = req.body;

        // Validate permission
        if (!['view', 'download', 'edit'].includes(permission)) {
            return ApiResponse.error(400, 'Invalid permission type').send(res);
        }

        const shareLink = await shareService.createShareLink('file', id, userId, {
            sharedWith,
            permission,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            password,
            maxAccessCount,
        });

        return ApiResponse.success(shareLink, 'Share link created successfully').send(res);
    } catch (error: any) {
        console.error('Create share link error:', error);
        return ApiResponse.error(400, error.message).send(res);
    }
};

/**
 * Get files shared with me
 */
export const getSharedWithMe = async (req: Request, res: Response) => {
    try {
        const userId = req.dbUser!.id;
        const shares = await shareService.getSharedWithMe(userId);
        return ApiResponse.success(shares).send(res);
    } catch (error: any) {
        console.error('Get shared with me error:', error);
        return ApiResponse.error(500, error.message).send(res);
    }
};

/**
 * Get files I've shared
 */
export const getSharedByMe = async (req: Request, res: Response) => {
    try {
        const userId = req.dbUser!.id;
        const shares = await shareService.getSharedByMe(userId);
        return ApiResponse.success(shares).send(res);
    } catch (error: any) {
        console.error('Get shared by me error:', error);
        return ApiResponse.error(500, error.message).send(res);
    }
};

/**
 * Access a shared resource (public endpoint)
 */
export const accessSharedResource = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const result = await shareService.accessSharedResource(token, password);
        return ApiResponse.success(result).send(res);
    } catch (error: any) {
        console.error('Access shared resource error:', error);
        const statusCode = error.message.includes('Password required') ? 401 : 400;
        return ApiResponse.error(statusCode, error.message).send(res);
    }
};

/**
 * Revoke a share link
 */
export const revokeShareLink = async (req: Request, res: Response) => {
    try {
        const { shareId } = req.params;
        const userId = req.dbUser!.id;

        await shareService.revokeShareLink(shareId, userId);
        return ApiResponse.success(null, 'Share link revoked successfully').send(res);
    } catch (error: any) {
        console.error('Revoke share link error:', error);
        return ApiResponse.error(400, error.message).send(res);
    }
};

/**
 * Update share link settings
 */
export const updateShareLink = async (req: Request, res: Response) => {
    try {
        const { shareId } = req.params;
        const userId = req.dbUser!.id;
        const updates = req.body;

        const shareLink = await shareService.updateShareLink(shareId, userId, updates);
        return ApiResponse.success(shareLink, 'Share link updated successfully').send(res);
    } catch (error: any) {
        console.error('Update share link error:', error);
        return ApiResponse.error(400, error.message).send(res);
    }
};

/**
 * Download shared file content (public)
 */
export const downloadSharedFile = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const { password } = req.body; // For POST request
        const { download } = req.query;

        const isDownload = download === 'true';

        const result = await shareService.downloadSharedFile(token, password, isDownload);

        res.setHeader('Content-Type', result.mimeType);
        const disposition = isDownload ? 'attachment' : 'inline';
        res.setHeader('Content-Disposition', `${disposition}; filename="${result.filename}"`);
        res.send(result.buffer);
    } catch (error: any) {
        console.error('Download shared file error:', error);
        const statusCode = error.message.includes('Password required') ? 401 : 400;
        return ApiResponse.error(statusCode, error.message).send(res);
    }
};
