import express from 'express';
import * as publicFileController from '../controllers/publicFileController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Public
 *   description: Public file access endpoints (no authentication required)
 */

/**
 * @swagger
 * /api/public/files/{shareToken}:
 *   get:
 *     summary: Get public file by share token
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: shareToken
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Share token for public file access
 *     responses:
 *       200:
 *         description: File stream
 *       404:
 *         description: File not found or not public
 *     security: []
 */
router.get('/files/:shareToken', publicFileController.getPublicFile);

/**
 * @swagger
 * /api/public/files/{shareToken}/metadata:
 *   get:
 *     summary: Get public file metadata
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: shareToken
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Share token for public file access
 *     responses:
 *       200:
 *         description: File metadata
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/File'
 *       404:
 *         description: File not found or not public
 *     security: []
 */
router.get('/files/:shareToken/metadata', publicFileController.getPublicFileMetadata);

export default router;
