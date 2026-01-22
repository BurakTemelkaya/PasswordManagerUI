/**
 * Debug Helper - Crypto State Kontrolü
 * Tarayıcı Console'da çalışan debugging utilities
 */

// window'a expose et (console'da kullanılabilir)
export const debugCrypto = () => {
  const encryptionKey = localStorage.getItem('encryptionKey');
  const authToken = localStorage.getItem('authToken');
  const userName = localStorage.getItem('userName');

  return {
    encryptionKey: {
      exists: !!encryptionKey,
      length: encryptionKey?.length,
      preview: encryptionKey?.substring(0, 32) + '...',
    },
    authToken: {
      exists: !!authToken,
      preview: authToken?.substring(0, 32) + '...',
    },
    userName: {
      exists: !!userName,
      value: userName,
    },
    allKeys: Object.keys(localStorage),
  };
};

// Window'a ata
if (typeof window !== 'undefined') {
  (window as any).__debugCrypto = debugCrypto;
}

export default debugCrypto;
