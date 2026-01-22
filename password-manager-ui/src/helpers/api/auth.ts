import { apiClient } from './client';
import type { UserForLoginDto, UserForRegisterDto, LoginResponse, RegisterResponse } from '../../types';

/**
 * Kullanıcı kayıt
 */
export const register = async (data: UserForRegisterDto): Promise<RegisterResponse> => {
  try {
    const response = await apiClient.post<RegisterResponse>('/Auth/Register', data);
    return response.data;
  } catch (error) {
    console.error('🔴 Register API Error:', error);
    throw error;
  }
};

/**
 * Kullanıcı giriş
 */
export const login = async (data: UserForLoginDto): Promise<LoginResponse> => {
  try {
    console.log('🔄 Login API call başlanıyor:', {
      baseURL: apiClient.defaults.baseURL,
      endpoint: '/Auth/Login',
      data
    });
    
    const response = await apiClient.post<LoginResponse>('/Auth/Login', data);

    // Token ve bilgileri sakla
    if (response.data.accessToken?.token) {
      localStorage.setItem('authToken', response.data.accessToken.token);
      localStorage.setItem('tokenExpiration', response.data.accessToken.expirationDate);
      console.log('✅ Token localStorage\'a kaydedildi');
    }

    return response.data;
  } catch (error: any) {
    console.error('🔴 Login API Error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
    });
    throw error;
  }
};

/**
 * Kullanıcı çıkış
 */
export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('tokenExpiration');
  localStorage.removeItem('encryptionKey');
  localStorage.removeItem('userName');
  console.log('✅ Çıkış yapıldı');
};

/**
 * Token iptal et
 */
export const revokeToken = async (token: string) => {
  try {
    const response = await apiClient.put('/Auth/RevokeToken', JSON.stringify(token));
    return response.data;
  } catch (error) {
    console.error('🔴 Revoke Token API Error:', error);
    throw error;
  }
};

/**
 * Kullanıcı parolasını güncelle
 */
export const updateUserPassword = async (existPassword: string, newPassword: string) => {
  try {
    const response = await apiClient.put('/User/UpdatePassword', {
      existPassword,
      newPassword,
    });
    return response.data;
  } catch (error) {
    console.error('🔴 Update User Password API Error:', error);
    throw error;
  }
};
