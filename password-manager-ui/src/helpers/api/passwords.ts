import { apiClient } from './client';
import type { CreatePasswordDto, UpdatedPasswordDto, DeletePasswordCommand, Password, PagedResponse } from '../../types';

/**
 * Yeni parola ekle
 */
export const addPassword = async (data: CreatePasswordDto): Promise<Password> => {
  try {
    const response = await apiClient.post<Password>('/Password', data);
    return response.data;
  } catch (error) {
    console.error('🔴 Add Password API Error:', error);
    throw error;
  }
};

/**
 * Tüm parolaları getir (Sayfalı)
 */
export const getAllPasswords = async (
  pageIndex: number = 0,
  pageSize: number = 10
): Promise<PagedResponse<Password>> => {
  try {
    const response = await apiClient.get<PagedResponse<Password>>('/Password', {
      params: { PageIndex: pageIndex, PageSize: pageSize },
    });
    return response.data;
  } catch (error) {
    console.error('🔴 Get Passwords API Error:', error);
    throw error;
  }
};

/**
 * Parola ID'ye göre getir
 */
export const getPasswordById = async (id: string): Promise<Password> => {
  try {
    const response = await apiClient.get<Password>(`/Password/${id}`);
    return response.data;
  } catch (error) {
    console.error('🔴 Get Password by ID API Error:', error);
    throw error;
  }
};

/**
 * Parolayı güncelle
 */
export const updatePassword = async (data: UpdatedPasswordDto): Promise<Password> => {
  try {
    const response = await apiClient.put<Password>('/Password', data);
    return response.data;
  } catch (error) {
    console.error('🔴 Update Password API Error:', error);
    throw error;
  }
};

/**
 * Parolayı sil
 */
export const deletePassword = async (command: DeletePasswordCommand) => {
  try {
    const response = await apiClient.delete('/Password', {
      data: command,
    });
    return response.data;
  } catch (error) {
    console.error('🔴 Delete Password API Error:', error);
    throw error;
  }
};

/**
 * Parolaları import et
 */
export const importPasswords = async (passwordsData: CreatePasswordDto[]) => {
  try {
    const response = await apiClient.post('/Password/Import', {
      importPasswordsDto: passwordsData,
    });
    return response.data;
  } catch (error) {
    console.error('🔴 Import Passwords API Error:', error);
    throw error;
  }
};
