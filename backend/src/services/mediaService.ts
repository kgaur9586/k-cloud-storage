import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { createRequire } from 'module';
import { logger } from '../utils/logger.js';

const require = createRequire(import.meta.url);
const ffmpeg = require('fluent-ffmpeg');

/**
 * Media Processing Service
 * Handles thumbnail generation and image/video optimization
 */
class MediaService {
  private thumbnailSizes = {
    small: { width: 150, height: 150 },
    medium: { width: 300, height: 300 },
    large: { width: 600, height: 600 },
  };

  /**
   * Generate thumbnail for a video
   */
  async generateVideoThumbnail(
    sourcePath: string,
    outputPath: string,
    size: 'small' | 'medium' | 'large' = 'medium'
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const { width, height } = this.thumbnailSizes[size];

      ffmpeg(sourcePath)
        .screenshots({
          timestamps: ['5%'], // Take screenshot at 5% of video duration
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: `${width}x${height}`,
        })
        .on('end', async () => {
          await logger.info('Video thumbnail generated', { outputPath, size });
          resolve();
        })
        .on('error', async (err) => {
          await logger.error('Failed to generate video thumbnail', { error: err.message, outputPath });
          reject(err);
        });
    });
  }

  /**
   * Extract metadata from video
   */
  async getVideoMetadata(filePath: string): Promise<{
    duration: number;
    width: number;
    height: number;
    format: string;
  }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          logger.error('Failed to extract video metadata', { error: err.message });
          reject(err);
          return;
        }

        const stream = metadata.streams.find(s => s.codec_type === 'video');

        resolve({
          duration: metadata.format.duration || 0,
          width: stream?.width || 0,
          height: stream?.height || 0,
          format: metadata.format.format_name || 'unknown',
        });
      });
    });
  }

  /**
   * Generate thumbnail for an image
   */
  async generateImageThumbnail(
    sourceBuffer: Buffer,
    outputPath: string,
    size: 'small' | 'medium' | 'large' = 'medium'
  ): Promise<void> {
    try {
      const { width, height } = this.thumbnailSizes[size];

      await sharp(sourceBuffer)
        .resize(width, height, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      await logger.info('Thumbnail generated', { outputPath, size });
    } catch (error) {
      await logger.error('Failed to generate thumbnail', { error, outputPath });
      throw new Error('Failed to generate thumbnail');
    }
  }

  /**
   * Optimize image
   */
  async optimizeImage(
    sourceBuffer: Buffer,
    outputPath: string,
    options: {
      quality?: number;
      maxWidth?: number;
      maxHeight?: number;
      format?: 'jpeg' | 'png' | 'webp';
    } = {}
  ): Promise<{ size: number; width: number; height: number }> {
    try {
      const {
        quality = 85,
        maxWidth = 2048,
        maxHeight = 2048,
        format = 'jpeg',
      } = options;

      let pipeline = sharp(sourceBuffer);

      // Get original metadata
      const metadata = await pipeline.metadata();

      // Resize if needed
      if (
        metadata.width &&
        metadata.height &&
        (metadata.width > maxWidth || metadata.height > maxHeight)
      ) {
        pipeline = pipeline.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      // Apply format-specific optimization
      switch (format) {
        case 'jpeg':
          pipeline = pipeline.jpeg({ quality, progressive: true });
          break;
        case 'png':
          pipeline = pipeline.png({ quality, compressionLevel: 9 });
          break;
        case 'webp':
          pipeline = pipeline.webp({ quality });
          break;
      }

      // Save optimized image
      const info = await pipeline.toFile(outputPath);

      await logger.info('Image optimized', {
        outputPath,
        originalSize: sourceBuffer.length,
        optimizedSize: info.size,
        format,
      });

      return {
        size: info.size,
        width: info.width,
        height: info.height,
      };
    } catch (error) {
      await logger.error('Failed to optimize image', { error, outputPath });
      throw new Error('Failed to optimize image');
    }
  }

  /**
   * Extract metadata from image
   */
  async getImageMetadata(buffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
    space: string;
    hasAlpha: boolean;
  }> {
    try {
      const metadata = await sharp(buffer).metadata();

      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        space: metadata.space || 'unknown',
        hasAlpha: metadata.hasAlpha || false,
      };
    } catch (error) {
      await logger.error('Failed to extract image metadata', { error });
      throw new Error('Failed to extract image metadata');
    }
  }

  /**
   * Check if file is an image
   */
  isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * Check if file is a video
   */
  isVideo(mimeType: string): boolean {
    return mimeType.startsWith('video/');
  }

  /**
   * Get supported image formats
   */
  getSupportedImageFormats(): string[] {
    return [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/tiff',
      'image/avif',
    ];
  }

  /**
   * Generate thumbnail path
   */
  generateThumbnailPath(originalPath: string, size: string = 'medium'): string {
    const ext = path.extname(originalPath);
    const basename = path.basename(originalPath, ext);
    const dirname = path.dirname(originalPath);

    return path.join(dirname, 'thumbnails', `${basename}_${size}.jpg`);
  }

  /**
   * Ensure thumbnail directory exists
   */
  async ensureThumbnailDir(filePath: string): Promise<void> {
    const thumbnailDir = path.join(path.dirname(filePath), 'thumbnails');
    await fs.mkdir(thumbnailDir, { recursive: true });
  }
}

export default new MediaService();
