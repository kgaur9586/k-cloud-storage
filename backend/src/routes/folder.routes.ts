import { Router } from 'express';
import * as folderController from '../controllers/folderController.js';
import { requireAuth, requireDbUser } from '../middleware/logto.js';

const router = Router();

// Apply auth middleware to all routes
router.use(requireAuth);
router.use(requireDbUser);

// Folder operations
router.post('/', folderController.createFolder);
router.get('/', folderController.listFolders);
router.get('/tree', folderController.getFolderTree);
router.get('/:id', folderController.getFolder);
router.put('/:id', folderController.renameFolder);
router.delete('/:id', folderController.deleteFolder);
router.post('/:id/move', folderController.moveFolder);
router.get('/:id/size', folderController.getFolderSize);

export default router;
