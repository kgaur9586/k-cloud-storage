import { Router } from 'express';
import versionController from '../controllers/versionController.js';
import { requireAuth } from '../middleware/logto.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Get file versions
router.get('/:fileId/versions', versionController.getVersions);

// Restore file version
router.post('/:fileId/versions/:versionId/restore', versionController.restoreVersion);

export default router;
