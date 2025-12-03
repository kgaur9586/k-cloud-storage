import { Request, Response } from 'express';
import fileService from '../services/fileService.js';
import storageService from '../services/storageService.js';
import ApiResponse from '@/utils/ApiResponse.js';
import path from 'path';
import fs from 'fs/promises';

/**
 * Get file thumbnail
 * GET /api/files/:id/thumbnail
 */
export const getFileThumbnail = async (req: Request, res: Response) => {
  try {
    const userId = req.dbUser!.id;
    const { id } = req.params;

    const file = await fileService.getFileById(id, userId);

    if (!file) {
      return ApiResponse.error(404, 'File not found').send(res);
    }

    if (!file.thumbnailPath) {
      return ApiResponse.error(404, 'Thumbnail not available').send(res);
    }

    // Get thumbnail from storage
    const thumbnailBuffer = await storageService.readFile(file.thumbnailPath);

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', thumbnailBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    return res.send(thumbnailBuffer);
  } catch (error: any) {
    return ApiResponse.error(500, error.message).send(res);
  }
};
