import { Router } from 'express';
import * as folderController from '../controllers/folderController.js';
import { requireAuth, requireDbUser } from '../middleware/logto.js';

const router = Router();

// Apply auth middleware to all routes
router.use(requireAuth);
router.use(requireDbUser);

/**
 * @swagger
 * tags:
 *   name: Folders
 *   description: Folder management endpoints
 */

/**
 * @swagger
 * /api/folders:
 *   post:
 *     summary: Create folder
 *     tags: [Folders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               parentId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Folder created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Folder'
 */
router.post('/', folderController.createFolder);

/**
 * @swagger
 * /api/folders:
 *   get:
 *     summary: List folders
 *     tags: [Folders]
 *     parameters:
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Parent folder ID (optional, defaults to root)
 *     responses:
 *       200:
 *         description: List of folders
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FolderListResponse'
 */
router.get('/', folderController.listFolders);

/**
 * @swagger
 * /api/folders/tree:
 *   get:
 *     summary: Get folder tree structure
 *     tags: [Folders]
 *     responses:
 *       200:
 *         description: Folder tree
 */
router.get('/tree', folderController.getFolderTree);

/**
 * @swagger
 * /api/folders/{id}:
 *   get:
 *     summary: Get folder details
 *     tags: [Folders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Folder details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Folder'
 */
router.get('/:id', folderController.getFolder);

/**
 * @swagger
 * /api/folders/{id}:
 *   put:
 *     summary: Rename folder
 *     tags: [Folders]
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
 *         description: Folder renamed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Folder'
 */
router.put('/:id', folderController.renameFolder);

/**
 * @swagger
 * /api/folders/{id}:
 *   delete:
 *     summary: Delete folder (soft delete)
 *     tags: [Folders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Folder deleted
 */
router.delete('/:id', folderController.deleteFolder);

/**
 * @swagger
 * /api/folders/{id}/move:
 *   post:
 *     summary: Move folder
 *     tags: [Folders]
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
 *               targetParentId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Folder moved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Folder'
 */
router.post('/:id/move', folderController.moveFolder);

/**
 * @swagger
 * /api/folders/{id}/size:
 *   get:
 *     summary: Get folder size
 *     tags: [Folders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Folder size
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 size:
 *                   type: integer
 */
router.get('/:id/size', folderController.getFolderSize);

export default router;
