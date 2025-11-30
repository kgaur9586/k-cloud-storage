import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if user has required role
 */
export const requireRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.dbUser;

      if (!user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not found',
        });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions',
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to check permissions',
      });
    }
  };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = requireRole(['admin']);
