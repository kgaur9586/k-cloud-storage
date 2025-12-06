import FileVersion from '../models/FileVersion.js';
import File from '../models/File.js';
import Folder from '../models/Folder.js';
import User from '../models/User.js';
import storageService from './storageService.js';
import { logger } from '../utils/logger.js';
import { Op } from 'sequelize';
import queueService from './queue/queueService.js';

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

    // Check for existing file with same name in folder
    const existingFile = await File.findOne({
      where: {
        userId,
        folderId: folderId || null,
        name: originalName,
        isDeleted: false,
      },
    });

    // Calculate file hash
    const hash = await storageService.calculateHash(fileBuffer);

    // Save file to storage
    // If versioning, we might want to append a timestamp or version to the filename in storage to avoid overwriting?
    // storageService.saveFile uses a UUID-based path usually, let's check.
    // storageService.saveFile(userId, buffer, originalName) -> returns relative path
    // It seems storageService handles unique paths.
    const relativePath = await storageService.saveFile(userId, fileBuffer, originalName);

    // Initialize metadata and thumbnail path
    let metadata: Record<string, any> | null = null;
    let thumbnailPath: string | null = null;

    // NOTE: Media processing is now handled by the background worker
    // We just save the file and trigger the job

    if (existingFile) {
      // Create version for current state
      await FileVersion.create({
        fileId: existingFile.id,
        versionNumber: existingFile.currentVersion || 1,
        path: existingFile.path,
        size: existingFile.size,
        mimeType: existingFile.mimeType,
        createdBy: userId,
      });

      // Update existing file
      existingFile.size = fileSize;
      existingFile.path = relativePath;
      existingFile.mimeType = mimeType;
      existingFile.hash = hash;
      existingFile.thumbnailPath = null; // Reset thumbnail, will be regenerated
      existingFile.metadata = null; // Reset metadata
      existingFile.currentVersion = (existingFile.currentVersion || 1) + 1;

      await existingFile.save();

      // Trigger background processing
      if (mimeType.startsWith('image/') || mimeType.startsWith('video/')) {
        await queueService.addThumbnailJob({
          fileId: existingFile.id,
          userId,
          path: relativePath,
          mimeType,
          originalName,
        });
      }

      await logger.info('File version updated', {
        userId,
        fileId: existingFile.id,
        version: existingFile.currentVersion,
        filename: originalName,
      });

      return existingFile;
    }

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
      thumbnailPath: null,
      metadata: null,
      currentVersion: 1,
    });

    // Trigger background processing
    if (mimeType.startsWith('image/') || mimeType.startsWith('video/')) {
      await queueService.addThumbnailJob({
        fileId: file.id,
        userId,
        path: relativePath,
        mimeType,
        originalName,
      });
    } else {
      await logger.info('Skipping background processing for file type', {
        fileId: file.id,
        mimeType,
        filename: originalName,
      });
    }

    // Update user storage usage
    user.storageUsed = Number(user.storageUsed) + fileSize;
    await user.save();

    await logger.info('File uploaded', {
      userId,
      fileId: file.id,
      filename: originalName,
      size: fileSize,
      mimeType,
      hasThumbnail: false, // Will be generated in background
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
      isDeleted: false,
    };

    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
      // When searching, we ignore folderId to search globally
    } else {
      where.folderId = folderId || null;
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

  /**
   * Toggle file visibility (public/private)
   */
  async toggleFileVisibility(fileId: string, userId: string, isPublic: boolean): Promise<File> {
    const file = await File.findOne({
      where: { id: fileId, userId, isDeleted: false },
    });

    if (!file) {
      throw new Error('File not found');
    }

    // Generate share token if making public and doesn't have one
    if (isPublic && !file.shareToken) {
      const { v4: uuidv4 } = await import('uuid');
      file.shareToken = uuidv4();
    }

    // Clear share token if making private
    if (!isPublic) {
      file.shareToken = null;
      file.publicAccessCount = 0;
    }

    file.isPublic = isPublic;
    await file.save();

    await logger.info('File visibility toggled', { fileId, userId, isPublic });
    return file;
  }

  /**
   * Get public file by share token
   */
  async getPublicFile(shareToken: string): Promise<File> {
    const file = await File.findOne({
      where: {
        shareToken,
        isPublic: true,
        isDeleted: false
      },
    });

    if (!file) {
      throw new Error('Public file not found');
    }

    // Increment access count
    file.publicAccessCount = (file.publicAccessCount || 0) + 1;
    await file.save();

    await logger.info('Public file accessed', { fileId: file.id, shareToken });
    return file;
  }

  /**
   * Get share link for a file
   */
  async getShareLink(fileId: string, userId: string): Promise<{ shareLink: string; shareToken: string }> {
    const file = await File.findOne({
      where: { id: fileId, userId, isDeleted: false },
    });

    if (!file) {
      throw new Error('File not found');
    }

    if (!file.isPublic) {
      throw new Error('File is not public');
    }

    if (!file.shareToken) {
      throw new Error('File does not have a share token');
    }

    const baseUrl = process.env.API_URL || 'http://localhost:3000';
    const shareLink = `${baseUrl}/api/public/files/${file.shareToken}`;

    return { shareLink, shareToken: file.shareToken };
  }


  /**
   * Get file versions
   */
  async getVersions(fileId: string, userId: string): Promise<FileVersion[]> {
    const file = await this.getFileById(fileId, userId);

    if (!file) {
      throw new Error('File not found');
    }

    return await FileVersion.findAll({
      where: { fileId },
      order: [['versionNumber', 'DESC']],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
  }

  /**
   * Restore file version
   */
  async restoreVersion(fileId: string, versionId: string, userId: string): Promise<File> {
    const file = await this.getFileById(fileId, userId);

    if (!file) {
      throw new Error('File not found');
    }

    const version = await FileVersion.findOne({
      where: { id: versionId, fileId },
    });

    if (!version) {
      throw new Error('Version not found');
    }

    // Create a new version for the CURRENT state before restoring
    await FileVersion.create({
      fileId: file.id,
      versionNumber: file.currentVersion,
      path: file.path,
      size: file.size,
      mimeType: file.mimeType,
      createdBy: userId,
    });

    // Update file to point to the restored version's path
    // Note: We are NOT copying the file content, just pointing to the old path.
    // This means if we delete the version later, we might break the file if we are not careful.
    // But for now, we assume paths are immutable in storage.

    // Wait, if we restore, we should probably COPY the content to a new path so it becomes the "latest" 
    // and independent of the version record?
    // Or just point to it. If we point to it, we must ensure we don't delete the file when deleting the version record.
    // Let's copy it to be safe and treat it as a "new" upload of the old content.

    const versionBuffer = await storageService.readFile(version.path);
    const newPath = await storageService.saveFile(userId, versionBuffer, file.name);

    file.path = newPath;
    file.size = version.size;
    file.mimeType = version.mimeType;
    file.currentVersion = file.currentVersion + 1;

    // We might want to regenerate thumbnail if it's an image/video
    // For now, let's clear it or try to find if the version had one (we don't store version thumbnails yet)
    file.thumbnailPath = null;

    await file.save();

    await logger.info('File version restored', {
      userId,
      fileId: file.id,
      restoredFromVersion: version.versionNumber,
      newVersion: file.currentVersion,
    });

    return file;
  }
}

export default new FileService();
