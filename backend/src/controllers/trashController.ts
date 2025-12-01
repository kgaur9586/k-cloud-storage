import { Request, Response } from 'express';
import trashService from '../services/trashService.js';
import ApiResponse from '@/utils/ApiResponse.js';

/**
 * Get all trash items
 * GET /api/trash
 */
export const getTrashItems = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;
    const items = await trashService.getTrashItems(userId);

    return ApiResponse.success(
      items,
      'Trash items retrieved successfully'
    ).send(res);
  } catch (error: any) {
    return ApiResponse.error(500, error.message).send(res);
  }
};

/**
 * Restore a file from trash
 * POST /api/trash/files/:id/restore
 */
export const restoreFile = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;
    const { id } = req.params;

    const file = await trashService.restoreFile(id, userId);

    return ApiResponse.success(
      file,
      'File restored successfully'
    ).send(res);
  } catch (error: any) {
    return ApiResponse.error(500, error.message).send(res);
  }
};

/**
 * Restore a folder from trash
 * POST /api/trash/folders/:id/restore
 */
export const restoreFolder = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;
    const { id } = req.params;

    const folder = await trashService.restoreFolder(id, userId);

    return ApiResponse.success(
      folder,
      'Folder restored successfully'
    ).send(res);
  } catch (error: any) {
    return ApiResponse.error(500, error.message).send(res);
  }
};

/**
 * Permanently delete a file
 * DELETE /api/trash/files/:id
 */
export const permanentlyDeleteFile = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;
    const { id } = req.params;

    await trashService.permanentlyDeleteFile(id, userId);

    return ApiResponse.success(
      null,
      'File permanently deleted'
    ).send(res);
  } catch (error: any) {
    return ApiResponse.error(500, error.message).send(res);
  }
};

/**
 * Permanently delete a folder
 * DELETE /api/trash/folders/:id
 */
export const permanentlyDeleteFolder = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;
    const { id } = req.params;

    await trashService.permanentlyDeleteFolder(id, userId);

    return ApiResponse.success(
      null,
      'Folder permanently deleted'
    ).send(res);
  } catch (error: any) {
    return ApiResponse.error(500, error.message).send(res);
  }
};

/**
 * Empty entire trash
 * DELETE /api/trash/empty
 */
export const emptyTrash = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;
    const result = await trashService.emptyTrash(userId);

    return ApiResponse.success(
      result,
      'Trash emptied successfully'
    ).send(res);
  } catch (error: any) {
    return ApiResponse.error(500, error.message).send(res);
  }
};
