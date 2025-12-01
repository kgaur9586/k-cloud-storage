import { z } from 'zod';

/**
 * File DTOs (Data Transfer Objects)
 * These define the shape of data for file-related API requests/responses
 */

// ============================================
// Request DTOs
// ============================================

/**
 * File Upload Request DTO
 * Used when uploading files
 */
export const FileUploadRequestSchema = z.object({
  folderId: z.string().uuid().optional(),
});

export type FileUploadRequest = z.infer<typeof FileUploadRequestSchema>;

/**
 * File Rename Request DTO
 */
export const FileRenameRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
});

export type FileRenameRequest = z.infer<typeof FileRenameRequestSchema>;

/**
 * File Move Request DTO
 */
export const FileMoveRequestSchema = z.object({
  targetFolderId: z.string().uuid().nullable(),
});

export type FileMoveRequest = z.infer<typeof FileMoveRequestSchema>;

/**
 * File List Query Parameters
 */
export const FileListQuerySchema = z.object({
  folderId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  sortBy: z.enum(['name', 'size', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  mimeType: z.string().optional(),
});

export type FileListQuery = z.infer<typeof FileListQuerySchema>;

// ============================================
// Response DTOs
// ============================================

/**
 * File Response DTO
 * Returned when fetching file metadata
 */
export const FileResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  folderId: z.string().uuid().nullable(),
  name: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number().int(),
  path: z.string(),
  hash: z.string(),
  thumbnailPath: z.string().nullable(),
  metadata: z.record(z.any()).nullable(),
  isPublic: z.boolean().optional().default(false),
  shareToken: z.string().uuid().nullable().optional(),
  publicAccessCount: z.number().int().optional().default(0),
  isDeleted: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type FileResponse = z.infer<typeof FileResponseSchema>;

/**
 * File List Response DTO
 */
export const FileListResponseSchema = z.object({
  files: z.array(FileResponseSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export type FileListResponse = z.infer<typeof FileListResponseSchema>;

/**
 * File Upload Response DTO
 */
export const FileUploadResponseSchema = z.object({
  files: z.array(FileResponseSchema),
  successCount: z.number().int(),
  failedCount: z.number().int(),
  errors: z.array(z.object({
    filename: z.string(),
    error: z.string(),
  })),
});

export type FileUploadResponse = z.infer<typeof FileUploadResponseSchema>;

// ============================================
// Validation Helpers
// ============================================

/**
 * Validate file upload request
 */
export function validateFileUploadRequest(data: unknown): FileUploadRequest {
  return FileUploadRequestSchema.parse(data);
}

/**
 * Validate file rename request
 */
export function validateFileRenameRequest(data: unknown): FileRenameRequest {
  return FileRenameRequestSchema.parse(data);
}

/**
 * Validate file move request
 */
export function validateFileMoveRequest(data: unknown): FileMoveRequest {
  return FileMoveRequestSchema.parse(data);
}

/**
 * Validate file list query
 */
export function validateFileListQuery(data: unknown): FileListQuery {
  return FileListQuerySchema.parse(data);
}
