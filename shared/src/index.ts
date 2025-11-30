/**
 * Shared Package Entry Point
 * Export all types, DTOs, and validators
 */

// Types (excluding ErrorResponse to avoid conflict)
export * from './types/index.js';

// DTOs (includes ErrorResponse from DTOs)
export * from './dtos/user.dto.js';
export * from './dtos/file.dto.js';
export * from './dtos/folder.dto.js';

// Re-export zod for convenience
export { z } from 'zod';

