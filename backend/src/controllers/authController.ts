import { Request, Response } from 'express';
import { logger } from '@/utils/logger.js';
import { UserService } from '@/services/userService.js';
import ApiResponse from '@/utils/ApiResponse.js';
import {
  CreateUserRequest,
  UpdateUserRequest,
  UserResponseSchema,
  StorageStatsResponseSchema,
  UserNotFoundResponseSchema,
} from '@k-cloud/shared';

/**
 * @swagger
 * /api/auth/user:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile from the database
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found in database (first-time login)
 */
export const getUser = async (req: Request, res: Response) => {
  try {
    const claims = req.logtoUser;
    
    if (!claims?.sub) {
      return ApiResponse.error(400, 'User claims not found').send(res);
    }

    // Use Service to find user
    const user = await UserService.findByLogtoId(claims.sub);

    // Return 404 if user doesn't exist (first-time login)
    if (!user) {
      await logger.info('User not found in database', {
        logtoUserId: claims.sub,
        email: claims.email,
      });

      return ApiResponse.error(
        404, 
        'User not found', 
        {
          logtoUserId: claims.sub,
          email: claims.email,
        },
        'USER_NOT_FOUND',
        {},
        UserNotFoundResponseSchema
      ).send(res);
    }

    // Prepare response data
    const responseData = {
      ...user.toJSON(),
      storageUsagePercentage: user.getStorageUsagePercentage(),
    };

    // Send success response with Schema validation
    return ApiResponse.success(
      responseData,
      'User profile retrieved successfully',
      200,
      {},
      UserResponseSchema
    ).send(res);

  } catch (error) {
    await logger.error('Failed to get user', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return ApiResponse.error(500, 'Failed to get user').send(res);
  }
};

/**
 * Create user profile
 * @route POST /api/auth/user
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    const claims = req.logtoUser;
    const requestData = req.body as CreateUserRequest;

    if (!claims?.sub) {
      return ApiResponse.error(400, 'User claims not found').send(res);
    }

    // Determine email
    const email = claims.email || requestData.email;
    if (!email) {
      return ApiResponse.error(400, 'Email is required').send(res);
    }

    try {
      // Use Service to create user
      const newUser = await UserService.createUser(
        claims.sub,
        email,
        requestData,
        claims.picture
      );

      const responseData = {
        ...newUser.toJSON(),
        storageUsagePercentage: newUser.getStorageUsagePercentage(),
      };

      return ApiResponse.success(
        responseData,
        'User created successfully',
        201,
        {},
        UserResponseSchema
      ).send(res);

    } catch (err: any) {
      if (err.message === 'User already exists') {
        return ApiResponse.error(409, 'User already exists').send(res);
      }
      throw err;
    }

  } catch (error) {
    await logger.error('Failed to create user', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return ApiResponse.error(500, 'Failed to create user').send(res);
  }
};

/**
 * Update user profile
 * @route PUT /api/auth/user
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const user = req.dbUser;
    const updateData = req.body as UpdateUserRequest;

    if (!user) {
      return ApiResponse.error(404, 'User not found').send(res);
    }

    // Use Service to update user
    const updatedUser = await UserService.updateUser(user.id, updateData);

    const responseData = {
      ...updatedUser.toJSON(),
      storageUsagePercentage: updatedUser.getStorageUsagePercentage(),
    };

    return ApiResponse.success(
      responseData,
      'User updated successfully',
      200,
      {},
      UserResponseSchema
    ).send(res);

  } catch (error) {
    await logger.error('Failed to update user', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.dbUser?.id,
    });
    return ApiResponse.error(500, 'Failed to update user').send(res);
  }
};

/**
 * Get storage statistics
 * @route GET /api/auth/storage
 */
export const getStorageStats = async (req: Request, res: Response) => {
  try {
    const user = req.dbUser;

    if (!user) {
      return ApiResponse.error(404, 'User not found').send(res);
    }

    const stats = UserService.calculateStorageStats(user);

    return ApiResponse.success(
      stats,
      'Storage stats retrieved successfully',
      200,
      {},
      StorageStatsResponseSchema
    ).send(res);

  } catch (error) {
    await logger.error('Failed to get storage stats', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.dbUser?.id,
    });
    return ApiResponse.error(500, 'Failed to get storage stats').send(res);
  }
};
