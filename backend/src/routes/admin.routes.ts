import express from 'express';
import { requireAuth, requireDbUser } from '../middleware/logto.js';
import { requireAdmin } from '../middleware/roleCheck.js';
import {
    getSystemStats,
    getRecentActivity,
    listUsers,
    updateUserQuota,
    updateUserRole,
    deleteUser,
    getAuditLogs,
} from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(requireAuth, requireDbUser, requireAdmin);

// System statistics and activity
router.get('/stats', getSystemStats);
router.get('/activity', getRecentActivity);

// User management
router.get('/users', listUsers);
router.put('/users/:id/quota', updateUserQuota);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Audit logs
router.get('/audit-logs', getAuditLogs);

export default router;
