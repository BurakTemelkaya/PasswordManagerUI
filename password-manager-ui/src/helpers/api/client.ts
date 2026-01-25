import type { AxiosInstance } from 'axios';
import axios from 'axios';
import { config } from '../config';
import { ApiError, type ProblemDetails } from '../../types';

/**
 * ProblemDetails formatında mı kontrol et
 */
function isProblemDetails(data: unknown): data is ProblemDetails {
  return (
    typeof data === 'object' &&
    data !== null &&
    ('type' in data || 'title' in data || 'status' in data || 'detail' in data)
  );
}

/**
 * Hata yanıtını ApiError'a dönüştür
 */
function parseErrorResponse(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;
    
    // ProblemDetails formatı
    if (isProblemDetails(responseData)) {
      return new ApiError({
        type: responseData.type,
        title: responseData.title,
        status: responseData.status || error.response?.status || 500,
        detail: responseData.detail,
      });
    }
    
    // String mesaj
    if (typeof responseData === 'string') {
      return new ApiError({
        status: error.response?.status || 500,
        title: 'Hata',
        detail: responseData,
      });
    }
    
    // Eski format { message: string } veya { error: string }
    if (responseData?.message || responseData?.error) {
      return new ApiError({
        status: error.response?.status || 500,
        title: 'Hata',
        detail: responseData.message || responseData.error,
      });
    }
    
    // Network hatası
    if (error.code === 'ERR_NETWORK') {
      return new ApiError({
        status: 0,
        title: 'Bağlantı Hatası',
        detail: 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.',
      });
    }
    
    // Timeout
    if (error.code === 'ECONNABORTED') {
      return new ApiError({
        status: 408,
        title: 'Zaman Aşımı',
        detail: 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.',
      });
    }
    
    // Genel axios hatası
    return new ApiError({
      status: error.response?.status || 500,
      title: error.response?.statusText || 'Hata',
      detail: error.message || 'Beklenmeyen bir hata oluştu',
    });
  }
  
  // Bilinmeyen hata
  if (error instanceof Error) {
    return new ApiError({
      status: 500,
      title: 'Hata',
      detail: error.message,
    });
  }
  
  return new ApiError({
    status: 500,
    title: 'Hata',
    detail: 'Beklenmeyen bir hata oluştu',
  });
}

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
    // ApiError'a dönüştür
    const apiError = parseErrorResponse(error);
    
    // 401 Unauthorized - logout (login sayfası hariç)
    if (apiError.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('encryptionKey');
      window.location.href = '/login';
    }
    
    // ApiError olarak reject et
    return Promise.reject(apiError);
  }
);

export { parseErrorResponse };
export default apiClient;
