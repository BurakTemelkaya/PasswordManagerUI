import type { AxiosInstance } from 'axios';
import axios from 'axios';
import { config } from '../config';

// Axios instance oluştur
export const apiClient: AxiosInstance = axios.create({
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (requestConfig) => {
    // Token ekle
    const token = localStorage.getItem('authToken');
    if (token && requestConfig.headers) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    return requestConfig;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - logout
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('encryptionKey');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
