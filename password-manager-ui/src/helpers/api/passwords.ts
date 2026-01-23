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
 * Tüm parolaları getir (Yeni endpoint - pagination yok)
 */
export const getAllPasswords = async (): Promise<Password[]> => {
  try {
    const response = await apiClient.get('/Password/GetAll');
    const data = response.data;
    
    console.log('📦 GetAll API raw response:', data);
    
    // API yanıtı dizi mi kontrol et
    if (Array.isArray(data)) {
      console.log('✅ Direct array format, count:', data.length);
      return data as Password[];
    }
    
    // .NET ReferenceHandler.Preserve formatı ($id, $values)
    if (data && Array.isArray(data.$values)) {
      console.log('✅ .NET $values format, count:', data.$values.length);
      return data.$values as Password[];
    }
    
    // PagedResponse formatında mı? (items property)
    if (data && Array.isArray(data.items)) {
      console.log('✅ PagedResponse format, items count:', data.items.length);
      return data.items as Password[];
    }
    
    // Data property içinde mi? (ApiResponse wrapper)
    if (data && Array.isArray(data.data)) {
      console.log('✅ ApiResponse wrapper format, data count:', data.data.length);
      return data.data as Password[];
    }
    
    // PascalCase versiyonları (C# backend)
    if (data && Array.isArray(data.Items)) {
      console.log('✅ PascalCase Items format, count:', data.Items.length);
      return data.Items as Password[];
    }
    
    // Tek obje mi? (tek parola varsa)
    if (data && typeof data === 'object' && data.id) {
      console.log('✅ Single password object detected');
      return [data as Password];
    }
    
    // Boş veya beklenmeyen format
    console.warn('⚠️ Unexpected API response format, returning empty array');
    return [];
  } catch (error) {
    console.error('🔴 Get Passwords API Error:', error);
    throw error;
  }
};

/**
 * Tüm parolaları getir (Sayfalı - Eski endpoint)
 * @deprecated Artık getAllPasswords kullanın
 */
export const getAllPasswordsPaged = async (
  pageIndex: number = 0,
  pageSize: number = 10
): Promise<PagedResponse<Password>> => {
  try {
    const response = await apiClient.get<PagedResponse<Password>>('/Password', {
      params: { PageIndex: pageIndex, PageSize: pageSize },
    });
    return response.data;
  } catch (error) {
    console.error('🔴 Get Passwords Paged API Error:', error);
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
