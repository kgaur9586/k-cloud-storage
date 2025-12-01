import crypto from 'crypto';
import { StorageProviderFactory } from '../storage/StorageProviderFactory.js';
import { IStorageProvider } from '../storage/IStorageProvider.js';

/**
 * StorageService
 * Facade for file storage operations using pluggable storage providers
 */
class StorageService {
  private provider: IStorageProvider;

  constructor() {
    this.provider = StorageProviderFactory.getProvider();
  }

  /**
   * Save file to storage
   */
  async saveFile(userId: string, fileBuffer: Buffer, filename: string): Promise<string> {
    return await this.provider.saveFile(userId, fileBuffer, filename);
  }

  /**
   * Read file from storage
   */
  async readFile(path: string): Promise<Buffer> {
    return await this.provider.readFile(path);
  }

  /**
   * Delete file from storage
   */
  async deleteFile(path: string): Promise<void> {
    return await this.provider.deleteFile(path);
  }

  /**
   * Check if file exists in storage
   */
  async fileExists(path: string): Promise<boolean> {
    return await this.provider.fileExists(path);
  }

  /**
   * Get file statistics
   */
  async getFileStats(path: string): Promise<{ size: number; mtime: Date }> {
    return await this.provider.getFileStats(path);
  }

  /**
   * Move file to new location
   */
  async moveFile(oldPath: string, newPath: string): Promise<void> {
    if (this.provider.moveFile) {
      return await this.provider.moveFile(oldPath, newPath);
    }
    throw new Error('Move operation not supported by current storage provider');
  }

  /**
   * Get user storage usage
   */
  async getUserStorageUsage(userId: string): Promise<number> {
    if (this.provider.getUserStorageUsage) {
      return await this.provider.getUserStorageUsage(userId);
    }
    return 0;
  }

  /**
   * Calculate file hash (SHA-256)
   */
  calculateHash(buffer: Buffer): Promise<string> {
    return Promise.resolve(
      crypto.createHash('sha256').update(buffer).digest('hex')
    );
  }

  /**
   * Get absolute path from relative path
   */
  async getAbsolutePath(relativePath: string): Promise<string> {
    return await this.provider.getAbsolutePath(relativePath);
  }
}

export default new StorageService();
