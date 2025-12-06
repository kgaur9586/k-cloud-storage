import express from 'express';
import queueController from '../controllers/queueController.js';
import { requireAuth } from '../middleware/logto.js';

const router = express.Router();

// All queue routes require authentication
router.use(requireAuth);

/**
 * Queue monitoring routes
 */
router.get('/stats', queueController.getStats.bind(queueController));
router.get('/jobs', queueController.getJobs.bind(queueController));
router.post('/jobs/:jobId/retry', queueController.retryJob.bind(queueController));

export default router;
