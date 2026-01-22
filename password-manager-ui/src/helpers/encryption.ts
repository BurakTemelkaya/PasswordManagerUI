import CryptoJS from 'crypto-js';

/**
 * PBKDF2 ile Master Key türet
 * Master Password + Kullanıcı Adı (salt) kullanarak tek seferlik anahtar oluştur
 * 
 * @param masterPassword Kullanıcının ana parolası (hiçbir zaman sunucuya gönderilmez)
 * @param userName Kullanıcı Adı (salt olarak kullanılır)
 * @param iterations PBKDF2 tur sayısı (varsayılan: 200,000 - hızlı giriş için)
 * @returns Master Key (hex formatı)
 */
export const deriveMasterKey = (
  masterPassword: string,
  userName: string,
  iterations: number = 200000
): string => {
  try {
    // Kullanıcı Adını salt olarak kullan
    const salt = CryptoJS.SHA256(userName).toString();
    
    // PBKDF2 ile Master Key türet
    // 256-bit (32 byte) anahtar oluştur
    const masterKey = CryptoJS.PBKDF2(masterPassword, salt, {
      keySize: 256 / 32, // 256 bit = 8 words (her word 32 bit)
      iterations: iterations,
      hasher: CryptoJS.algo.SHA256,
    });

    return masterKey.toString();
  } catch (error) {
    console.error('Master key derivation error:', error);
    throw new Error('Master Key türetme başarısız');
  }
};

/**
 * PBKDF2 ile Master Key'i daha yüksek iterasyon ile türet (arka planda)
 * Sunucudan başarılı yanıt geldikten sonra çalışır
 * 
 * @param masterPassword Kullanıcının ana parolası
 * @param userName Kullanıcı Adı (salt)
 * @returns Promise<string> - Daha güçlü Master Key
 */
export const deriveMasterKeySecure = async (
  masterPassword: string,
  userName: string
): Promise<string> => {
  return new Promise((resolve) => {
    // Web Worker kullanarak async şekilde (arka planda) yap
    setTimeout(() => {
      try {
        const strongKey = deriveMasterKey(masterPassword, userName, 600000);
        resolve(strongKey);
      } catch (error) {
        console.error('Secure master key derivation error:', error);
        resolve(deriveMasterKey(masterPassword, userName, 200000)); // Fallback
      }
    }, 0);
  });
};

/**
 * Auth Hash oluştur (Kimlik doğrulama için)
 * Master Key'i tekrar hash'le ve sunucuya gönder
 * 
 * Sunucuda bu hash'in hash'i alınıp veritabanına kaydedilir (bcrypt/argon2)
 * Bu sayede sunucuda Master Key asla açık halde saklanmaz
 * 
 * @param masterKey deriveMasterKey() fonksiyonundan gelen Master Key
 * @returns Auth Hash (sunucuya gönderilecek)
 */
export const createAuthHash = (masterKey: string): string => {
  try {
    // Master Key'i SHA-512 ile hash'le
    // Bu hash, sunucuya kimlik doğrulama için gönderilir
    const authHash = CryptoJS.SHA512(masterKey).toString();
    return authHash;
  } catch (error) {
    console.error('Auth hash creation error:', error);
    throw new Error('Auth Hash oluşturma başarısız');
  }
};

/**
 * Encryption Key oluştur (Veri şifreleme için)
 * Master Key'den Encryption Key'i türet
 * Bu anahtar asla sunucuya gönderilmez, yalnızca tarayıcıda kalır
 * 
 * @param masterKey deriveMasterKey() fonksiyonundan gelen Master Key
 * @returns Encryption Key (cihazda saklanan, veri şifreleme için kullanılan)
 */
export const deriveEncryptionKey = (masterKey: string): string => {
  try {
    // Master Key'den farklı bir anahtar türet (HKDF benzeri)
    const encryptionKey = CryptoJS.SHA256(masterKey + 'encryption').toString();
    return encryptionKey;
  } catch (error) {
    console.error('Encryption key derivation error:', error);
    throw new Error('Encryption Key türetme başarısız');
  }
};

/**
 * Base64 encode işlemi
 */
export const encodeBase64 = (text: string): string => {
  return btoa(unescape(encodeURIComponent(text)));
};

/**
 * Base64 decode işlemi
 */
export const decodeBase64 = (base64: string): string => {
  return decodeURIComponent(escape(atob(base64)));
};

/**
 * AES şifreleme işlemi
 * @param plainText Şifrelenecek metin
 * @param key Şifreleme anahtarı
 * @returns Şifrelenmiş metin (base64)
 */
export const encryptAES = (plainText: string, key: string): string => {
  try {
    const encrypted = CryptoJS.AES.encrypt(plainText, key);
    return encrypted.toString();
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Şifreleme başarısız');
  }
};

/**
 * AES şifre çözme işlemi
 * @param encryptedText Şifrelenmiş metin
 * @param key Şifreleme anahtarı
 * @returns Şifresi çözülmüş metin
 */
export const decryptAES = (encryptedText: string, key: string): string => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedText, key);
    const plainText = decrypted.toString(CryptoJS.enc.Utf8);
    if (!plainText) {
      throw new Error('Şifre çözülemedi');
    }
    return plainText;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Şifre çözme başarısız');
  }
};

/**
 * IV (Initialization Vector) oluştur
 */
export const generateIV = (): string => {
  const randomBytes = CryptoJS.lib.WordArray.random(16);
  return CryptoJS.enc.Base64.stringify(randomBytes);
};

/**
 * Verileri şifrele ve API gönderimine hazırla
 * Encryption Key kullanarak AES şifreleme yapılır
 * 
 * @param data Şifrelenecek veriler
 * @param encryptionKey Master Key'den türetilmiş Encryption Key
 * @returns Şifrelenmiş ve Base64 encoded veriler
 */
export const encryptDataForAPI = (
  data: {
    name: string;
    username: string;
    password: string;
    description?: string;
    websiteUrl?: string;
  },
  encryptionKey: string
): {
  encryptedName: string;
  encryptedUserName: string;
  encryptedPassword: string;
  encryptedDescription: string;
  encryptedWebSiteUrl: string;
  iv: string;
} => {
  const iv = generateIV();

  try {
    return {
      // AES şifreleme yapılır
      encryptedName: encryptAES(data.name, encryptionKey),
      encryptedUserName: encryptAES(data.username, encryptionKey),
      encryptedPassword: encryptAES(data.password, encryptionKey),
      encryptedDescription: encryptAES(data.description || '', encryptionKey),
      encryptedWebSiteUrl: encryptAES(data.websiteUrl || '', encryptionKey),
      iv: iv,
    };
  } catch (error) {
    console.error('Data encryption error:', error);
    throw error;
  }
};

/**
 * API'den gelen şifrelenmiş verileri çöz
 * Encryption Key kullanarak AES decryption yapılır
 * 
 * @param data API'den gelen şifrelenmiş veriler
 * @param encryptionKey Master Key'den türetilmiş Encryption Key
 * @returns Şifresi çözülmüş veriler
 */
export const decryptDataFromAPI = (
  data: {
    encryptedName: string;
    encryptedUserName: string;
    encryptedPassword: string;
    encryptedDescription: string;
    encryptedWebSiteUrl: string;
  },
  encryptionKey: string
): {
  name: string;
  username: string;
  password: string;
  description: string;
  websiteUrl: string;
} => {
  try {
    return {
      // AES decryption yapılır
      name: decryptAES(data.encryptedName, encryptionKey),
      username: decryptAES(data.encryptedUserName, encryptionKey),
      password: decryptAES(data.encryptedPassword, encryptionKey),
      description: decryptAES(data.encryptedDescription, encryptionKey),
      websiteUrl: decryptAES(data.encryptedWebSiteUrl, encryptionKey),
    };
  } catch (error) {
    console.error('Data decryption error:', error);
    throw error;
  }
};
