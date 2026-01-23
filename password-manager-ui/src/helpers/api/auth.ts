import { apiClient } from './client';
import type { UserForLoginDto, UserForRegisterDto, LoginResponse, RegisterResponse, UpdateMasterPasswordDto, KdfParams } from '../../types';
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
    
    console.log('🔑 KDF Params received:', { 
      kdfSalt: kdfSalt.substring(0, 20) + '...', 
      kdfIterations 
    });
    
    return { kdfSalt, kdfIterations };
  } catch (error) {
    console.error('🔴 Get KDF Params API Error:', error);
    throw error; // Artık varsayılan döndürme - hata durumunda login başarısız olmalı
  }
};

/**
 * Kullanıcı kayıt
 */
export const register = async (data: UserForRegisterDto): Promise<RegisterResponse> => {
  try {
    console.log('🔄 Register API call başlanıyor:', {
      baseURL: apiClient.defaults.baseURL,
      endpoint: '/Auth/Register',
      data: { ...data, password: '***' } // Password'u gizle
    });
    
    const response = await apiClient.post<RegisterResponse>('/Auth/Register', data);
    
    console.log('✅ Register API response:', {
      hasAccessToken: !!response.data.accessToken,
      hasKdfSalt: !!response.data.kdfSalt,
      kdfIterations: response.data.kdfIterations
    });
    
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
    console.log('🔐 Master Password güncelleme başlıyor...');
    console.log('📊 Toplam parola sayısı:', passwords.length);
    console.log('🔑 KDF Salt:', kdfSalt.substring(0, 20) + '...');
    console.log('🔑 KDF Iterations:', kdfIterations);

    // 1. Mevcut şifreden AuthHash hesapla (backend doğrulaması için)
    console.log('🔑 Mevcut şifreden AuthHash hesaplanıyor...');
    const currentMasterKey = await deriveMasterKeyWithKdf(currentPassword, kdfSalt, kdfIterations);
    const currentAuthHash = await createAuthHash(currentMasterKey);
    console.log('✅ Mevcut AuthHash hesaplandı');

    // 2. Yeni şifreden MasterKey, AuthHash ve EncryptionKey türet
    console.log('🔑 Yeni şifreden türetme yapılıyor...');
    const newMasterKey = await deriveMasterKeyWithKdf(newPassword, kdfSalt, kdfIterations);
    const newAuthHash = await createAuthHash(newMasterKey);
    const newEncryptionKey = await deriveEncryptionKey(newMasterKey);
    console.log('✅ Yeni AuthHash ve EncryptionKey türetildi');

    // 3. Tüm parolaları decrypt et ve yeni key ile re-encrypt et
    console.log('🔄 Parolalar re-encrypt ediliyor...');
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

        console.log(`✅ Parola re-encrypt edildi: ${password.id}`);
      } catch (decryptError) {
        console.error(`❌ Parola decrypt/re-encrypt hatası: ${password.id}`, decryptError);
        throw new Error(`Parola işlenirken hata: ${password.id}`);
      }
    }

    console.log('✅ Tüm parolalar re-encrypt edildi');

    // 4. API'ye gönder (AuthHash'ler base64 encoded)
    const payload: UpdateMasterPasswordDto = {
      existPassword: stringToBase64(currentAuthHash), // AuthHash - base64 encoded
      newPassword: stringToBase64(newAuthHash), // AuthHash - base64 encoded
      updatedPasswords: updatedPasswords,
    };

    console.log('📤 API isteği gönderiliyor...');
    const response = await apiClient.put('/User/UpdatePassword', payload);
    console.log('✅ API isteği başarılı:', response.data);

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
