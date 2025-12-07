import { Request, Response } from 'express';
import User from '../models/User';
import File from '../models/File';
import Folder from '../models/Folder';
import AuditLog from '../models/AuditLog';
import auditService from '../services/auditService';
import ApiResponse from '../utils/ApiResponse';
import { Op } from 'sequelize';

/**
 * Get system statistics
 * GET /api/admin/stats
 */
export const getSystemStats = async (req: Request, res: Response) => {
    try {
        // User statistics
        const totalUsers = await User.count();
        const adminUsers = await User.count({ where: { role: 'admin' } });

        // Active users (logged in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const activeUsers = await User.count({
            where: {
                updatedAt: {
                    [Op.gte]: thirtyDaysAgo,
                },
            },
        });

        // New users this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const newUsers = await User.count({
            where: {
                createdAt: {
                    [Op.gte]: startOfMonth,
                },
            },
        });

        // Storage statistics
        const storageStats = await User.findAll({
            attributes: [
                [User.sequelize!.fn('SUM', User.sequelize!.col('storage_used')), 'totalUsed'],
                [User.sequelize!.fn('SUM', User.sequelize!.col('storage_quota')), 'totalQuota'],
                [User.sequelize!.fn('AVG', User.sequelize!.col('storage_used')), 'averageUsed'],
            ],
            raw: true,
        });

        const storage = storageStats[0] as any;

        // File statistics
        const totalFiles = await File.count({ where: { isDeleted: false } });
        const imageFiles = await File.count({
            where: {
                isDeleted: false,
                mimeType: { [Op.like]: 'image/%' },
            },
        });
        const videoFiles = await File.count({
            where: {
                isDeleted: false,
                mimeType: { [Op.like]: 'video/%' },
            },
        });
        const documentFiles = totalFiles - imageFiles - videoFiles;

        // Activity in last 24 hours
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const recentUploads = await File.count({
            where: {
                createdAt: { [Op.gte]: yesterday },
            },
        });

        const stats = {
            users: {
                total: totalUsers,
                active: activeUsers,
                new: newUsers,
                admins: adminUsers,
            },
            storage: {
                total: parseInt(storage.totalUsed) || 0,
                average: parseInt(storage.averageUsed) || 0,
                quota: parseInt(storage.totalQuota) || 0,
                percentage: storage.totalQuota > 0
                    ? ((storage.totalUsed / storage.totalQuota) * 100).toFixed(2)
                    : 0,
            },
            files: {
                total: totalFiles,
                images: imageFiles,
                videos: videoFiles,
                documents: documentFiles,
            },
            activity: {
                uploads: recentUploads,
            },
        };

        return ApiResponse.success(stats, 'Statistics retrieved successfully').send(res);
    } catch (error: any) {
        console.error('Failed to get system stats:', error);
        return ApiResponse.error(500, error.message).send(res);
    }
};

/**
 * Get recent activity
 * GET /api/admin/activity
 */
export const getRecentActivity = async (req: Request, res: Response) => {
    try {
        const { limit = 50 } = req.query;

        const recentFiles = await File.findAll({
            where: { isDeleted: false },
            limit: parseInt(limit as string),
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: User,
                    as: 'owner',
                    attributes: ['id', 'name', 'email'],
                },
            ],
        });

        const activities = recentFiles.map(file => ({
            id: file.id,
            type: 'upload',
            userId: file.userId,
            userName: (file as any).owner?.name || 'Unknown',
            fileName: file.name,
            fileSize: file.size,
            timestamp: file.createdAt,
        }));

        return ApiResponse.success({ activities }, 'Activity retrieved successfully').send(res);
    } catch (error: any) {
        console.error('Failed to get recent activity:', error);
        return ApiResponse.error(500, error.message).send(res);
    }
};

/**
 * List all users (admin only)
 * GET /api/admin/users
 */
export const listUsers = async (req: Request, res: Response) => {
    try {
        const {
            page = 1,
            limit = 50,
            search = '',
            role = '',
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = req.query;

        const where: any = {};

        // Search by name or email
        if (search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } },
            ];
        }

        // Filter by role
        if (role && (role === 'admin' || role === 'user')) {
            where.role = role;
        }

        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

        const { rows: users, count: total } = await User.findAndCountAll({
            where,
            limit: parseInt(limit as string),
            offset,
            order: [[sortBy as string, sortOrder as string]],
            attributes: {
                include: [
                    [
                        User.sequelize!.literal(`(
                            SELECT COUNT(*)
                            FROM files
                            WHERE files."user_id" = "User"."id"
                            AND files."is_deleted" = false
                        )`),
                        'fileCount',
                    ],
                    [
                        User.sequelize!.literal(`(
                            SELECT COUNT(*)
                            FROM folders
                            WHERE folders."user_id" = "User"."id"
                            AND folders."is_deleted" = false
                        )`),
                        'folderCount',
                    ],
                ],
            },
        });

        return ApiResponse.success(
            {
                users: users.map(u => u.toJSON()),
                pagination: {
                    page: parseInt(page as string),
                    limit: parseInt(limit as string),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit as string)),
                },
            },
            'Users retrieved successfully'
        ).send(res);
    } catch (error: any) {
        console.error('Failed to list users:', error);
        return ApiResponse.error(500, error.message).send(res);
    }
};

/**
 * Update user quota
 * PUT /api/admin/users/:id/quota
 */
export const updateUserQuota = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { quota } = req.body;

        if (!quota || quota <= 0) {
            return ApiResponse.error(400, 'Invalid quota value').send(res);
        }

        const user = await User.findByPk(id);
        if (!user) {
            return ApiResponse.error(404, 'User not found').send(res);
        }

        // Validate quota >= current usage
        if (quota < user.storageUsed) {
            return ApiResponse.error(
                400,
                `Quota cannot be less than current usage (${user.storageUsed} bytes)`
            ).send(res);
        }

        const oldQuota = user.storageQuota;
        user.storageQuota = quota;
        await user.save();

        // Log the action
        await auditService.logAction(
            req.dbUser!.id,
            'quota_update',
            {
                oldQuota,
                newQuota: quota,
                userName: user.name,
            },
            req,
            user.id
        );

        return ApiResponse.success(
            { user: user.toJSON() },
            'User quota updated successfully'
        ).send(res);
    } catch (error: any) {
        console.error('Failed to update user quota:', error);
        return ApiResponse.error(500, error.message).send(res);
    }
};

/**
 * Update user role
 * PUT /api/admin/users/:id/role
 */
export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!role || !['user', 'admin'].includes(role)) {
            return ApiResponse.error(400, 'Invalid role').send(res);
        }

        // Cannot change your own role
        if (id === req.dbUser!.id) {
            return ApiResponse.error(400, 'Cannot change your own role').send(res);
        }

        const user = await User.findByPk(id);
        if (!user) {
            return ApiResponse.error(404, 'User not found').send(res);
        }

        // If demoting from admin, ensure at least one admin remains
        if (user.role === 'admin' && role === 'user') {
            const adminCount = await User.count({ where: { role: 'admin' } });
            if (adminCount <= 1) {
                return ApiResponse.error(400, 'Cannot demote the last admin').send(res);
            }
        }

        const oldRole = user.role;
        user.role = role;
        await user.save();

        // Log the action
        await auditService.logAction(
            req.dbUser!.id,
            'role_change',
            {
                oldRole,
                newRole: role,
                userName: user.name,
            },
            req,
            user.id
        );

        return ApiResponse.success(
            { user: user.toJSON() },
            'User role updated successfully'
        ).send(res);
    } catch (error: any) {
        console.error('Failed to update user role:', error);
        return ApiResponse.error(500, error.message).send(res);
    }
};

/**
 * Delete user
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Cannot delete yourself
        if (id === req.dbUser!.id) {
            return ApiResponse.error(400, 'Cannot delete your own account').send(res);
        }

        const user = await User.findByPk(id);
        if (!user) {
            return ApiResponse.error(404, 'User not found').send(res);
        }

        // Soft delete user's files and folders
        await File.update(
            { isDeleted: true },
            { where: { userId: id } }
        );
        await Folder.update(
            { isDeleted: true },
            { where: { userId: id } }
        );

        // Delete the user
        await user.destroy();

        // Log the action
        await auditService.logAction(
            req.dbUser!.id,
            'user_delete',
            {
                userName: user.name,
                userEmail: user.email,
                storageUsed: user.storageUsed,
            },
            req,
            user.id
        );

        return ApiResponse.success(null, 'User deleted successfully').send(res);
    } catch (error: any) {
        console.error('Failed to delete user:', error);
        return ApiResponse.error(500, error.message).send(res);
    }
};

/**
 * Get audit logs
 * GET /api/admin/audit-logs
 */
export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const {
            adminId,
            targetUserId,
            action,
            startDate,
            endDate,
            page,
            limit,
        } = req.query;

        const result = await auditService.getLogs({
            adminId: adminId as string,
            targetUserId: targetUserId as string,
            action: action as string,
            startDate: startDate ? new Date(startDate as string) : undefined,
            endDate: endDate ? new Date(endDate as string) : undefined,
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
        });

        return ApiResponse.success(result, 'Audit logs retrieved successfully').send(res);
    } catch (error: any) {
        console.error('Failed to get audit logs:', error);
        return ApiResponse.error(500, error.message).send(res);
    }
};
