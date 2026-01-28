/**
 * Web Worker - PBKDF2 işlemlerini arka planda çalıştır (Web Crypto API)
 * Ana thread'i dondurmamak için kullanılır
 * 
 * 600,000 iterasyon çok ağır olduğundan UI'ı etkilemesin diye
 * Web Worker içinde çalıştırılır
 * 
 * Web Crypto API = Donanım hızlandırmalı, çok hızlı!
 */

export interface CryptoWorkerMessage {
  type: 'deriveMasterKey';
  masterPassword: string;
  userId: string;
  iterations: number;
}

export interface CryptoWorkerResult {
  type: 'deriveMasterKey';
  success: boolean;
  masterKey?: string;
  error?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

const bufferToHex = (buffer: ArrayBuffer): string => {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

const hexToBuffer = (hex: string): ArrayBuffer => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
};

const stringToBuffer = (str: string): ArrayBuffer => {
  return new TextEncoder().encode(str).buffer as ArrayBuffer;
};

const hashSHA256 = async (text: string): Promise<string> => {
  const buffer = stringToBuffer(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return bufferToHex(hashBuffer);
};

// ============================================================================
// Web Worker Message Handler
// ============================================================================

// Web Worker'a mesaj dinle
self.onmessage = async (event: MessageEvent<CryptoWorkerMessage>) => {
  try {
    const { type, masterPassword, userId, iterations } = event.data;

    if (type === 'deriveMasterKey') {
      // Salt oluştur (SHA256 of userId) - userId asla değişmez!
      const saltHex = await hashSHA256(userId);
      const saltBuffer = hexToBuffer(saltHex);

      // Password buffer'a dönüştür
      const passwordBuffer = stringToBuffer(masterPassword);

      // PBKDF2 çalıştır (Web Crypto API - DONANIM HIZLANDIRMALI!)
      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: saltBuffer,
          iterations: iterations,
          hash: 'SHA-256',
        },
        await crypto.subtle.importKey('raw', passwordBuffer, 'PBKDF2', false, [
          'deriveKey',
        ]),
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      // Key'i export et ve hex'e çevir
      const exportedKey = await crypto.subtle.exportKey('raw', derivedKey);
      const masterKeyHex = bufferToHex(exportedKey);

      const result: CryptoWorkerResult = {
        type: 'deriveMasterKey',
        success: true,
        masterKey: masterKeyHex,
      };

      self.postMessage(result);
    }
  } catch (error: any) {
    const result: CryptoWorkerResult = {
      type: 'deriveMasterKey',
      success: false,
      error: error?.message || 'Bilinmeyen hata',
    };

    self.postMessage(result);
  }
};

