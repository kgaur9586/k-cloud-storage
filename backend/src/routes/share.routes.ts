import { Router } from 'express';
import * as shareController from '../controllers/shareController.js';
import { requireAuth } from '../middleware/logto.js';

const router = Router();

/**
 * @swagger
 * /api/files/{id}/share:
 *   post:
 *     summary: Create a share link for a file
 *     tags: [Sharing]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permission
 *             properties:
 *               sharedWith:
 *                 type: string
 *                 format: uuid
 *                 description: User ID to share with (null for public link)
 *               permission:
 *                 type: string
 *                 enum: [view, download, edit]
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *               password:
 *                 type: string
 *                 minLength: 8
 *               maxAccessCount:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Share link created successfully
 */
router.post('/files/:id/share', requireAuth, shareController.createFileShareLink);

/**
 * @swagger
 * /api/files/shared/with-me:
 *   get:
 *     summary: Get files shared with me
 *     tags: [Sharing]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of files shared with me
 */
router.get('/files/shared/with-me', requireAuth, shareController.getSharedWithMe);

/**
 * @swagger
 * /api/files/shared/by-me:
 *   get:
 *     summary: Get files I've shared
 *     tags: [Sharing]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of files I've shared
 */
router.get('/files/shared/by-me', requireAuth, shareController.getSharedByMe);

/**
 * @swagger
 * /api/shares/{shareId}:
 *   delete:
 *     summary: Revoke a share link
 *     tags: [Sharing]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Share link revoked successfully
 */
router.delete('/shares/:shareId', requireAuth, shareController.revokeShareLink);

/**
 * @swagger
 * /api/shares/{shareId}:
 *   put:
 *     summary: Update share link settings
 *     tags: [Sharing]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permission:
 *                 type: string
 *                 enum: [view, download, edit]
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *               password:
 *                 type: string
 *               maxAccessCount:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Share link updated successfully
 */
router.put('/shares/:shareId', requireAuth, shareController.updateShareLink);

/**
 * @swagger
 * /api/public/share/{token}:
 *   post:
 *     summary: Access a shared resource (public, no auth required)
 *     tags: [Sharing]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shared resource accessed successfully
 *       401:
 *         description: Password required
 *       400:
 *         description: Invalid or expired link
 */
router.post('/public/share/:token', shareController.accessSharedResource);

/**
 * @swagger
 * /api/public/share/{token}/download:
 *   post:
 *     summary: Download shared file content (public)
 *     tags: [Sharing]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: File content
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 */
router.post('/public/share/:token/download', shareController.downloadSharedFile);

export default router;
