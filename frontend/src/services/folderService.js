import api from './api';

/**
 * Folder Service
 * Handles all folder-related API operations
 */

/**
 * Create a new folder
 * @param {string} name - Folder name
 * @param {string} parentId - Parent folder ID (null for root)
 * @returns {Promise} Created folder metadata
 */
export const createFolder = async (name, parentId = null) => {
    const response = await api.post('/folders', {
        name,
        parentId: parentId || undefined,
    });
    return response.data;
};

/**
 * List folders in a parent folder
 * @param {string} parentId - Parent folder ID (null for root)
 * @returns {Promise} List of folders
 */
export const listFolders = async (parentId = null, search = null) => {
    const params = { parentId: parentId || undefined };
    if (search) {
        params.search = search;
    }
    const response = await api.get('/folders', { params });
    return response.data;
};

/**
 * Get complete folder tree
 * @returns {Promise} Hierarchical folder tree
 */
export const getFolderTree = async () => {
    const response = await api.get('/folders/tree');
    return response.data;
};

/**
 * Get folder metadata
 * @param {string} folderId - Folder ID
 * @returns {Promise} Folder metadata
 */
export const getFolder = async (folderId) => {
    const response = await api.get(`/folders/${folderId}`);
    return response.data;
};

/**
 * Rename a folder
 * @param {string} folderId - Folder ID
 * @param {string} newName - New folder name
 * @returns {Promise} Updated folder metadata
 */
export const renameFolder = async (folderId, newName) => {
    const response = await api.put(`/folders/${folderId}`, { name: newName });
    return response.data;
};

/**
 * Move a folder to a different parent
 * @param {string} folderId - Folder ID
 * @param {string} targetParentId - Target parent folder ID (null for root)
 * @returns {Promise} Updated folder metadata
 */
export const moveFolder = async (folderId, targetParentId) => {
    const response = await api.post(`/folders/${folderId}/move`, {
        targetParentId: targetParentId || null,
    });
    return response.data;
};

/**
 * Delete a folder
 * @param {string} folderId - Folder ID
 * @returns {Promise} Deletion confirmation
 */
export const deleteFolder = async (folderId) => {
    const response = await api.delete(`/folders/${folderId}`);
    return response.data;
};

/**
 * Get folder size (total size of all files)
 * @param {string} folderId - Folder ID
 * @returns {Promise} Folder size in bytes
 */
export const getFolderSize = async (folderId) => {
    const response = await api.get(`/folders/${folderId}/size`);
    return response.data;
};

const folderService = {
    createFolder,
    listFolders,
    getFolderTree,
    getFolder,
    renameFolder,
    moveFolder,
    deleteFolder,
    getFolderSize,
};

export default folderService;
