import api from './api';

/**
 * Analytics Service
 * Handles all analytics-related API calls
 */
const analyticsService = {
    /**
     * Get comprehensive analytics
     */
    async getAnalytics() {
        const response = await api.get('/analytics');
        return response.data;
    },

    /**
     * Get storage statistics
     */
    async getStorageStats() {
        const response = await api.get('/analytics/storage');
        return response.data;
    },

    /**
     * Get storage breakdown by type
     */
    async getStorageByType() {
        const response = await api.get('/analytics/by-type');
        return response.data;
    },

    /**
     * Get storage breakdown by folder
     */
    async getStorageByFolder() {
        const response = await api.get('/analytics/by-folder');
        return response.data;
    },

    /**
     * Get largest files
     */
    async getLargestFiles(limit = 10) {
        const response = await api.get(`/analytics/largest-files?limit=${limit}`);
        return response.data.files;
    },

    /**
     * Get storage trends
     */
    async getStorageTrends(days = 30) {
        const response = await api.get(`/analytics/trends?days=${days}`);
        return response.data.trends;
    },
};

export default analyticsService;
