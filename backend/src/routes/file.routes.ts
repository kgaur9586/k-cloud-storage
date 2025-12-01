import { Router } from 'express';
import * as fileController from '../controllers/fileController.js';
import { requireAuth, requireDbUser } from '../middleware/logto.js';
import { upload, handleUploadError } from '../middleware/upload.middleware.js';

const router = Router();

// Apply auth middleware to all routes
router.use(requireAuth);
router.use(requireDbUser);

// File upload
router.post(
  '/upload',
  upload.array('files'),
  handleUploadError,
  fileController.uploadFiles
);

// File operations
router.get('/', fileController.listFiles);
router.get('/stats', fileController.getFileStats);
router.get('/duplicates', fileController.findDuplicates);
router.get('/:id', fileController.getFile);
router.get('/:id/download', fileController.downloadFile);
router.put('/:id', fileController.renameFile);
router.delete('/:id', fileController.deleteFile);
router.post('/:id/move', fileController.moveFile);

// File sharing
router.put('/:id/visibility', fileController.toggleFileVisibility);
router.get('/:id/share-link', fileController.getShareLink);

export default router;
