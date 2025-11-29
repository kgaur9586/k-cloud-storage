import api from './api';

/**
 * Authentication service
 * Handles all auth-related API calls
 */

/**
 * Get current user
 * Returns 404 if user doesn't exist in database (first-time login)
 */
export const getUser = async () => {
    const response = await api.get('/auth/user');
    return response.data;
};

/**
 * Create new user with profile details
 * Called after first-time Logto authentication
 */
export const createUser = async (userData) => {
    const response = await api.post('/auth/user', userData);
    return response.data;
};

/**
 * Update user profile
 */
export const updateUser = async (userData) => {
    const response = await api.put('/auth/user', userData);
    return response.data;
};

/**
 * Get storage statistics
 */
export const getStorageStats = async () => {
    const response = await api.get('/auth/storage');
    return response.data;
};

const authService = {
    getUser,
    createUser,
    updateUser,
    getStorageStats,
};

export default authService;
