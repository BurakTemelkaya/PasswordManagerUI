/**
 * KDF (Key Derivation Function) parametreleri
 * Login öncesi /User/GetUserKdfParams endpoint'inden alınır
 */
export interface KdfParams {
  kdfSalt: string; // Base64 encoded salt (16 byte)
  kdfIterations: number; // PBKDF2 iterasyon sayısı (600000)
}

/**
 * Kullanıcı giriş DTO
 */
export interface UserForLoginDto {
  userName: string;
  password: string;
  authenticatorCode?: string;
}

/**
 * Kullanıcı kayıt DTO
 */
export interface UserForRegisterDto {
  userName: string;
  email: string;
  password: string; // AuthHash (base64 encoded)
  kdfSalt: string; // Base64 encoded salt (16 byte)
  kdfIterations: number; // PBKDF2 iterasyon sayısı (600000)
}

/**
 * JWT Token ve bilgileri
 */
export interface AccessToken {
  token: string;
  expirationDate: string;
}

/**
 * Login Response
 */
export interface LoginResponse {
  accessToken: AccessToken;
  requiredAuthenticatorType: string | null;
  encryptionKey: string | null;
}

/**
 * Refresh Token bilgileri
 */
export interface RefreshToken {
  id: string;
  userId: string;
  token: string;
  expirationDate: string;
  createdByIp: string;
}

/**
 * Register Response
 * Backend kayıt sonrası token ve KDF bilgilerini döner
 */
export interface RegisterResponse {
  accessToken: AccessToken;
  refreshToken: RefreshToken;
  kdfSalt: string; // Base64 encoded salt (encryption için)
  kdfIterations: number; // PBKDF2 iterasyon sayısı
}

/**
 * Şifrelenmiş parola oluşturma DTO
 */
export interface CreatePasswordDto {
  encryptedName: string;
  encryptedUserName: string;
  encryptedPassword: string;
  encryptedDescription: string;
  encryptedWebSiteUrl: string;
  iv: string;
}

/**
 * Şifrelenmiş parola güncelleme DTO
 */
export interface UpdatedPasswordDto {
  id: string;
  encryptedName: string;
  encryptedUserName: string;
  encryptedPassword: string;
  encryptedDescription: string;
  encryptedWebSiteUrl: string;
  iv: string;
}

/**
 * Parola silme komutu
 */
export interface DeletePasswordCommand {
  id: string;
}

/**
 * Parola veri yapısı
 */
export interface Password {
  id: string;
  encryptedName: string;
  encryptedUserName: string;
  encryptedPassword: string;
  encryptedDescription: string;
  encryptedWebSiteUrl: string;
  iv: string;
  userId: string;
  createdDate: string;
  updatedDate: string | null;
}

/**
 * Sayfalı liste yanıtı
 */
export interface PagedResponse<T> {
  items: T[];
  index: number;
  size: number;
  count: number;
  pages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

/**
 * Master Password güncelleme için re-encrypt edilmiş parola DTO
 */
export interface UpdatedPasswordForMasterDto {
  id: string;
  encryptedName: string;
  encryptedUserName: string;
  encryptedPassword: string;
  encryptedDescription: string;
  encryptedWebSiteUrl: string;
  iv: string;
  userId: string;
}

/**
 * Master Password güncelleme DTO
 */
export interface UpdateMasterPasswordDto {
  userId?: string;
  existPassword: string;
  newPassword: string;
  updatedPasswords: UpdatedPasswordForMasterDto[];
}
