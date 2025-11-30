import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';

/**
 * StorageService
 * Handles physical file system operations for file storage
 */
class StorageService {
  private baseStoragePath: string;

  constructor() {
    // Base path for file storage: backend/data/files
    this.baseStoragePath = path.join(process.cwd(), 'data', 'files');
  }

  /**
   * Ensure user storage directory exists
   */
  async ensureUserDirectory(userId: string): Promise<string> {
    const userPath = path.join(this.baseStoragePath, userId);
    
    try {
      await fs.access(userPath);
    } catch {
      // Directory doesn't exist, create it
      await fs.mkdir(userPath, { recursive: true });
      await logger.info('Created user storage directory', { userId, path: userPath });
    }
    
    return userPath;
  }

  /**
   * Save file to disk
   * @returns Relative path to the saved file
   */
  async saveFile(userId: string, fileBuffer: Buffer, filename: string): Promise<string> {
    await this.ensureUserDirectory(userId);
    
    // Generate unique filename to avoid collisions
    const uniqueFilename = this.generateUniqueFilename(filename);
    const relativePath = path.join(userId, uniqueFilename);
    const absolutePath = path.join(this.baseStoragePath, relativePath);
    
    await fs.writeFile(absolutePath, fileBuffer);
    await logger.info('File saved to storage', { userId, filename, path: relativePath });
    
    return relativePath;
  }

  /**
   * Get absolute file path
   */
  getAbsolutePath(relativePath: string): string {
    return path.join(this.baseStoragePath, relativePath);
  }

  /**
   * Read file from disk
   */
  async readFile(relativePath: string): Promise<Buffer> {
    const absolutePath = this.getAbsolutePath(relativePath);
    return await fs.readFile(absolutePath);
  }

  /**
   * Delete file from disk
   */
  async deleteFile(relativePath: string): Promise<void> {
    const absolutePath = this.getAbsolutePath(relativePath);
    
    try {
      await fs.unlink(absolutePath);
      await logger.info('File deleted from storage', { path: relativePath });
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        // Only throw if error is not "file not found"
        throw error;
      }
      await logger.warn('File not found during deletion', { path: relativePath });
    }
  }

  /**
   * Move file to new location
   */
  async moveFile(oldPath: string, newPath: string): Promise<void> {
    const oldAbsolutePath = this.getAbsolutePath(oldPath);
    const newAbsolutePath = this.getAbsolutePath(newPath);
    
    // Ensure target directory exists
    const targetDir = path.dirname(newAbsolutePath);
    await fs.mkdir(targetDir, { recursive: true });
    
    await fs.rename(oldAbsolutePath, newAbsolutePath);
    await logger.info('File moved in storage', { oldPath, newPath });
  }

  /**
   * Calculate SHA256 hash of file
   */
  async calculateHash(fileBuffer: Buffer): Promise<string> {
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  /**
   * Generate unique filename with timestamp
   */
  private generateUniqueFilename(originalFilename: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(originalFilename);
    const nameWithoutExt = path.basename(originalFilename, ext);
    
    // Sanitize filename
    const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '_');
    
    return `${sanitized}_${timestamp}_${random}${ext}`;
  }

  /**
   * Get file stats (size, etc.)
   */
  async getFileStats(relativePath: string): Promise<{ size: number; mtime: Date }> {
    const absolutePath = this.getAbsolutePath(relativePath);
    const stats = await fs.stat(absolutePath);
    
    return {
      size: stats.size,
      mtime: stats.mtime,
    };
  }

  /**
   * Check if file exists
   */
  async fileExists(relativePath: string): Promise<boolean> {
    const absolutePath = this.getAbsolutePath(relativePath);
    
    try {
      await fs.access(absolutePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get storage usage for a user
   */
  async getUserStorageUsage(userId: string): Promise<number> {
    const userPath = path.join(this.baseStoragePath, userId);
    
    try {
      return await this.getDirectorySize(userPath);
    } catch {
      return 0;
    }
  }

  /**
   * Recursively calculate directory size
   */
  private async getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          totalSize += await this.getDirectorySize(fullPath);
        } else {
          const stats = await fs.stat(fullPath);
          totalSize += stats.size;
        }
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    
    return totalSize;
  }
}

export default new StorageService();
