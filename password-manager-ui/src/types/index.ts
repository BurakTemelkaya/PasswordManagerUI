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
  password: string;
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
 * Register Response
 */
export interface RegisterResponse {
  success: boolean;
  message?: string;
  userId?: string;
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
