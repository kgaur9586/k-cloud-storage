import { z } from 'zod';

/**
 * Folder DTOs (Data Transfer Objects)
 * These define the shape of data for folder-related API requests/responses
 */

// ============================================
// Request DTOs
// ============================================

/**
 * Create Folder Request DTO
 */
export const CreateFolderRequestSchema = z.object({
  name: z.string()
    .min(1, 'Folder name is required')
    .max(255, 'Folder name is too long')
    .regex(/^[^/\\:*?"<>|]+$/, 'Folder name contains invalid characters'),
  parentId: z.string().uuid().optional(),
});

export type CreateFolderRequest = z.infer<typeof CreateFolderRequestSchema>;

/**
 * Update Folder Request DTO (rename)
 */
export const UpdateFolderRequestSchema = z.object({
  name: z.string()
    .min(1, 'Folder name is required')
    .max(255, 'Folder name is too long')
    .regex(/^[^/\\:*?"<>|]+$/, 'Folder name contains invalid characters'),
});

export type UpdateFolderRequest = z.infer<typeof UpdateFolderRequestSchema>;

/**
 * Move Folder Request DTO
 */
export const MoveFolderRequestSchema = z.object({
  targetParentId: z.string().uuid().nullable(),
});

export type MoveFolderRequest = z.infer<typeof MoveFolderRequestSchema>;

// ============================================
// Response DTOs
// ============================================

/**
 * Folder Response DTO
 * Returned when fetching folder metadata
 */
export const FolderResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  parentId: z.string().uuid().nullable(),
  name: z.string(),
  path: z.string(),
  fileCount: z.number().int().optional(),
  folderCount: z.number().int().optional(),
  totalSize: z.number().int().optional(),
  isDeleted: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type FolderResponse = z.infer<typeof FolderResponseSchema>;

/**
 * Folder Tree Node DTO
 * Used for hierarchical folder tree representation
 */
export const FolderTreeNodeSchema: z.ZodType<any> = z.lazy(() => z.object({
  id: z.string().uuid(),
  name: z.string(),
  path: z.string(),
  parentId: z.string().uuid().nullable(),
  children: z.array(FolderTreeNodeSchema).optional(),
  fileCount: z.number().int().optional(),
  folderCount: z.number().int().optional(),
}));

export type FolderTreeNode = z.infer<typeof FolderTreeNodeSchema>;

/**
 * Folder Tree Response DTO
 */
export const FolderTreeResponseSchema = z.object({
  root: z.array(FolderTreeNodeSchema),
});

export type FolderTreeResponse = z.infer<typeof FolderTreeResponseSchema>;

/**
 * Folder List Response DTO
 */
export const FolderListResponseSchema = z.object({
  folders: z.array(FolderResponseSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }).optional(),
});

export type FolderListResponse = z.infer<typeof FolderListResponseSchema>;

/**
 * Folder Contents Response DTO
 * Includes both files and subfolders
 */
export const FolderContentsResponseSchema = z.object({
  folder: FolderResponseSchema,
  subfolders: z.array(FolderResponseSchema),
  files: z.array(z.any()), // Will reference FileResponseSchema from file.dto
  breadcrumbs: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    path: z.string(),
  })),
});

export type FolderContentsResponse = z.infer<typeof FolderContentsResponseSchema>;

// ============================================
// Validation Helpers
// ============================================

/**
 * Validate create folder request
 */
export function validateCreateFolderRequest(data: unknown): CreateFolderRequest {
  return CreateFolderRequestSchema.parse(data);
}

/**
 * Validate update folder request
 */
export function validateUpdateFolderRequest(data: unknown): UpdateFolderRequest {
  return UpdateFolderRequestSchema.parse(data);
}

/**
 * Validate move folder request
 */
export function validateMoveFolderRequest(data: unknown): MoveFolderRequest {
  return MoveFolderRequestSchema.parse(data);
}
