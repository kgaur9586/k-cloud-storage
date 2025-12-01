import api from './api';

/**
 * Trash Service
 * Handles all trash/recycle bin related API calls
 */
const trashService = {
    /**
     * Get all trash items
     */
    async getTrashItems() {
        const response = await api.get('/trash');
        return response.data;
    },

    /**
     * Restore a file from trash
     */
    async restoreFile(fileId) {
        const response = await api.post(`/trash/files/${fileId}/restore`);
        return response.data;
    },

    /**
     * Restore a folder from trash
     */
    async restoreFolder(folderId) {
        const response = await api.post(`/trash/folders/${folderId}/restore`);
        return response.data;
    },

    /**
     * Permanently delete a file
     */
    async permanentlyDeleteFile(fileId) {
        const response = await api.delete(`/trash/files/${fileId}`);
        return response.data;
    },

    /**
     * Permanently delete a folder
     */
    async permanentlyDeleteFolder(folderId) {
        const response = await api.delete(`/trash/folders/${folderId}`);
        return response.data;
    },

    /**
     * Empty entire trash
     */
    async emptyTrash() {
        const response = await api.delete('/trash/empty');
        return response.data;
    },
};

export default trashService;
