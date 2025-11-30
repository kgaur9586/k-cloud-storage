import multer from 'multer';
import { Request } from 'express';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * Multer configuration for file uploads
 * Files are stored in memory buffer for processing before saving to disk
 */
const storage = multer.memoryStorage();

/**
 * File filter to validate file types
 */
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Block executable files for security
  const blockedMimeTypes = [
    'application/x-msdownload',
    'application/x-exe',
    'application/x-sh',
    'application/x-bat',
  ];

  if (blockedMimeTypes.includes(file.mimetype)) {
    cb(new Error('File type not allowed'));
    return;
  }

  cb(null, true);
};

/**
 * Multer upload middleware
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024, // 10GB limit
    files: 10, // Max 10 files per request
  },
});

/**
 * Error handler for multer errors
 */
export const handleUploadError = (err: any, req: Request, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return ApiResponse.error(400, 'File too large. Maximum size is 10GB.').send(res);
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return ApiResponse.error(400, 'Too many files. Maximum is 10 files per upload.').send(res);
    }
    return ApiResponse.error(400, `Upload error: ${err.message}`).send(res);
  }
  
  if (err) {
    return ApiResponse.error(400, err.message).send(res);
  }
  
  next();
};
