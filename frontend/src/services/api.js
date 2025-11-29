import axios from 'axios';

/**
 * Axios instance configured for API requests
 */
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Set access token for API requests
 * Call this before making authenticated requests
 */
export const setAccessToken = (token) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('Access token set for API requests');
    } else {
        delete api.defaults.headers.common['Authorization'];
        console.log('Access token cleared');
    }
};

/**
 * Response interceptor
 * Handles common error scenarios
 */
api.interceptors.response.use(
    (response) => {
        console.log('API Response:', response.config.url, response.status);
        return response;
    },
    (error) => {
        console.error('API Error:', error.config?.url, error.response?.status, error.response?.data);
        return Promise.reject(error);
    }
);

export default api;
