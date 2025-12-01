import express from 'express';
import { requireAuth, requireDbUser } from '@/middleware/logto.js';
import { getUser, createUser, updateUser, getStorageStats } from '@/controllers/authController.js';
import { asyncHandler } from '@/middleware/errorHandler.js';
import { validateBody } from '@/middleware/validation.js';
import { CreateUserRequestSchema, UpdateUserRequestSchema } from '@k-cloud/shared';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user management endpoints
 */

/**
 * @swagger
 * /api/auth/user:
 *   get:
 *     summary: Get user by Logto ID
 *     description: Returns 404 if user doesn't exist (first-time login)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found (first-time login)
 */
router.get('/user', requireAuth, asyncHandler(getUser));

/**
 * @swagger
 * /api/auth/user:
 *   post:
 *     summary: Create new user with profile details
 *     description: Called after first-time Logto authentication when getUser returns 404
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               age:
 *                 type: integer
 *               gender:
 *                 type: string
 *                 enum: [male, female, other, prefer_not_to_say]
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.post(
  '/user',
  requireAuth,
  validateBody(CreateUserRequestSchema),
  asyncHandler(createUser)
);

/**
 * @swagger
 * /api/auth/user:
 *   put:
 *     summary: Update user profile
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               age:
 *                 type: integer
 *               gender:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.put(
  '/user',
  requireAuth,
  requireDbUser,
  validateBody(UpdateUserRequestSchema),
  asyncHandler(updateUser)
);

/**
 * @swagger
 * /api/auth/storage:
 *   get:
 *     summary: Get storage statistics
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Storage statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StorageStats'
 */
router.get('/storage', requireAuth, requireDbUser, asyncHandler(getStorageStats));

export default router;
