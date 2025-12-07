import { Request } from 'express';
import AuditLog from '../models/AuditLog';

/**
 * Service for logging admin actions
 */
class AuditService {
    /**
     * Log an admin action
     */
    async logAction(
        adminId: string,
        action: string,
        details: object,
        req: Request,
        targetUserId?: string
    ): Promise<void> {
        try {
            await AuditLog.create({
                adminId,
                action,
                targetUserId,
                details,
                ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
                userAgent: req.headers['user-agent'] || 'unknown',
            });
        } catch (error) {
            console.error('Failed to log audit action:', error);
            // Don't throw - audit logging failure shouldn't break the main operation
        }
    }

    /**
     * Get audit logs with filtering
     */
    async getLogs(options: {
        adminId?: string;
        targetUserId?: string;
        action?: string;
        startDate?: Date;
        endDate?: Date;
        page?: number;
        limit?: number;
    }) {
        const {
            adminId,
            targetUserId,
            action,
            startDate,
            endDate,
            page = 1,
            limit = 50,
        } = options;

        const where: any = {};

        if (adminId) where.adminId = adminId;
        if (targetUserId) where.targetUserId = targetUserId;
        if (action) where.action = action;

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.$gte = startDate;
            if (endDate) where.createdAt.$lte = endDate;
        }

        const offset = (page - 1) * limit;

        const { rows: logs, count: total } = await AuditLog.findAndCountAll({
            where,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            include: [
                {
                    association: 'admin',
                    attributes: ['id', 'name', 'email'],
                },
                {
                    association: 'targetUser',
                    attributes: ['id', 'name', 'email'],
                    required: false,
                },
            ],
        });

        return {
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}

export default new AuditService();
