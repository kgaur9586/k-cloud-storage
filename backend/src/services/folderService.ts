import Folder from '../models/Folder.js';
import File from '../models/File.js';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';
import { Op } from 'sequelize';

/**
 * FolderService
 * Business logic for folder operations
 */
class FolderService {
  /**
   * Create a new folder
   */
  async createFolder(userId: string, name: string, parentId?: string): Promise<Folder> {
    // Validate parent folder if provided
    if (parentId) {
      const parent = await Folder.findOne({
        where: { id: parentId, userId, isDeleted: false },
      });
      
      if (!parent) {
        throw new Error('Parent folder not found');
      }
    }

    // Generate folder path
    const path = await this.generateFolderPath(userId, name, parentId);

    // Check if folder with same path already exists
    const existing = await Folder.findOne({
      where: { userId, path, isDeleted: false },
    });

    if (existing) {
      throw new Error('Folder with this name already exists in the same location');
    }

    const folder = await Folder.create({
      userId,
      parentId: parentId || null,
      name,
      path,
    });

    await logger.info('Folder created', { userId, folderId: folder.id, name, path });
    return folder;
  }

  /**
   * Get folder by ID
   */
  async getFolderById(folderId: string, userId: string): Promise<Folder | null> {
    return await Folder.findOne({
      where: { id: folderId, userId, isDeleted: false },
    });
  }

  /**
   * List folders in a parent folder
   */
  async listFolders(userId: string, parentId?: string): Promise<Folder[]> {
    return await Folder.findAll({
      where: {
        userId,
        parentId: parentId || null,
        isDeleted: false,
      },
      order: [['name', 'ASC']],
    });
  }

  /**
   * Get folder tree for a user
   */
  async getFolderTree(userId: string): Promise<any[]> {
    // Get all folders for the user
    const folders = await Folder.findAll({
      where: { userId, isDeleted: false },
      order: [['path', 'ASC']],
    });

    // Build tree structure
    return this.buildTree(folders, null);
  }

  /**
   * Rename folder
   */
  async renameFolder(folderId: string, newName: string, userId: string): Promise<Folder> {
    const folder = await this.getFolderById(folderId, userId);
    
    if (!folder) {
      throw new Error('Folder not found');
    }

    // Generate new path
    const newPath = await this.generateFolderPath(userId, newName, folder.parentId || undefined);

    // Check for conflicts
    const existing = await Folder.findOne({
      where: {
        userId,
        path: newPath,
        isDeleted: false,
        id: { [Op.ne]: folderId },
      },
    });

    if (existing) {
      throw new Error('Folder with this name already exists in the same location');
    }

    const oldPath = folder.path;
    folder.name = newName;
    folder.path = newPath;
    await folder.save();

    // Update paths of all subfolders
    await this.updateSubfolderPaths(userId, oldPath, newPath);

    await logger.info('Folder renamed', { userId, folderId, oldName: folder.name, newName });
    return folder;
  }

  /**
   * Move folder to a new parent
   */
  async moveFolder(folderId: string, targetParentId: string | null, userId: string): Promise<Folder> {
    const folder = await this.getFolderById(folderId, userId);
    
    if (!folder) {
      throw new Error('Folder not found');
    }

    // Prevent moving folder into itself or its descendants
    if (targetParentId) {
      const targetParent = await this.getFolderById(targetParentId, userId);
      
      if (!targetParent) {
        throw new Error('Target parent folder not found');
      }

      if (targetParent.path.startsWith(folder.path)) {
        throw new Error('Cannot move folder into itself or its descendants');
      }
    }

    // Generate new path
    const newPath = await this.generateFolderPath(userId, folder.name, targetParentId || undefined);

    // Check for conflicts
    const existing = await Folder.findOne({
      where: {
        userId,
        path: newPath,
        isDeleted: false,
        id: { [Op.ne]: folderId },
      },
    });

    if (existing) {
      throw new Error('Folder with this name already exists in the target location');
    }

    const oldPath = folder.path;
    folder.parentId = targetParentId;
    folder.path = newPath;
    await folder.save();

    // Update paths of all subfolders
    await this.updateSubfolderPaths(userId, oldPath, newPath);

    await logger.info('Folder moved', { userId, folderId, oldPath, newPath });
    return folder;
  }

  /**
   * Delete folder (soft delete)
   */
  async deleteFolder(folderId: string, userId: string): Promise<void> {
    const folder = await this.getFolderById(folderId, userId);
    
    if (!folder) {
      throw new Error('Folder not found');
    }

    // Soft delete the folder
    folder.isDeleted = true;
    folder.deletedAt = new Date();
    await folder.save();

    // Soft delete all subfolders
    await Folder.update(
      { isDeleted: true, deletedAt: new Date() },
      {
        where: {
          userId,
          path: { [Op.like]: `${folder.path}/%` },
          isDeleted: false,
        },
      }
    );

    // Soft delete all files in this folder and subfolders
    await File.update(
      { isDeleted: true, deletedAt: new Date() },
      {
        where: {
          userId,
          [Op.or]: [
            { folderId },
            {
              folderId: {
                [Op.in]: await Folder.findAll({
                  where: {
                    userId,
                    path: { [Op.like]: `${folder.path}/%` },
                  },
                  attributes: ['id'],
                }).then(folders => folders.map(f => f.id)),
              },
            },
          ],
        },
      }
    );

    await logger.info('Folder deleted', { userId, folderId, path: folder.path });
  }

  /**
   * Calculate folder size (total size of all files)
   */
  async calculateFolderSize(folderId: string, userId: string): Promise<number> {
    const folder = await this.getFolderById(folderId, userId);
    
    if (!folder) {
      throw new Error('Folder not found');
    }

    // Get all subfolder IDs
    const subfolders = await Folder.findAll({
      where: {
        userId,
        path: { [Op.like]: `${folder.path}/%` },
        isDeleted: false,
      },
      attributes: ['id'],
    });

    const folderIds = [folderId, ...subfolders.map(f => f.id)];

    // Sum file sizes
    const result = await File.sum('size', {
      where: {
        userId,
        folderId: { [Op.in]: folderIds },
        isDeleted: false,
      },
    });

    return result || 0;
  }

  /**
   * Generate folder path based on parent
   */
  private async generateFolderPath(userId: string, name: string, parentId?: string): Promise<string> {
    if (!parentId) {
      return `/${name}`;
    }

    const parent = await Folder.findOne({
      where: { id: parentId, userId, isDeleted: false },
    });

    if (!parent) {
      throw new Error('Parent folder not found');
    }

    return `${parent.path}/${name}`;
  }

  /**
   * Update paths of all subfolders when parent path changes
   */
  private async updateSubfolderPaths(userId: string, oldPath: string, newPath: string): Promise<void> {
    const subfolders = await Folder.findAll({
      where: {
        userId,
        path: { [Op.like]: `${oldPath}/%` },
        isDeleted: false,
      },
    });

    for (const subfolder of subfolders) {
      subfolder.path = subfolder.path.replace(oldPath, newPath);
      await subfolder.save();
    }
  }

  /**
   * Build tree structure from flat folder list
   */
  private buildTree(folders: Folder[], parentId: string | null): any[] {
    const children = folders.filter(f => f.parentId === parentId);
    
    return children.map(folder => ({
      id: folder.id,
      name: folder.name,
      path: folder.path,
      parentId: folder.parentId,
      children: this.buildTree(folders, folder.id),
    }));
  }
}

export default new FolderService();
