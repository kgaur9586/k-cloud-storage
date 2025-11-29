import express from 'express';
import { requireAuth, requireDbUser } from '../middleware/logto.js';
import { getUser, createUser, updateProfile, getStorageStats } from '../controllers/authController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * Get user by Logto ID
 * Returns 404 if user doesn't exist (first-time login)
 * @route GET /api/auth/user
 * @access Private (Logto authenticated only)
 */
router.get('/user', requireAuth, asyncHandler(getUser));

/**
 * Create new user with profile details
 * Called after first-time Logto authentication when getUser returns 404
 * @route POST /api/auth/user
 * @access Private (Logto authenticated only)
 */
router.post('/user', requireAuth, asyncHandler(createUser));

/**
 * Update user profile
 * @route PUT /api/auth/user
 * @access Private (requires existing user in database)
 */
router.put('/user', requireAuth, requireDbUser, asyncHandler(updateProfile));

/**
 * Get storage statistics
 * @route GET /api/auth/storage
 * @access Private (requires existing user in database)
 */
router.get('/storage', requireAuth, requireDbUser, asyncHandler(getStorageStats));

export default router;
