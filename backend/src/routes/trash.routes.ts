import { Router } from 'express';
import * as trashController from '../controllers/trashController.js';
import { requireAuth, requireDbUser } from '../middleware/logto.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Trash
 *   description: Trash/Recycle bin endpoints
 */

// Apply auth middleware to all routes
router.use(requireAuth);
router.use(requireDbUser);

/**
 * @swagger
 * /api/trash:
 *   get:
 *     summary: Get all trash items
 *     tags: [Trash]
 *     responses:
 *       200:
 *         description: Trash items retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 files:
 *                   type: array
 *                 folders:
 *                   type: array
 */
router.get('/', trashController.getTrashItems);

/**
 * @swagger
 * /api/trash/files/{id}/restore:
 *   post:
 *     summary: Restore file from trash
 *     tags: [Trash]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: File restored
 */
router.post('/files/:id/restore', trashController.restoreFile);

/**
 * @swagger
 * /api/trash/folders/{id}/restore:
 *   post:
 *     summary: Restore folder from trash
 *     tags: [Trash]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Folder restored
 */
router.post('/folders/:id/restore', trashController.restoreFolder);

/**
 * @swagger
 * /api/trash/files/{id}:
 *   delete:
 *     summary: Permanently delete file
 *     tags: [Trash]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: File permanently deleted
 */
router.delete('/files/:id', trashController.permanentlyDeleteFile);

/**
 * @swagger
 * /api/trash/folders/{id}:
 *   delete:
 *     summary: Permanently delete folder
 *     tags: [Trash]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Folder permanently deleted
 */
router.delete('/folders/:id', trashController.permanentlyDeleteFolder);

/**
 * @swagger
 * /api/trash/empty:
 *   delete:
 *     summary: Empty entire trash
 *     tags: [Trash]
 *     responses:
 *       200:
 *         description: Trash emptied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deletedFiles:
 *                   type: integer
 *                 deletedFolders:
 *                   type: integer
 */
router.delete('/empty', trashController.emptyTrash);

export default router;
