/**
 * Environment değişkenleri ve yapılandırma
 * 
 * Ortam Seçimi:
 * - Development: npm run dev → .env.development
 * - Production: npm run build → .env.production
 * 
 * Değişkenler VITE_ prefix'i ile başlamalı
 */

export const config = {
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Password Manager',
    debug: import.meta.env.VITE_DEBUG === 'true',
    environment: import.meta.env.MODE, // 'development' veya 'production'
  },
  api: {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost:7051/api',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),
  },
  encryption: {
    key: import.meta.env.VITE_ENCRYPTION_KEY || 'default-key-change-me',
  },
};

/**
 * DEBUG loglama
 * Production'ta console.log gösterilmez
 */
export const debugLog = (message: string, data?: any) => {
  if (config.app.debug) {
    console.log(`[${config.app.name}]`, message, data || '');
  }
};

/**
 * API endpoint oluştur
 */
export const getAPIEndpoint = (path: string): string => {
  return `${config.api.baseURL}${path.startsWith('/') ? path : '/' + path}`;
};
