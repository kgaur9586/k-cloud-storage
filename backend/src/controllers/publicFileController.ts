import { Request, Response } from 'express';
import fileService from '../services/fileService.js';
import storageService from '../services/storageService.js';
import { logger } from '../utils/logger.js';

/**
 * Public File Controller
 * Handles public file access (no authentication required)
 */

/**
 * Get public file metadata and download
 */
export const getPublicFile = async (req: Request, res: Response) => {
  try {
    const { shareToken } = req.params;

    if (!shareToken) {
      return res.status(400).json({
        success: false,
        message: 'Share token is required',
      });
    }

    // Get file by share token
    const file = await fileService.getPublicFile(shareToken);

    // Read file from storage
    const fileBuffer = await storageService.readFile(file.path);

    // Set headers for download
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.name}"`);
    res.setHeader('Content-Length', fileBuffer.length.toString());

    // Send file
    res.send(fileBuffer);
  } catch (error: any) {
    await logger.error('Failed to get public file', { error: error.message });
    
    if (error.message === 'Public file not found') {
      return res.status(404).json({
        success: false,
        message: 'File not found or is not public',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve file',
    });
  }
};

/**
 * Get public file metadata (without downloading)
 */
export const getPublicFileMetadata = async (req: Request, res: Response) => {
  try {
    const { shareToken } = req.params;

    if (!shareToken) {
      return res.status(400).json({
        success: false,
        message: 'Share token is required',
      });
    }

    // Get file by share token (without incrementing count)
    const file = await fileService.getPublicFile(shareToken);

    res.json({
      success: true,
      data: {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        publicAccessCount: file.publicAccessCount,
        createdAt: file.createdAt,
      },
    });
  } catch (error: any) {
    await logger.error('Failed to get public file metadata', { error: error.message });
    
    if (error.message === 'Public file not found') {
      return res.status(404).json({
        success: false,
        message: 'File not found or is not public',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve file metadata',
    });
  }
};
