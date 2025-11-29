import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  statusCode: number;
  details: any;

  constructor(message: string, statusCode = 500, details: any = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 * Logs errors and sends appropriate responses
 */
export const errorHandler = async (err: any, req: Request, res: Response, next: NextFunction) => {
  // Log error to Axiom
  await logger.error('Application error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.dbUser?.id,
    statusCode: err.statusCode || 500,
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err.details 
    }),
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
  });
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
