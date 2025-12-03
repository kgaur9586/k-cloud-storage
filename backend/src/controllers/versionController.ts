import { Request, Response, NextFunction } from 'express';
import fileService from '../services/fileService.js';

/**
 * Version Controller
 * Handles file version operations
 */
class VersionController {
    /**
     * Get file versions
     */
    async getVersions(req: Request, res: Response, next: NextFunction) {
        try {
            const { fileId } = req.params;
            const userId = req.dbUser!.id;

            const versions = await fileService.getVersions(fileId, userId);

            res.json(versions);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Restore file version
     */
    async restoreVersion(req: Request, res: Response, next: NextFunction) {
        try {
            const { fileId, versionId } = req.params;
            const userId = req.dbUser!.id;

            const file = await fileService.restoreVersion(fileId, versionId, userId);

            res.json(file);
        } catch (error) {
            next(error);
        }
    }
}

export default new VersionController();
