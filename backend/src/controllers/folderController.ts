import { Request, Response } from 'express';
import folderService from '../services/folderService.js';
import ApiResponse from '../utils/ApiResponse.js';
import { FolderResponseSchema, FolderTreeResponseSchema, FolderListResponseSchema } from '@k-cloud/shared';

/**
 * Create folder
 * POST /api/folders
 */
export const createFolder = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;
    const { name, parentId } = req.body;

    if (!name) {
      return ApiResponse.error(400, 'Folder name is required').send(res);
    }

    const folder = await folderService.createFolder(userId, name, parentId);

    return ApiResponse.success(
      folder.toJSON(),
      'Folder created successfully',
      201,
      {},
      FolderResponseSchema
    ).send(res);
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 
                       error.message.includes('already exists') ? 409 : 500;
    return ApiResponse.error(statusCode, error.message).send(res);
  }
};

/**
 * Get folder metadata
 * GET /api/folders/:id
 */
export const getFolder = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;
    const { id } = req.params;

    const folder = await folderService.getFolderById(id, userId);

    if (!folder) {
      return ApiResponse.error(404, 'Folder not found').send(res);
    }

    return ApiResponse.success(
      folder.toJSON(),
      'Folder retrieved successfully',
      200,
      {},
      FolderResponseSchema
    ).send(res);
  } catch (error: any) {
    return ApiResponse.error(500, error.message).send(res);
  }
};

/**
 * List folders
 * GET /api/folders
 */
export const listFolders = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;
    const { parentId, search } = req.query;

    const folders = await folderService.listFolders(userId, parentId as string, search as string);

    const response = {
      folders: folders.map(f => f.toJSON()),
    };

    return ApiResponse.success(
      response,
      'Folders retrieved successfully',
      200,
      {},
      FolderListResponseSchema
    ).send(res);
  } catch (error: any) {
    return ApiResponse.error(500, error.message).send(res);
  }
};

/**
 * Get folder tree
 * GET /api/folders/tree
 */
export const getFolderTree = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;

    const tree = await folderService.getFolderTree(userId);

    const response = {
      root: tree,
    };

    return ApiResponse.success(
      response,
      'Folder tree retrieved successfully',
      200,
      {},
      FolderTreeResponseSchema
    ).send(res);
  } catch (error: any) {
    return ApiResponse.error(500, error.message).send(res);
  }
};

/**
 * Rename folder
 * PUT /api/folders/:id
 */
export const renameFolder = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return ApiResponse.error(400, 'Folder name is required').send(res);
    }

    const folder = await folderService.renameFolder(id, name, userId);

    return ApiResponse.success(
      folder.toJSON(),
      'Folder renamed successfully',
      200,
      {},
      FolderResponseSchema
    ).send(res);
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 
                       error.message.includes('already exists') ? 409 : 500;
    return ApiResponse.error(statusCode, error.message).send(res);
  }
};

/**
 * Move folder
 * POST /api/folders/:id/move
 */
export const moveFolder = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;
    const { id } = req.params;
    const { targetParentId } = req.body;

    const folder = await folderService.moveFolder(id, targetParentId, userId);

    return ApiResponse.success(
      folder.toJSON(),
      'Folder moved successfully',
      200,
      {},
      FolderResponseSchema
    ).send(res);
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 
                       error.message.includes('already exists') ? 409 :
                       error.message.includes('Cannot move') ? 400 : 500;
    return ApiResponse.error(statusCode, error.message).send(res);
  }
};

/**
 * Delete folder
 * DELETE /api/folders/:id
 */
export const deleteFolder = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;
    const { id } = req.params;

    await folderService.deleteFolder(id, userId);

    return ApiResponse.success(
      { id },
      'Folder deleted successfully'
    ).send(res);
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    return ApiResponse.error(statusCode, error.message).send(res);
  }
};

/**
 * Get folder size
 * GET /api/folders/:id/size
 */
export const getFolderSize = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;
    const { id } = req.params;

    const size = await folderService.calculateFolderSize(id, userId);

    return ApiResponse.success(
      { folderId: id, size },
      'Folder size calculated successfully'
    ).send(res);
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    return ApiResponse.error(statusCode, error.message).send(res);
  }
};
