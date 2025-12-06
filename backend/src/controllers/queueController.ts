import { Request, Response } from 'express';
import { Queue } from 'bullmq';
import { redisConfig } from '../config/redis.js';
import { QueueName } from '../types/queue.types.js';
import { logger } from '../utils/logger.js';

/**
 * Queue Controller
 * Provides endpoints for monitoring and managing background job queues
 */
class QueueController {
    private fileProcessingQueue: Queue;

    constructor() {
        this.fileProcessingQueue = new Queue(QueueName.FILE_PROCESSING, {
            connection: redisConfig,
        });
    }

    /**
     * Get queue statistics
     * GET /api/queue/stats
     */
    async getStats(req: Request, res: Response) {
        try {
            const [waiting, active, completed, failed, delayed] = await Promise.all([
                this.fileProcessingQueue.getWaitingCount(),
                this.fileProcessingQueue.getActiveCount(),
                this.fileProcessingQueue.getCompletedCount(),
                this.fileProcessingQueue.getFailedCount(),
                this.fileProcessingQueue.getDelayedCount(),
            ]);

            const stats = {
                queue: QueueName.FILE_PROCESSING,
                counts: {
                    waiting,
                    active,
                    completed,
                    failed,
                    delayed,
                    total: waiting + active + completed + failed + delayed,
                },
                health: failed > 10 ? 'unhealthy' : active > 50 ? 'busy' : 'healthy',
            };

            logger.info('Queue stats retrieved', { stats });

            res.json({
                status: 'success',
                data: stats,
            });
        } catch (error: any) {
            logger.error('Failed to get queue stats', { error: error.message });
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve queue statistics',
            });
        }
    }

    /**
     * Get recent jobs
     * GET /api/queue/jobs?status=failed&limit=10
     */
    async getJobs(req: Request, res: Response) {
        try {
            const status = (req.query.status as string) || 'failed';
            const limit = parseInt(req.query.limit as string) || 10;

            let jobs;
            switch (status) {
                case 'failed':
                    jobs = await this.fileProcessingQueue.getFailed(0, limit - 1);
                    break;
                case 'completed':
                    jobs = await this.fileProcessingQueue.getCompleted(0, limit - 1);
                    break;
                case 'active':
                    jobs = await this.fileProcessingQueue.getActive(0, limit - 1);
                    break;
                case 'waiting':
                    jobs = await this.fileProcessingQueue.getWaiting(0, limit - 1);
                    break;
                default:
                    jobs = await this.fileProcessingQueue.getFailed(0, limit - 1);
            }

            const jobData = jobs.map((job) => ({
                id: job.id,
                name: job.name,
                data: job.data,
                timestamp: job.timestamp,
                processedOn: job.processedOn,
                finishedOn: job.finishedOn,
                failedReason: job.failedReason,
                attemptsMade: job.attemptsMade,
            }));

            res.json({
                status: 'success',
                data: {
                    jobs: jobData,
                    count: jobData.length,
                },
            });
        } catch (error: any) {
            logger.error('Failed to get jobs', { error: error.message });
            res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve jobs',
            });
        }
    }

    /**
     * Retry a failed job
     * POST /api/queue/jobs/:jobId/retry
     */
    async retryJob(req: Request, res: Response) {
        try {
            const { jobId } = req.params;

            const job = await this.fileProcessingQueue.getJob(jobId);
            if (!job) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Job not found',
                });
            }

            await job.retry();

            logger.info(`Job ${jobId} retried`);

            res.json({
                status: 'success',
                message: 'Job retried successfully',
                data: {
                    jobId,
                },
            });
        } catch (error: any) {
            logger.error('Failed to retry job', { error: error.message });
            res.status(500).json({
                status: 'error',
                message: 'Failed to retry job',
            });
        }
    }
}

export default new QueueController();
