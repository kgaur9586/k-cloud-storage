import { z } from 'zod';
import { Gender } from '../types/index.js';

/**
 * User DTOs (Data Transfer Objects)
 * These define the shape of data for API requests/responses
 */

// ============================================
// Request DTOs
// ============================================

/**
 * Create User Request DTO
 * Used when creating a new user profile
 */
export const CreateUserRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(20, 'Phone number is too long'),
  email: z.string().email('Invalid email address').optional(),
  age: z.number().int().min(13, 'Must be at least 13 years old').max(120, 'Invalid age').optional(),
  gender: z.nativeEnum(Gender).optional(),
});

export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;

/**
 * Update User Request DTO
 * Used when updating user profile
 */
export const UpdateUserRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(20, 'Phone number is too long').optional(),
  age: z.number().int().min(13, 'Must be at least 13 years old').max(120, 'Invalid age').optional(),
  gender: z.nativeEnum(Gender).optional(),
});

export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;

// ============================================
// Response DTOs
// ============================================

/**
 * User Response DTO
 * Returned when fetching user data
 */
export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  logtoUserId: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  phone: z.string().nullable(),
  age: z.number().int().nullable(),
  gender: z.nativeEnum(Gender).nullable(),
  picture: z.string().url().nullable(),
  storageQuota: z.number().int(),
  storageUsed: z.number().int(),
  storageUsagePercentage: z.number(),
  role: z.enum(['user', 'admin']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;

/**
 * Storage Stats Response DTO
 */
export const StorageStatsResponseSchema = z.object({
  quota: z.number().int(),
  used: z.number().int(),
  available: z.number().int(),
  usagePercentage: z.number(),
});

export type StorageStatsResponse = z.infer<typeof StorageStatsResponseSchema>;

/**
 * User Not Found Response DTO
 * Returned when user doesn't exist in database (404)
 */
export const UserNotFoundResponseSchema = z.object({
  logtoUserId: z.string(),
  email: z.string().email().optional(),
});

export type UserNotFoundResponse = z.infer<typeof UserNotFoundResponseSchema>;

/**
 * Error Response DTO
 */
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  fields: z.record(z.string()).optional(),
  stack: z.string().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// ============================================
// Validation Helpers
// ============================================

/**
 * Validate and parse data against a schema
 * Throws ZodError if validation fails
 */
export function validateDto<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safely validate data against a schema
 * Returns { success: true, data } or { success: false, error }
 */
export function safeValidateDto<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
