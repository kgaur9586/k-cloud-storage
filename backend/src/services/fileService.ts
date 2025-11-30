import File from '../models/File.js';
import Folder from '../models/Folder.js';
import User from '../models/User.js';
import storageService from './storageService.js';
import { logger } from '../utils/logger.js';
import { Op } from 'sequelize';

/**
 * FileService
 * Business logic for file operations
 */
class FileService {
  /**
   * Upload a file
   */
  async uploadFile(
    userId: string,
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    folderId?: string
  ): Promise<File> {
    // Validate folder if provided
    if (folderId) {
      const folder = await Folder.findOne({
        where: { id: folderId, userId, isDeleted: false },
      });
      
      if (!folder) {
        throw new Error('Folder not found');
      }
    }

    // Check storage quota
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const fileSize = fileBuffer.length;
    if (!user.hasAvailableStorage(fileSize)) {
      throw new Error('Storage quota exceeded');
    }

    // Calculate file hash
    const hash = await storageService.calculateHash(fileBuffer);

    // Save file to storage
    const relativePath = await storageService.saveFile(userId, fileBuffer, originalName);

    // Create file record
    const file = await File.create({
      userId,
      folderId: folderId || null,
      name: originalName,
      originalName,
      mimeType,
      size: fileSize,
      path: relativePath,
      hash,
    });

    // Update user storage usage
    user.storageUsed = Number(user.storageUsed) + fileSize;
    await user.save();

    await logger.info('File uploaded', {
      userId,
      fileId: file.id,
      filename: originalName,
      size: fileSize,
      mimeType,
    });

    return file;
  }

  /**
   * Get file by ID
   */
  async getFileById(fileId: string, userId: string): Promise<File | null> {
    return await File.findOne({
      where: { id: fileId, userId, isDeleted: false },
    });
  }

  /**
   * List files in a folder
   */
  async listFiles(
    userId: string,
    folderId?: string,
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      search?: string;
      mimeType?: string;
    } = {}
  ): Promise<{ files: File[]; total: number }> {
    const {
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      mimeType,
    } = options;

    const where: any = {
      userId,
      folderId: folderId || null,
      isDeleted: false,
    };

    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    if (mimeType) {
      where.mimeType = { [Op.like]: `${mimeType}%` };
    }

    const offset = (page - 1) * limit;

    const { rows: files, count: total } = await File.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
    });

    return { files, total };
  }

  /**
   * Download file (get file buffer)
   */
  async downloadFile(fileId: string, userId: string): Promise<{ file: File; buffer: Buffer }> {
    const file = await this.getFileById(fileId, userId);
    
    if (!file) {
      throw new Error('File not found');
    }

    const buffer = await storageService.readFile(file.path);

    await logger.info('File downloaded', { userId, fileId, filename: file.name });

    return { file, buffer };
  }

  /**
   * Rename file
   */
  async renameFile(fileId: string, newName: string, userId: string): Promise<File> {
    const file = await this.getFileById(fileId, userId);
    
    if (!file) {
      throw new Error('File not found');
    }

    // Check for name conflicts in the same folder
    const existing = await File.findOne({
      where: {
        userId,
        folderId: file.folderId,
        name: newName,
        isDeleted: false,
        id: { [Op.ne]: fileId },
      },
    });

    if (existing) {
      throw new Error('File with this name already exists in the same folder');
    }

    file.name = newName;
    await file.save();

    await logger.info('File renamed', { userId, fileId, oldName: file.name, newName });

    return file;
  }

  /**
   * Move file to a different folder
   */
  async moveFile(fileId: string, targetFolderId: string | null, userId: string): Promise<File> {
    const file = await this.getFileById(fileId, userId);
    
    if (!file) {
      throw new Error('File not found');
    }

    // Validate target folder if provided
    if (targetFolderId) {
      const targetFolder = await Folder.findOne({
        where: { id: targetFolderId, userId, isDeleted: false },
      });
      
      if (!targetFolder) {
        throw new Error('Target folder not found');
      }
    }

    // Check for name conflicts in target folder
    const existing = await File.findOne({
      where: {
        userId,
        folderId: targetFolderId,
        name: file.name,
        isDeleted: false,
        id: { [Op.ne]: fileId },
      },
    });

    if (existing) {
      throw new Error('File with this name already exists in the target folder');
    }

    file.folderId = targetFolderId;
    await file.save();

    await logger.info('File moved', { userId, fileId, targetFolderId });

    return file;
  }

  /**
   * Delete file (soft delete)
   */
  async deleteFile(fileId: string, userId: string): Promise<void> {
    const file = await this.getFileById(fileId, userId);
    
    if (!file) {
      throw new Error('File not found');
    }

    // Soft delete
    file.isDeleted = true;
    file.deletedAt = new Date();
    await file.save();

    // Update user storage usage
    const user = await User.findByPk(userId);
    if (user) {
      user.storageUsed = Math.max(0, Number(user.storageUsed) - Number(file.size));
      await user.save();
    }

    await logger.info('File deleted', { userId, fileId, filename: file.name });
  }

  /**
   * Permanently delete file (hard delete)
   */
  async permanentlyDeleteFile(fileId: string, userId: string): Promise<void> {
    const file = await File.findOne({
      where: { id: fileId, userId },
    });
    
    if (!file) {
      throw new Error('File not found');
    }

    // Delete physical file
    await storageService.deleteFile(file.path);

    // Delete database record
    await file.destroy();

    await logger.info('File permanently deleted', { userId, fileId, filename: file.name });
  }

  /**
   * Find duplicate files by hash
   */
  async findDuplicates(userId: string): Promise<Map<string, File[]>> {
    const files = await File.findAll({
      where: { userId, isDeleted: false },
      order: [['hash', 'ASC'], ['createdAt', 'ASC']],
    });

    const duplicates = new Map<string, File[]>();

    for (const file of files) {
      if (!duplicates.has(file.hash)) {
        duplicates.set(file.hash, []);
      }
      duplicates.get(file.hash)!.push(file);
    }

    // Filter out hashes with only one file
    for (const [hash, fileList] of duplicates.entries()) {
      if (fileList.length === 1) {
        duplicates.delete(hash);
      }
    }

    return duplicates;
  }

  /**
   * Get file statistics for a user
   */
  async getFileStats(userId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    filesByType: Record<string, number>;
  }> {
    const files = await File.findAll({
      where: { userId, isDeleted: false },
      attributes: ['mimeType', 'size'],
    });

    const filesByType: Record<string, number> = {};
    let totalSize = 0;

    for (const file of files) {
      const type = file.mimeType.split('/')[0] || 'other';
      filesByType[type] = (filesByType[type] || 0) + 1;
      totalSize += Number(file.size);
    }

    return {
      totalFiles: files.length,
      totalSize,
      filesByType,
    };
  }
}

export default new FileService();
