import { apiClient } from './client';
import type { UserForLoginDto, UserForRegisterDto, LoginResponse, RegisterResponse, UpdateMasterPasswordDto, KdfParams, RefreshTokenResponse } from '../../types';
import { 
  deriveMasterKeyWithKdf, 
  deriveEncryptionKey, 
  createAuthHash,
  decryptDataFromAPI, 
  encryptDataForAPI,
  stringToBase64 
} from '../encryption';
import type { Password } from '../../types';

/**
 * Kullanıcının KDF parametrelerini al (Login öncesi)
 * Bu endpoint kullanıcı yoksa bile fake KDF döner (güvenlik için)
 */
export const getUserKdfParams = async (userName: string): Promise<KdfParams> => {
  try {
    
    const response = await apiClient.get('/User/GetUserKdfParams', {
      params: { UserName: userName }
    });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = response.data as any;
    
    // Backend PascalCase (C#) veya camelCase dönebilir - her ikisini de destekle
    const kdfSalt = data.kdfSalt || data.KdfSalt || '';
    const kdfIterations = data.kdfIterations || data.KdfIterations || 600000;
    
    return { kdfSalt, kdfIterations };
  } catch (error: any) {
    console.error('🔴 Get KDF Params API Error:', error);
    console.error('🔴 Error message:', error?.message);
    console.error('🔴 Error response:', error?.response?.data);
    console.error('🔴 Error status:', error?.response?.status);
    console.error('🔴 Error code:', error?.code);
    
    // CORS veya network hatası olabilir
    if (error?.code === 'ERR_NETWORK' || !error?.response) {
      throw new Error('API bağlantı hatası. CORS veya network problemi olabilir.');
    }
    
    throw error;
  }
};

/**
 * Kullanıcı kayıt
 */
export const register = async (data: UserForRegisterDto): Promise<RegisterResponse> => {
  try {  
    const response = await apiClient.post<RegisterResponse>('/Auth/Register', data);
    
    return response.data;
  } catch (error: any) {
    console.error('🔴 Register API Error:', error);
    console.error('Error response:', error?.response?.data);
    console.error('Error status:', error?.response?.status);
    throw error;
  }
};

/**
 * Kullanıcı giriş
 */
export const login = async (data: UserForLoginDto): Promise<LoginResponse> => {
  try {   
    const response = await apiClient.post<LoginResponse>('/Auth/Login', data);

    // Token ve bilgileri sakla
    if (response.data.accessToken?.token) {
      localStorage.setItem('authToken', response.data.accessToken.token);
      localStorage.setItem('tokenExpiration', response.data.accessToken.expirationDate);
    }
    
    // Refresh token'ı da sakla
    if (response.data.refreshToken?.token) {
      localStorage.setItem('refreshToken', response.data.refreshToken.token);
      localStorage.setItem('refreshTokenExpiration', response.data.refreshToken.expirationDate);
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
 * Kullanıcı çıkış - Token'ı API'den iptal et ve local storage'ı temizle
 */
export const logout = async (): Promise<void> => {
  const token = localStorage.getItem('authToken');
  
  // Token varsa API'den iptal et
  if (token) {
    try {
      await revokeToken(token);
    } catch (error) {
      // Hata olsa bile local logout devam etsin
      console.warn('⚠️ Token iptal edilemedi, yine de çıkış yapılıyor:', error);
    }
  }
  
  // Local storage'ı temizle
  localStorage.removeItem('authToken');
  localStorage.removeItem('tokenExpiration');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('refreshTokenExpiration');
  localStorage.removeItem('encryptionKey');
  localStorage.removeItem('userName');
  localStorage.removeItem('passwords');
};

/**
 * Mevcut JWT token ile yeni access token al
 * @returns Yeni access token
 */
export const refreshAccessToken = async (): Promise<RefreshTokenResponse> => {
  try {    
    // apiClient zaten Authorization header ekliyor (GET metodu)
    const response = await apiClient.get<RefreshTokenResponse>('/Auth/RefreshToken');
    
    // Yeni token'ı sakla
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('tokenExpiration', response.data.expirationDate);
    }
    
    return response.data;
  } catch (error: any) {
    console.error('🔴 Refresh Token API Error:', error);
    throw error;
  }
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
 * Kullanıcı parolasını güncelle (Eski endpoint - basit güncelleme)
 * @deprecated Artık updateMasterPassword kullanın
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

/**
 * Master Password güncelle ve tüm parolaları yeni key ile re-encrypt et
 * 
 * Bu fonksiyon:
 * 1. Mevcut şifreden AuthHash hesaplar (backend doğrulama için)
 * 2. Tüm parolaları mevcut encryption key ile decrypt eder
 * 3. Yeni master password'den yeni encryption key ve AuthHash türetir
 * 4. Tüm parolaları yeni encryption key ile re-encrypt eder
 * 5. API'ye PUT /User/UpdatePassword ile gönderir
 * 
 * @param currentPassword Mevcut master password
 * @param newPassword Yeni master password
 * @param kdfSalt KDF salt değeri (base64 encoded)
 * @param kdfIterations PBKDF2 iterasyon sayısı
 * @param passwords Mevcut şifrelenmiş parolalar
 * @param currentEncryptionKey Mevcut encryption key (hex)
 * @returns Promise<{ success: boolean, newEncryptionKey: string }>
 */
export const updateMasterPassword = async (
  currentPassword: string,
  newPassword: string,
  kdfSalt: string,
  kdfIterations: number,
  passwords: Password[],
  currentEncryptionKey: string
): Promise<{ success: boolean; newEncryptionKey: string }> => {
  try {
    // 1. Mevcut şifreden AuthHash hesapla (backend doğrulaması için)
    const currentMasterKey = await deriveMasterKeyWithKdf(currentPassword, kdfSalt, kdfIterations);
    const currentAuthHash = await createAuthHash(currentMasterKey);

    // 2. Yeni şifreden MasterKey, AuthHash ve EncryptionKey türet
    const newMasterKey = await deriveMasterKeyWithKdf(newPassword, kdfSalt, kdfIterations);
    const newAuthHash = await createAuthHash(newMasterKey);
    const newEncryptionKey = await deriveEncryptionKey(newMasterKey);

    // 3. Tüm parolaları decrypt et ve yeni key ile re-encrypt et
    const updatedPasswords = [];

    for (const password of passwords) {
      try {
        // Decrypt with current key
        const decrypted = await decryptDataFromAPI(
          {
            encryptedName: password.encryptedName,
            encryptedUserName: password.encryptedUserName,
            encryptedPassword: password.encryptedPassword,
            encryptedDescription: password.encryptedDescription,
            encryptedWebSiteUrl: password.encryptedWebSiteUrl,
          },
          currentEncryptionKey,
          password.iv
        );

        // Re-encrypt with new key
        const reEncrypted = await encryptDataForAPI(
          {
            name: decrypted.name,
            username: decrypted.username,
            password: decrypted.password,
            description: decrypted.description,
            websiteUrl: decrypted.websiteUrl,
          },
          newEncryptionKey
        );

        updatedPasswords.push({
          id: password.id,
          encryptedName: reEncrypted.encryptedName,
          encryptedUserName: reEncrypted.encryptedUserName,
          encryptedPassword: reEncrypted.encryptedPassword,
          encryptedDescription: reEncrypted.encryptedDescription,
          encryptedWebSiteUrl: reEncrypted.encryptedWebSiteUrl,
          iv: reEncrypted.iv,
          userId: password.userId,
        });

      } catch (decryptError) {
        console.error(`❌ Parola decrypt/re-encrypt hatası: ${password.id}`, decryptError);
        throw new Error(`Parola işlenirken hata: ${password.id}`);
      }
    }

    // 4. API'ye gönder (AuthHash'ler base64 encoded)
    const payload: UpdateMasterPasswordDto = {
      existPassword: stringToBase64(currentAuthHash), // AuthHash - base64 encoded
      newPassword: stringToBase64(newAuthHash), // AuthHash - base64 encoded
      updatedPasswords: updatedPasswords,
    };

    await apiClient.put('/User/UpdatePassword', payload);

    return {
      success: true,
      newEncryptionKey: newEncryptionKey,
    };
  } catch (error: any) {
    console.error('🔴 Master Password Update Error:', error);
    
    // API hata mesajını yakala
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    } else if (error.message) {
      throw error;
    }
    
    throw new Error('Master Password güncellenirken bir hata oluştu');
  }
};
