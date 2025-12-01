import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IStorageProvider } from './IStorageProvider.js';
import { logger } from '../utils/logger.js';

/**
 * S3StorageProvider
 * Implements file storage using AWS S3
 */
export class S3StorageProvider implements IStorageProvider {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const bucketName = process.env.AWS_S3_BUCKET;

    if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error(
        'Missing required S3 configuration. Please set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET environment variables.'
      );
    }

    this.bucketName = bucketName;
    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    logger.info('S3StorageProvider initialized', { region, bucket: bucketName });
  }

  /**
   * Generate unique S3 key
   */
  private generateS3Key(userId: string, filename: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = filename.substring(filename.lastIndexOf('.'));
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
    
    // Sanitize filename
    const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '_');
    const uniqueFilename = `${sanitized}_${timestamp}_${random}${ext}`;
    
    return `${userId}/${uniqueFilename}`;
  }

  /**
   * Save file to S3
   */
  async saveFile(userId: string, fileBuffer: Buffer, filename: string): Promise<string> {
    const key = this.generateS3Key(userId, filename);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: this.getContentType(filename),
      Metadata: {
        originalFilename: filename,
        userId,
      },
    });

    try {
      await this.s3Client.send(command);
      await logger.info('File saved to S3', { userId, filename, key });
      return key;
    } catch (error: any) {
      await logger.error('Failed to save file to S3', { error: error.message, key });
      throw new Error(`Failed to save file to S3: ${error.message}`);
    }
  }

  /**
   * Read file from S3
   */
  async readFile(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      const response = await this.s3Client.send(command);
      
      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }
      
      return Buffer.concat(chunks);
    } catch (error: any) {
      await logger.error('Failed to read file from S3', { error: error.message, key });
      throw new Error(`Failed to read file from S3: ${error.message}`);
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
      await logger.info('File deleted from S3', { key });
    } catch (error: any) {
      await logger.error('Failed to delete file from S3', { error: error.message, key });
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  }

  /**
   * Check if file exists in S3
   */
  async fileExists(key: string): Promise<boolean> {
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get file stats from S3
   */
  async getFileStats(key: string): Promise<{ size: number; mtime: Date }> {
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      const response = await this.s3Client.send(command);
      return {
        size: response.ContentLength || 0,
        mtime: response.LastModified || new Date(),
      };
    } catch (error: any) {
      await logger.error('Failed to get file stats from S3', { error: error.message, key });
      throw new Error(`Failed to get file stats from S3: ${error.message}`);
    }
  }

  /**
   * Move file in S3 (copy and delete)
   */
  async moveFile(oldKey: string, newKey: string): Promise<void> {
    try {
      // S3 doesn't have a native "move" operation, so we copy and delete
      const copyCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: newKey,
        CopySource: `${this.bucketName}/${oldKey}`,
      });

      await this.s3Client.send(copyCommand as any);
      await this.deleteFile(oldKey);
      
      await logger.info('File moved in S3', { oldKey, newKey });
    } catch (error: any) {
      await logger.error('Failed to move file in S3', { error: error.message, oldKey, newKey });
      throw new Error(`Failed to move file in S3: ${error.message}`);
    }
  }

  /**
   * Get user storage usage from S3
   */
  async getUserStorageUsage(userId: string): Promise<number> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: `${userId}/`,
    });

    try {
      let totalSize = 0;
      let continuationToken: string | undefined;

      do {
        const response = await this.s3Client.send(
          continuationToken
            ? new ListObjectsV2Command({
                Bucket: this.bucketName,
                Prefix: `${userId}/`,
                ContinuationToken: continuationToken,
              })
            : command
        );

        if (response.Contents) {
          totalSize += response.Contents.reduce((sum, obj) => sum + (obj.Size || 0), 0);
        }

        continuationToken = response.NextContinuationToken;
      } while (continuationToken);

      return totalSize;
    } catch (error: any) {
      await logger.error('Failed to get user storage usage from S3', { error: error.message, userId });
      return 0;
    }
  }

  /**
   * Get content type based on file extension
   */
  private getContentType(filename: string): string {
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
      '.zip': 'application/zip',
    };

    return contentTypes[ext] || 'application/octet-stream';
  }

  /**
   * Generate presigned URL for direct download (optional utility)
   */
  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }
}
