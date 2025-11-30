/**
 * Shared Types for K-Cloud Storage
 * Used by both frontend and backend
 */

// User Gender Enum
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

// User Role Enum
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

// Environment Enum
export enum Environment {
  LOCAL = 'local',
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
}

// Base User Type
export interface User {
  id: string;
  logtoUserId: string;
  email: string;
  name: string | null;
  phone: string | null;
  age: number | null;
  gender: Gender | null;
  picture: string | null;
  storageQuota: number;
  storageUsed: number;
  role: UserRole;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Storage Stats Type
export interface StorageStats {
  quota: number;
  used: number;
  available: number;
  usagePercentage: number;
}

// API Response Wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

