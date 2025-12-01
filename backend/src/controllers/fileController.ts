import { Request, Response } from 'express';
import fileService from '../services/fileService.js';
import ApiResponse from '@/utils/ApiResponse.js';
import { FileResponseSchema, FileListResponseSchema, FileUploadResponseSchema } from '@k-cloud/shared';

/**
 * Upload files
 * POST /api/files/upload
 */
export const uploadFiles = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;
    const files = req.files as Express.Multer.File[];
    const { folderId } = req.body;

    if (!files || files.length === 0) {
      return ApiResponse.error(400, 'No files provided').send(res);
    }

    const uploadedFiles = [];
    const errors = [];

    for (const file of files) {
      try {
        const uploadedFile = await fileService.uploadFile(
          userId,
          file.buffer,
          file.originalname,
          file.mimetype,
          folderId
        );
        uploadedFiles.push(uploadedFile.toJSON());
      } catch (error: any) {
        errors.push({
          filename: file.originalname,
          error: error.message,
        });
      }
    }

    const response = {
      files: uploadedFiles,
      successCount: uploadedFiles.length,
      failedCount: errors.length,
      errors: errors.length > 0 ? errors : [],
    };

    return ApiResponse.success(
      response,
      `${uploadedFiles.length} file(s) uploaded successfully`,
      201,
      {},
      FileUploadResponseSchema
    ).send(res);
  } catch (error: any) {
    return ApiResponse.error(500, error.message).send(res);
  }
};

/**
 * Get file metadata
 * GET /api/files/:id
 */
export const getFile = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;
    const { id } = req.params;

    const file = await fileService.getFileById(id, userId);

    if (!file) {
      return ApiResponse.error(404, 'File not found').send(res);
    }

    return ApiResponse.success(
      file.toJSON(),
      'File retrieved successfully',
      200,
      {},
      FileResponseSchema
    ).send(res);
  } catch (error: any) {
    return ApiResponse.error(500, error.message).send(res);
  }
};

/**
 * List files
 * GET /api/files
 */
export const listFiles = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;
    const { folderId, page, limit, sortBy, sortOrder, search, mimeType } = req.query;

    const { files, total } = await fileService.listFiles(userId, folderId as string, {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      search: search as string,
      mimeType: mimeType as string,
    });

    const pageNum = page ? parseInt(page as string) : 1;
    const limitNum = limit ? parseInt(limit as string) : 50;

    const response = {
      files: files.map(f => f.toJSON()),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };

    return ApiResponse.success(
      response,
      'Files retrieved successfully',
      200,
      {},
      FileListResponseSchema
    ).send(res);
  } catch (error: any) {
    return ApiResponse.error(500, error.message).send(res);
  }
};

/**
 * Download file
 * GET /api/files/:id/download
 */
export const downloadFile = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;
    const { id } = req.params;

    const { file, buffer } = await fileService.downloadFile(id, userId);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  } catch (error: any) {
    return ApiResponse.error(error.message === 'File not found' ? 404 : 500, error.message).send(res);
  }
};

/**
 * Rename file
 * PUT /api/files/:id
 */
export const renameFile = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return ApiResponse.error(400, 'Name is required').send(res);
    }

    const file = await fileService.renameFile(id, name, userId);

    return ApiResponse.success(
      file.toJSON(),
      'File renamed successfully',
      200,
      {},
      FileResponseSchema
    ).send(res);
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 
                       error.message.includes('already exists') ? 409 : 500;
    return ApiResponse.error(statusCode, error.message).send(res);
  }
};

/**
 * Move file
 * POST /api/files/:id/move
 */
export const moveFile = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;
    const { id } = req.params;
    const { targetFolderId } = req.body;

    const file = await fileService.moveFile(id, targetFolderId, userId);

    return ApiResponse.success(
      file.toJSON(),
      'File moved successfully',
      200,
      {},
      FileResponseSchema
    ).send(res);
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 
                       error.message.includes('already exists') ? 409 : 500;
    return ApiResponse.error(statusCode, error.message).send(res);
  }
};

/**
 * Delete file
 * DELETE /api/files/:id
 */
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;
    const { id } = req.params;

    await fileService.deleteFile(id, userId);

    return ApiResponse.success(
      { id },
      'File deleted successfully'
    ).send(res);
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    return ApiResponse.error(statusCode, error.message).send(res);
  }
};

/**
 * Get file statistics
 * GET /api/files/stats
 */
export const getFileStats = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;

    const stats = await fileService.getFileStats(userId);

    return ApiResponse.success(stats, 'File statistics retrieved successfully').send(res);
  } catch (error: any) {
    return ApiResponse.error(500, error.message).send(res);
  }
};

/**
 * Find duplicate files
 * GET /api/files/duplicates
 */
export const findDuplicates = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;

    const duplicates = await fileService.findDuplicates(userId);

    // Convert Map to array of objects
    const duplicatesArray = Array.from(duplicates.entries()).map(([hash, files]) => ({
      hash,
      files: files.map(f => f.toJSON()),
      count: files.length,
      totalSize: files.reduce((sum, f) => sum + Number(f.size), 0),
    }));

    return ApiResponse.success(
      { duplicates: duplicatesArray },
      'Duplicate files retrieved successfully'
    ).send(res);
  } catch (error: any) {
    return ApiResponse.error(500, error.message).send(res);
  }
};

/**
 * Toggle file visibility (public/private)
 * PUT /api/files/:id/visibility
 */
export const toggleFileVisibility = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;
    const { id } = req.params;
    const { isPublic } = req.body;

    if (typeof isPublic !== 'boolean') {
      return ApiResponse.error(400, 'isPublic must be a boolean').send(res);
    }

    const file = await fileService.toggleFileVisibility(id, userId, isPublic);

    return ApiResponse.success(
      { file: file.toJSON() },
      `File is now ${isPublic ? 'public' : 'private'}`
    ).send(res);
  } catch (error: any) {
    return ApiResponse.error(500, error.message).send(res);
  }
};

/**
 * Get share link for a file
 * GET /api/files/:id/share-link
 */
export const getShareLink = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;
    const { id } = req.params;

    const { shareLink, shareToken } = await fileService.getShareLink(id, userId);

    return ApiResponse.success(
      { shareLink, shareToken },
      'Share link retrieved successfully'
    ).send(res);
  } catch (error: any) {
    return ApiResponse.error(500, error.message).send(res);
  }
};
