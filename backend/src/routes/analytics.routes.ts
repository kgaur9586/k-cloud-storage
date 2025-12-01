import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController.js';
import { requireAuth, requireDbUser } from '../middleware/logto.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Storage analytics endpoints
 */

// Apply auth middleware to all routes
router.use(requireAuth);
router.use(requireDbUser);

/**
 * @swagger
 * /api/analytics:
 *   get:
 *     summary: Get comprehensive analytics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Complete analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overview:
 *                   type: object
 *                 byType:
 *                   type: object
 *                 byFolder:
 *                   type: array
 *                 largestFiles:
 *                   type: array
 *                 trends:
 *                   type: array
 */
router.get('/', analyticsController.getAnalytics);

/**
 * @swagger
 * /api/analytics/storage:
 *   get:
 *     summary: Get storage statistics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Storage statistics
 */
router.get('/storage', analyticsController.getStorageStats);

/**
 * @swagger
 * /api/analytics/by-type:
 *   get:
 *     summary: Get storage breakdown by file type
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Storage by type
 */
router.get('/by-type', analyticsController.getStorageByType);

/**
 * @swagger
 * /api/analytics/by-folder:
 *   get:
 *     summary: Get storage breakdown by folder
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Storage by folder
 */
router.get('/by-folder', analyticsController.getStorageByFolder);

/**
 * @swagger
 * /api/analytics/largest-files:
 *   get:
 *     summary: Get largest files
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Largest files
 */
router.get('/largest-files', analyticsController.getLargestFiles);

/**
 * @swagger
 * /api/analytics/trends:
 *   get:
 *     summary: Get storage trends
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Storage trends
 */
router.get('/trends', analyticsController.getStorageTrends);

export default router;
