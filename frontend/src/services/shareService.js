import api from './api';

/**
 * Share Service
 * Handles all sharing-related API operations
 */

/**
 * Create a share link for a file
 */
export const createShareLink = async (fileId, options) => {
    const response = await api.post(`/files/${fileId}/share`, options);
    return response.data;
};

/**
 * Get files shared with me
 */
export const getSharedWithMe = async () => {
    const response = await api.get('/files/shared/with-me');
    return response.data;
};

/**
 * Get files I've shared
 */
export const getSharedByMe = async () => {
    const response = await api.get('/files/shared/by-me');
    return response.data;
};

/**
 * Revoke a share link
 */
export const revokeShareLink = async (shareId) => {
    const response = await api.delete(`/shares/${shareId}`);
    return response.data;
};

/**
 * Update share link settings
 */
export const updateShareLink = async (shareId, updates) => {
    const response = await api.put(`/shares/${shareId}`, updates);
    return response.data;
};

/**
 * Access a shared resource (public, no auth)
 */
export const accessShare = async (token, password) => {
    const response = await api.post(`/public/share/${token}`, { password });
    return response.data;
};

/**
 * Download shared file content
 */
export const downloadSharedFile = async (token, password) => {
    const response = await api.post(`/public/share/${token}/download`, { password }, {
        responseType: 'blob'
    });
    return response.data;
};

const shareService = {
    createShareLink,
    getSharedWithMe,
    getSharedByMe,
    revokeShareLink,
    updateShareLink,
    accessShare,
    downloadSharedFile,
};

export default shareService;
