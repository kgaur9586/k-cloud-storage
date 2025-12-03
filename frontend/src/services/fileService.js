import api from './api';

/**
 * File Service
 * Handles all file-related API operations
 */

/**
 * Upload files to a folder
 * @param {File[]} files - Array of File objects
 * @param {string} folderId - Target folder ID (optional)
 * @returns {Promise} Upload response with file metadata
 */
export const uploadFiles = async (files, folderId = null) => {
    const formData = new FormData();

    files.forEach(file => {
        formData.append('files', file);
    });

    if (folderId) {
        formData.append('folderId', folderId);
    }

    const response = await api.post('/files/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

/**
 * List files in a folder
 * @param {string} folderId - Folder ID (null for root)
 * @param {object} params - Query parameters (page, limit, sortBy, sortOrder, search, mimeType)
 * @returns {Promise} Paginated file list
 */
export const listFiles = async (folderId = null, params = {}) => {
    const queryParams = {
        ...params,
        folderId: folderId || undefined,
    };

    const response = await api.get('/files', { params: queryParams });
    return response.data;
};

/**
 * Get file metadata
 * @param {string} fileId - File ID
 * @returns {Promise} File metadata
 */
export const getFile = async (fileId) => {
    const response = await api.get(`/files/${fileId}`);
    return response.data;
};

/**
 * Download a file
 * @param {string} fileId - File ID
 * @returns {Promise} File blob
 */
export const downloadFile = async (fileId) => {
    const response = await api.get(`/files/${fileId}/download`, {
        responseType: 'blob',
    });

    return {
        blob: response.data,
        filename: response.headers['content-disposition']
            ?.split('filename=')[1]
            ?.replace(/"/g, '') || 'download',
    };
};

/**
 * Rename a file
 * @param {string} fileId - File ID
 * @param {string} newName - New file name
 * @returns {Promise} Updated file metadata
 */
export const renameFile = async (fileId, newName) => {
    const response = await api.put(`/files/${fileId}`, { name: newName });
    return response.data;
};

/**
 * Move a file to a different folder
 * @param {string} fileId - File ID
 * @param {string} targetFolderId - Target folder ID (null for root)
 * @returns {Promise} Updated file metadata
 */
export const moveFile = async (fileId, targetFolderId) => {
    const response = await api.post(`/files/${fileId}/move`, {
        targetFolderId: targetFolderId || null,
    });
    return response.data;
};

/**
 * Delete a file
 * @param {string} fileId - File ID
 * @returns {Promise} Deletion confirmation
 */
export const deleteFile = async (fileId) => {
    const response = await api.delete(`/files/${fileId}`);
    return response.data;
};

/**
 * Get file statistics for the user
 * @returns {Promise} File statistics
 */
export const getFileStats = async () => {
    const response = await api.get('/files/stats');
    return response.data;
};

/**
 * Find duplicate files
 * @returns {Promise} List of duplicate file groups
 */
export const findDuplicates = async () => {
    const response = await api.get('/files/duplicates');
    return response.data;
};

/**
 * Toggle file visibility (public/private)
 * @param {string} fileId - File ID
 * @param {boolean} isPublic - Whether file should be public
 * @returns {Promise} Updated file metadata
 */
export const toggleFileVisibility = async (fileId, isPublic) => {
    const response = await api.put(`/files/${fileId}/visibility`, { isPublic });
    return response.data;
};

/**
 * Get share link for a public file
 * @param {string} fileId - File ID
 * @returns {Promise} Share link and token
 */
export const getShareLink = async (fileId) => {
    const response = await api.get(`/files/${fileId}/share-link`);
    return response.data;
};

/**
 * Get public file (no authentication required)
 * @param {string} shareToken - Share token
 * @returns {Promise} File metadata
 */
export const getPublicFile = async (shareToken) => {
    // Use direct fetch for public endpoint (no auth)
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const response = await fetch(`${baseURL}/api/public/files/${shareToken}/metadata`);

    if (!response.ok) {
        throw new Error('Failed to get public file');
    }

    return await response.json();
};



/**
 * Get file versions
 * @param {string} fileId - File ID
 * @returns {Promise} List of file versions
 */
export const getVersions = async (fileId) => {
    const response = await api.get(`/files/${fileId}/versions`);
    return response.data;
};

/**
 * Restore file version
 * @param {string} fileId - File ID
 * @param {string} versionId - Version ID
 * @returns {Promise} Restored file
 */
export const restoreVersion = async (fileId, versionId) => {
    const response = await api.post(`/files/${fileId}/versions/${versionId}/restore`);
    return response.data;
};

const fileService = {
    uploadFiles,
    listFiles,
    getFile,
    downloadFile,
    renameFile,
    moveFile,
    deleteFile,
    getFileStats,
    findDuplicates,
    toggleFileVisibility,
    getShareLink,
    getPublicFile,
    getVersions,
    restoreVersion,
};

export default fileService;
