import { Router } from 'express';
import * as fileController from '../controllers/fileController.js';
import { requireAuth, requireDbUser } from '../middleware/logto.js';
import { upload, handleUploadError } from '../middleware/upload.middleware.js';

import { Router } from 'express';
import * as fileController from '../controllers/fileController.js';
import { requireAuth, requireDbUser } from '../middleware/logto.js';
import { upload, handleUploadError } from '../middleware/upload.middleware.js';

const router = Router();

// Apply auth middleware to all routes
router.use(requireAuth);
router.use(requireDbUser);

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: File management endpoints
 */

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     summary: Upload files
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               folderId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileUploadResponse'
 */
router.post(
  '/upload',
  upload.array('files'),
  handleUploadError,
  fileController.uploadFiles
);

/**
 * @swagger
 * /api/files:
 *   get:
 *     summary: List files
 *     tags: [Files]
 *     parameters:
 *       - in: query
 *         name: folderId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Folder ID to list files from (optional, defaults to root)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, size, createdAt, updatedAt]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: mimeType
 *         schema:
 *           type: string
 *         description: Filter by MIME type
 *     responses:
 *       200:
 *         description: List of files
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileListResponse'
 */
router.get('/', fileController.listFiles);

/**
 * @swagger
 * /api/files/stats:
 *   get:
 *     summary: Get file statistics
 *     tags: [Files]
 *     responses:
 *       200:
 *         description: File statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalFiles:
 *                   type: integer
 *                 totalSize:
 *                   type: integer
 *                 usedStorage:
 *                   type: integer
 *                 storageQuota:
 *                   type: integer
 */
router.get('/stats', fileController.getFileStats);

/**
 * @swagger
 * /api/files/duplicates:
 *   get:
 *     summary: Find duplicate files
 *     tags: [Files]
 *     responses:
 *       200:
 *         description: List of duplicate files
 */
router.get('/duplicates', fileController.findDuplicates);

/**
 * @swagger
 * /api/files/{id}:
 *   get:
 *     summary: Get file details
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: File details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/File'
 *       404:
 *         description: File not found
 */
router.get('/:id', fileController.getFile);

/**
 * @swagger
 * /api/files/{id}/download:
 *   get:
 *     summary: Download file
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: File stream
 *       404:
 *         description: File not found
 */
router.get('/:id/download', fileController.downloadFile);

/**
 * @swagger
 * /api/files/{id}:
 *   put:
 *     summary: Rename file
 *     tags: [Files]
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
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: File renamed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/File'
 */
router.put('/:id', fileController.renameFile);

/**
 * @swagger
 * /api/files/{id}:
 *   delete:
 *     summary: Delete file (soft delete)
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: File deleted
 */
router.delete('/:id', fileController.deleteFile);

/**
 * @swagger
 * /api/files/{id}/move:
 *   post:
 *     summary: Move file
 *     tags: [Files]
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
 *             properties:
 *               targetFolderId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *     responses:
 *       200:
 *         description: File moved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/File'
 */
router.post('/:id/move', fileController.moveFile);

/**
 * @swagger
 * /api/files/{id}/visibility:
 *   put:
 *     summary: Toggle file visibility
 *     tags: [Files]
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
 *             properties:
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: File visibility updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/File'
 */
router.put('/:id/visibility', fileController.toggleFileVisibility);

/**
 * @swagger
 * /api/files/{id}/share-link:
 *   get:
 *     summary: Get file share link
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Share link retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shareLink:
 *                   type: string
 */
router.get('/:id/share-link', fileController.getShareLink);

export default router;
