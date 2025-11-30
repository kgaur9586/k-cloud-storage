import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodType } from 'zod';
import { logger } from '@/utils/logger.js';

/**
 * Validation Middleware
 * Validates request body, query, or params against a Zod schema
 */

export type ValidationTarget = 'body' | 'query' | 'params';

export function validateRequest(schema: ZodType<any, any, any>, target: ValidationTarget = 'body') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = req[target];
      
      // Validate and parse the data
      const validatedData = await schema.parseAsync(dataToValidate);
      
      // Replace the original data with validated data
      req[target] = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into a user-friendly format
        const formattedErrors: Record<string, string> = {};
        
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          formattedErrors[path] = err.message;
        });
        
        await logger.warn('Validation error', {
          target,
          errors: formattedErrors,
          path: req.path,
        });
        
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Invalid request data',
          fields: formattedErrors,
        });
      }
      
      // Handle other errors
      await logger.error('Unexpected validation error', {
        error: error instanceof Error ? error.message : String(error),
      });
      
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to validate request',
      });
    }
  };
}

/**
 * Validate request body
 */
export const validateBody = (schema: ZodType<any, any, any>) => validateRequest(schema, 'body');

/**
 * Validate query parameters
 */
export const validateQuery = (schema: ZodType<any, any, any>) => validateRequest(schema, 'query');

/**
 * Validate route parameters
 */
export const validateParams = (schema: ZodType<any, any, any>) => validateRequest(schema, 'params');
