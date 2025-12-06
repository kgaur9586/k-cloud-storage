import api from './api';

/**
 * Get queue statistics
 */
export const getQueueStats = async () => {
    const response = await api.get('/queue/stats');
    return response.data; // Interceptor already unwraps response.data.data
};

/**
 * Get jobs by status
 */
export const getJobs = async (status = 'failed', limit = 10) => {
    const response = await api.get('/queue/jobs', {
        params: { status, limit },
    });
    return response.data; // Interceptor already unwraps response.data.data
};

/**
 * Retry a failed job
 */
export const retryJob = async (jobId) => {
    const response = await api.post(`/queue/jobs/${jobId}/retry`);
    return response.data;
};

const queueService = {
    getQueueStats,
    getJobs,
    retryJob,
};

export default queueService;
