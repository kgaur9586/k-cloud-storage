/**
 * Queue names
 */
export enum QueueName {
    FILE_PROCESSING = 'file-processing',
    AI_ANALYSIS = 'ai-analysis',
}

/**
 * Job names
 */
export enum JobName {
    GENERATE_THUMBNAIL = 'generate-thumbnail',
    EXTRACT_METADATA = 'extract-metadata',
    TRANSCODE_VIDEO = 'transcode-video',
    ANALYZE_IMAGE = 'analyze-image',
}

/**
 * Job payloads
 */
export interface GenerateThumbnailJob {
    fileId: string;
    userId: string;
    path: string;
    mimeType: string;
    originalName: string;
}

export interface ExtractMetadataJob {
    fileId: string;
    userId: string;
    path: string;
    mimeType: string;
}

export interface AnalyzeImageJob {
    fileId: string;
    userId: string;
    path: string;
    mimeType: string;
}

export interface FileProcessingJob {
    type: JobName;
    payload: GenerateThumbnailJob | ExtractMetadataJob | AnalyzeImageJob;
}
