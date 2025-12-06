import { Worker, Job } from 'bullmq';
import { redisConfig } from '../../config/redis.js';
import { QueueName, JobName, GenerateThumbnailJob, ExtractMetadataJob, AnalyzeImageJob } from '../../types/queue.types.js';
import { logger } from '../../utils/logger.js';
import storageService from '../storageService.js';
import mediaService from '../mediaService.js';
import File from '../../models/File.js';

export class WorkerService {
    private fileProcessingWorker: Worker;

    constructor() {
        this.fileProcessingWorker = new Worker(
            QueueName.FILE_PROCESSING,
            this.processFileJob.bind(this),
            {
                connection: redisConfig,
                concurrency: 5, // Process up to 5 jobs concurrently
            }
        );

        this.setupEventHandlers();
        logger.info('WorkerService initialized');
    }

    /**
     * Process file processing jobs
     */
    private async processFileJob(job: Job) {
        logger.info(`Processing job ${job.name} for file ${job.data.fileId}`);

        switch (job.name) {
            case JobName.GENERATE_THUMBNAIL:
                await this.handleThumbnailGeneration(job.data);
                break;
            case JobName.EXTRACT_METADATA:
                await this.handleMetadataExtraction(job.data);
                break;
            case JobName.ANALYZE_IMAGE:
                await this.handleImageAnalysis(job.data);
                break;
            default:
                logger.warn(`Unknown job name: ${job.name}`);
        }
    }

    /**
     * Handle thumbnail generation job
     */
    private async handleThumbnailGeneration(data: GenerateThumbnailJob) {
        const { fileId, userId, path, mimeType, originalName } = data;

        try {
            // Get file buffer
            const fileBuffer = await storageService.readFile(path);

            // Initialize thumbnail path
            let thumbnailPath: string | null = null;
            let relativePath = path; // Assuming path is relative

            if (mimeType.startsWith('image/')) {
                try {
                    const thumbnailRelativePath = mediaService.generateThumbnailPath(relativePath);
                    const thumbnailAbsolutePath = await storageService.getAbsolutePath(thumbnailRelativePath);

                    await mediaService.ensureThumbnailDir(thumbnailAbsolutePath);
                    await mediaService.generateImageThumbnail(fileBuffer, thumbnailAbsolutePath, 'medium');
                    thumbnailPath = thumbnailRelativePath;

                    logger.info(`Image thumbnail generated successfully for file ${fileId}`);
                } catch (imageError: any) {
                    logger.error(`Failed to generate image thumbnail for file ${fileId}`, {
                        error: imageError.message,
                        stack: imageError.stack,
                        mimeType,
                        originalName,
                    });
                    // Don't throw - allow file to exist without thumbnail
                }
            } else if (mimeType.startsWith('video/')) {
                try {
                    const videoAbsolutePath = await storageService.getAbsolutePath(relativePath);
                    const thumbnailRelativePath = mediaService.generateThumbnailPath(relativePath);
                    const thumbnailAbsolutePath = await storageService.getAbsolutePath(thumbnailRelativePath);

                    await mediaService.ensureThumbnailDir(thumbnailAbsolutePath);
                    await mediaService.generateVideoThumbnail(videoAbsolutePath, thumbnailAbsolutePath, 'medium');
                    thumbnailPath = thumbnailRelativePath;

                    logger.info(`Video thumbnail generated successfully for file ${fileId}`);
                } catch (videoError: any) {
                    logger.error(`Failed to generate video thumbnail for file ${fileId}`, {
                        error: videoError.message,
                        stack: videoError.stack,
                        mimeType,
                        originalName,
                        hint: videoError.message.includes('ffmpeg') || videoError.message.includes('ffprobe')
                            ? 'FFmpeg may not be installed or not in PATH'
                            : undefined,
                    });
                    // Don't throw - allow file to exist without thumbnail
                }
            }

            if (thumbnailPath) {
                // Update file record with thumbnail
                const file = await File.findByPk(fileId);
                if (file) {
                    file.thumbnailPath = thumbnailPath;
                    await file.save();
                    logger.info(`Thumbnail path saved to database for file ${fileId}`);
                } else {
                    logger.warn(`File ${fileId} not found in database when saving thumbnail`);
                }
            } else {
                logger.info(`No thumbnail generated for file ${fileId}, file will be accessible without preview`);
            }
        } catch (error: any) {
            // Critical errors (file not found, storage issues, etc.)
            logger.error(`Critical error in thumbnail generation for file ${fileId}`, {
                error: error.message,
                stack: error.stack,
                mimeType,
                originalName,
            });

            // Only throw for critical errors that should trigger retry
            if (error.code === 'ENOENT') {
                logger.error(`File not found, will retry: ${path}`);
                throw error; // Retry for file not found
            }

            // For other errors, log but don't retry (file will exist without thumbnail)
            logger.warn(`Thumbnail generation failed but file upload succeeded for ${fileId}`);
        }
    }

    /**
     * Handle metadata extraction job
     */
    private async handleMetadataExtraction(data: ExtractMetadataJob) {
        const { fileId, userId, path, mimeType } = data;

        try {
            const aiService = (await import('../ai/aiService.js')).default;

            logger.info(`Extracting metadata for file ${fileId}`);

            const metadata = await aiService.extractMetadata(fileId, path, mimeType);

            // Update file with extracted metadata
            await aiService.updateFileWithAIData(fileId, {
                metadata,
            });

            logger.info(`Metadata extraction completed for file ${fileId}`);
        } catch (error: any) {
            logger.error(`Failed to extract metadata for file ${fileId}`, {
                error: error.message,
                stack: error.stack,
            });
            // Don't throw - metadata extraction is optional
        }
    }

    /**
     * Handle image analysis job
     */
    private async handleImageAnalysis(data: AnalyzeImageJob) {
        const { fileId, userId, path } = data;

        try {
            const aiService = (await import('../ai/aiService.js')).default;
            const storageService = (await import('../storageService.js')).default;

            logger.info(`Analyzing image for file ${fileId}`);

            // Read file buffer
            const buffer = await storageService.readFile(path);

            // Analyze image
            const analysis = await aiService.analyzeImage(fileId, buffer);

            // Update file with AI tags and data
            await aiService.updateFileWithAIData(fileId, {
                tags: analysis.tags,
                metadata: {
                    objects: analysis.objects,
                    colors: analysis.colors,
                    confidence: analysis.confidence,
                },
            });

            logger.info(`Image analysis completed for file ${fileId}`, {
                tags: analysis.tags,
                confidence: analysis.confidence,
            });
        } catch (error: any) {
            logger.error(`Failed to analyze image for file ${fileId}`, {
                error: error.message,
                stack: error.stack,
            });
            // Don't throw - AI analysis is optional
        }
    }

    /**
     * Setup event handlers for logging
     */
    private setupEventHandlers() {
        this.fileProcessingWorker.on('completed', (job) => {
            logger.info(`Job ${job.id} completed successfully`);
        });

        this.fileProcessingWorker.on('failed', (job, err) => {
            logger.error(`Job ${job?.id} failed`, { error: err.message });
        });
    }

    /**
     * Close worker
     */
    async close() {
        await this.fileProcessingWorker.close();
    }
}

export default new WorkerService();
