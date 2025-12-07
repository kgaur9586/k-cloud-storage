import api from './api';

const adminService = {
    // System Statistics
    getSystemStats: async () => {
        const response = await api.get('/admin/stats');
        return response.data;
    },

    getRecentActivity: async (limit = 50) => {
        const response = await api.get(`/admin/activity?limit=${limit}`);
        return response.data;
    },

    // User Management
    listUsers: async (params) => {
        const response = await api.get('/admin/users', { params });
        return response.data;
    },

    updateUserQuota: async (userId, quota) => {
        const response = await api.put(`/admin/users/${userId}/quota`, { quota });
        return response.data;
    },

    updateUserRole: async (userId, role) => {
        const response = await api.put(`/admin/users/${userId}/role`, { role });
        return response.data;
    },

    deleteUser: async (userId) => {
        const response = await api.delete(`/admin/users/${userId}`);
        return response.data;
    },

    // Audit Logs
    getAuditLogs: async (params) => {
        const response = await api.get('/admin/audit-logs', { params });
        return response.data;
    },
};

export default adminService;
