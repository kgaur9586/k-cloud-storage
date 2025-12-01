import express from 'express';
import * as publicFileController from '../controllers/publicFileController.js';

const router = express.Router();

/**
 * Public Routes (No Authentication Required)
 */

// Get public file by share token
router.get('/files/:shareToken', publicFileController.getPublicFile);

// Get public file metadata
router.get('/files/:shareToken/metadata', publicFileController.getPublicFileMetadata);

export default router;
