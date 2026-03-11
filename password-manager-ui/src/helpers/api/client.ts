import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
import { config } from '../config';
import { ApiError, type ProblemDetails } from '../../types';

// Token yenileme işlemi devam ediyor mu?
let isRefreshing = false;
// Bekleyen istekler kuyruğu
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

/**
 * Bekleyen istekleri işle
 */
const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

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
  withCredentials: true, // Cookie'leri gönder (refresh token için)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  async (requestConfig) => {
    const token = localStorage.getItem('authToken');

    // DEBUG: İstek detaylarını logla
    console.log(`🌐 API Request: ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`, {
      hasToken: !!token,
      headers: requestConfig.headers
    });

    // Proaktif token süresi kontrolü: Süresi 2 dakika içinde dolacaksa önceden yenile
    if (token && !requestConfig.url?.includes('/Auth/')) {
      const expiration = localStorage.getItem('tokenExpiration');
      if (expiration) {
        const expiresAt = new Date(expiration).getTime();
        const now = Date.now();
        const twoMinutes = 2 * 60 * 1000;
        if (expiresAt - now < twoMinutes && expiresAt > now) {
          console.log('⚠️ Token süresi dolmak üzere, proaktif yenileme başlatılıyor...');
          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await axios.post(
                `${config.api.baseURL}/Auth/RefreshToken`,
                { refreshToken },
                { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
              );
              const newAccessToken = response.data.token || response.data.accessToken?.token;
              const newExpiration = response.data.expirationDate || response.data.accessToken?.expirationDate;
              if (newAccessToken) {
                localStorage.setItem('authToken', newAccessToken);
                if (newExpiration) localStorage.setItem('tokenExpiration', newExpiration);
                if (response.data.refreshToken?.token) {
                  localStorage.setItem('refreshToken', response.data.refreshToken.token);
                  localStorage.setItem('refreshTokenExpiration', response.data.refreshToken.expirationDate);
                }
                if (requestConfig.headers) {
                  requestConfig.headers.Authorization = `Bearer ${newAccessToken}`;
                }
                console.log('✅ Proaktif token yenileme başarılı');
                return requestConfig;
              }
            }
          } catch (refreshErr) {
            console.warn('⚠️ Proaktif token yenileme başarısız, mevcut token ile devam ediliyor:', refreshErr);
          }
        }
      }
    }

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
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401 Unauthorized ve henüz retry yapılmadıysa
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Login sayfasındaysa veya refresh token isteğiyse direkt hata döndür
      if (window.location.pathname.includes('/login') || originalRequest.url?.includes('/Auth/RefreshToken')) {
        return Promise.reject(parseErrorResponse(error));
      }

      // Token yenileme işlemi zaten devam ediyorsa kuyruğa ekle (15s timeout ile)
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Token yenileme kuyruğu zaman aşımı'));
          }, 15000);
          failedQueue.push({
            resolve: (value) => { clearTimeout(timeout); resolve(value); },
            reject: (reason) => { clearTimeout(timeout); reject(reason); }
          });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const currentToken = localStorage.getItem('authToken');

      if (!currentToken) {
        // Token yoksa çıkış yap
        isRefreshing = false;
        processQueue(new Error('No auth token'), null);
        forceLogout();
        return Promise.reject(parseErrorResponse(error));
      }

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        let response;
        const retryTimeout = config.api.timeout || 30000;

        if (refreshToken) {
          // Extension Uyumlu: POST metodu ile refreshToken'ı body'de gönder
          response = await axios.post(
            `${config.api.baseURL}/Auth/RefreshToken`,
            { refreshToken },
            {
              headers: {
                'Content-Type': 'application/json'
              },
              timeout: retryTimeout
            }
          );
        } else {
          // Web Uyumlu: GET metodu ile cookie üzerinden yenileme (withCredentials)
          response = await axios.get(
            `${config.api.baseURL}/Auth/RefreshToken`,
            {
              withCredentials: true, // Cookie'leri gönder
              headers: {
                'Authorization': `Bearer ${currentToken}`
              },
              timeout: retryTimeout
            }
          );
        }

        // API response: { token, expirationDate }
        const newAccessToken = response.data.token;
        const newExpiration = response.data.expirationDate;

        if (newAccessToken) {
          localStorage.setItem('authToken', newAccessToken);
          if (newExpiration) {
            localStorage.setItem('tokenExpiration', newExpiration);
          }
        } else {
          throw new Error('Yeni token alınamadı');
        }

        isRefreshing = false;
        processQueue(null, newAccessToken);

        // Orijinal isteği yeni token ile tekrar dene
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);

      } catch (refreshError) {
        console.error('🔴 Token yenileme başarısız:', refreshError);
        isRefreshing = false;
        processQueue(refreshError, null);

        // Refresh token da geçersizse çıkış yap
        forceLogout();
        return Promise.reject(parseErrorResponse(refreshError));
      }
    }

    // ApiError'a dönüştür
    const apiError = parseErrorResponse(error);
    return Promise.reject(apiError);
  }
);

/**
 * Kullanıcıyı zorla çıkış yaptır
 */
function forceLogout() {
  // Sayfa yeniden yüklenince console temizlendiği için sebep bilgisi sakla
  console.error('🔴 forceLogout çağrıldı - oturum süresi doldu veya refresh token geçersiz');
  localStorage.setItem('_forceLogoutReason', 'session_expired');
  localStorage.setItem('_forceLogoutTime', new Date().toISOString());

  localStorage.removeItem('authToken');
  localStorage.removeItem('tokenExpiration');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('refreshTokenExpiration');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('passwords');
  localStorage.removeItem('lastSyncDate');

  sessionStorage.removeItem('encryptionKey');
  sessionStorage.clear();

  const reloadApp = () => {
    if (window.location.protocol === 'chrome-extension:') {
      window.location.reload();
    } else {
      window.location.href = '/login';
    }
  };

  if (typeof chrome !== 'undefined' && chrome.storage) {
    const p1 = chrome.storage.session?.clear() || Promise.resolve();
    const p2 = chrome.storage.local?.remove(['authToken', 'encryptionKeyCheck', 'refreshToken', 'passwords', 'tokenExpiration', 'refreshTokenExpiration']) || Promise.resolve();

    Promise.all([p1, p2]).then(reloadApp).catch(reloadApp);
  } else {
    reloadApp();
  }
}

export { parseErrorResponse };
export default apiClient;
