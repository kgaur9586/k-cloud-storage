import { Queue } from 'bullmq';
import { redisConfig } from '../../config/redis.js';
import { QueueName, JobName, GenerateThumbnailJob, ExtractMetadataJob, AnalyzeImageJob } from '../../types/queue.types.js';
import { logger } from '../../utils/logger.js';

class QueueService {
    private fileProcessingQueue: Queue;

    constructor() {
        this.fileProcessingQueue = new Queue(QueueName.FILE_PROCESSING, {
            connection: redisConfig,
        });

        logger.info('QueueService initialized');
    }

    /**
     * Add a job to generate a thumbnail
     */
    async addThumbnailJob(data: GenerateThumbnailJob) {
        await this.fileProcessingQueue.add(JobName.GENERATE_THUMBNAIL, data, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
        });
        logger.info(`Added thumbnail job for file: ${data.fileId}`);
    }

    /**
     * Add a job to extract metadata
     */
    async addMetadataJob(data: ExtractMetadataJob) {
        await this.fileProcessingQueue.add(JobName.EXTRACT_METADATA, data, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
        });
        logger.info(`Added metadata extraction job for file: ${data.fileId}`);
    }

    /**
     * Add a job to analyze image with AI
     */
    async addImageAnalysisJob(data: AnalyzeImageJob) {
        await this.fileProcessingQueue.add(JobName.ANALYZE_IMAGE, data, {
            attempts: 2,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
        });
        logger.info(`Added image analysis job for file: ${data.fileId}`);
    }

    /**
     * Close all queues
     */
    async close() {
        await this.fileProcessingQueue.close();
    }
}

export default new QueueService();
