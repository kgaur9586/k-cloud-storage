import File from '../models/File.js';
import Folder from '../models/Folder.js';
import { logger } from '../utils/logger.js';
import { Op } from 'sequelize';
import storageService from './storageService.js';

/**
 * Trash Service
 * Handles trash/recycle bin operations
 */
class TrashService {
  /**
   * Get all trashed items for a user
   */
  async getTrashItems(userId: string) {
    const [files, folders] = await Promise.all([
      File.findAll({
        where: {
          userId,
          isDeleted: true,
        },
        order: [['deletedAt', 'DESC']],
      }),
      Folder.findAll({
        where: {
          userId,
          isDeleted: true,
        },
        order: [['deletedAt', 'DESC']],
      }),
    ]);

    return {
      files: files.map(f => f.toJSON()),
      folders: folders.map(f => f.toJSON()),
    };
  }

  /**
   * Restore a file from trash
   */
  async restoreFile(fileId: string, userId: string) {
    const file = await File.findOne({
      where: { id: fileId, userId, isDeleted: true },
    });

    if (!file) {
      throw new Error('File not found in trash');
    }

    file.isDeleted = false;
    file.deletedAt = null;
    await file.save();

    await logger.info('File restored from trash', { fileId, userId });
    return file.toJSON();
  }

  /**
   * Restore a folder from trash
   */
  async restoreFolder(folderId: string, userId: string) {
    const folder = await Folder.findOne({
      where: { id: folderId, userId, isDeleted: true },
    });

    if (!folder) {
      throw new Error('Folder not found in trash');
    }

    folder.isDeleted = false;
    folder.deletedAt = null;
    await folder.save();

    await logger.info('Folder restored from trash', { folderId, userId });
    return folder.toJSON();
  }

  /**
   * Permanently delete a file
   */
  async permanentlyDeleteFile(fileId: string, userId: string) {
    const file = await File.findOne({
      where: { id: fileId, userId, isDeleted: true },
    });

    if (!file) {
      throw new Error('File not found in trash');
    }

    // Delete physical file
    try {
      await storageService.deleteFile(file.path);
      if (file.thumbnailPath) {
        await storageService.deleteFile(file.thumbnailPath);
      }
    } catch (error) {
      await logger.error('Failed to delete physical file', { fileId, error });
    }

    // Delete database record
    await file.destroy();

    await logger.info('File permanently deleted', { fileId, userId });
  }

  /**
   * Permanently delete a folder and all its contents
   */
  async permanentlyDeleteFolder(folderId: string, userId: string) {
    const folder = await Folder.findOne({
      where: { id: folderId, userId, isDeleted: true },
    });

    if (!folder) {
      throw new Error('Folder not found in trash');
    }

    // Find all files in this folder (including subfolders)
    const files = await File.findAll({
      where: {
        userId,
        isDeleted: true,
        path: {
          [Op.like]: `${folder.path}%`,
        },
      },
    });

    // Delete all physical files
    for (const file of files) {
      try {
        await storageService.deleteFile(file.path);
        if (file.thumbnailPath) {
          await storageService.deleteFile(file.thumbnailPath);
        }
        await file.destroy();
      } catch (error) {
        await logger.error('Failed to delete file in folder', { fileId: file.id, error });
      }
    }

    // Find and delete all subfolders
    const subfolders = await Folder.findAll({
      where: {
        userId,
        isDeleted: true,
        path: {
          [Op.like]: `${folder.path}%`,
        },
      },
    });

    for (const subfolder of subfolders) {
      await subfolder.destroy();
    }

    // Delete the folder itself
    await folder.destroy();

    await logger.info('Folder permanently deleted', { folderId, userId, filesDeleted: files.length });
  }

  /**
   * Empty entire trash for a user
   */
  async emptyTrash(userId: string) {
    // Get all trashed items
    const { files, folders } = await this.getTrashItems(userId);

    let deletedFiles = 0;
    let deletedFolders = 0;

    // Delete all files
    for (const file of files) {
      try {
        await this.permanentlyDeleteFile(file.id, userId);
        deletedFiles++;
      } catch (error) {
        await logger.error('Failed to delete file from trash', { fileId: file.id, error });
      }
    }

    // Delete all folders
    for (const folder of folders) {
      try {
        await this.permanentlyDeleteFolder(folder.id, userId);
        deletedFolders++;
      } catch (error) {
        await logger.error('Failed to delete folder from trash', { folderId: folder.id, error });
      }
    }

    await logger.info('Trash emptied', { userId, deletedFiles, deletedFolders });

    return { deletedFiles, deletedFolders };
  }

  /**
   * Auto-cleanup old trash items (older than 30 days)
   */
  async autoCleanup() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [files, folders] = await Promise.all([
      File.findAll({
        where: {
          isDeleted: true,
          deletedAt: {
            [Op.lt]: thirtyDaysAgo,
          },
        },
      }),
      Folder.findAll({
        where: {
          isDeleted: true,
          deletedAt: {
            [Op.lt]: thirtyDaysAgo,
          },
        },
      }),
    ]);

    let deletedCount = 0;

    // Delete old files
    for (const file of files) {
      try {
        await storageService.deleteFile(file.path);
        if (file.thumbnailPath) {
          await storageService.deleteFile(file.thumbnailPath);
        }
        await file.destroy();
        deletedCount++;
      } catch (error) {
        await logger.error('Failed to auto-cleanup file', { fileId: file.id, error });
      }
    }

    // Delete old folders
    for (const folder of folders) {
      try {
        await folder.destroy();
        deletedCount++;
      } catch (error) {
        await logger.error('Failed to auto-cleanup folder', { folderId: folder.id, error });
      }
    }

    await logger.info('Auto-cleanup completed', { deletedCount });
    return deletedCount;
  }
}

export default new TrashService();
