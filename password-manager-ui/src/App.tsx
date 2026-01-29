import { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router'
import './App.css'
import './styles/pages.css'
import debugCrypto from './helpers/debug'

// Console'da __debugCrypto() çağırabilmek için window'a expose et
if (typeof window !== 'undefined') {
  (window as any).__debugCrypto = debugCrypto;
  console.log('💡 Debug mode: console\'da __debugCrypto() çağırarak state kontrol edebilirsin');
}

import { VaultLockProvider } from './context/VaultLockContext';
import { PasswordProvider } from './context/PasswordContext';

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initStorage = async () => {
      // Chrome extension ise ve authToken yoksa, chrome.storage.local'dan geri yükle
      if (typeof chrome !== 'undefined' && chrome.storage?.local && !localStorage.getItem('authToken')) {
        try {
          const result = await chrome.storage.local.get(['authToken', 'userName', 'userId', 'encryptionKeyCheck', 'kdfSalt', 'kdfIterations', 'vaultTimeout', 'vaultAction', 'lockOnBrowserClose', 'lockOnSystemLock']);

          if (result.authToken) {
            localStorage.setItem('authToken', result.authToken as string);
            if (result.userName) localStorage.setItem('userName', result.userName as string);
            if (result.userId) localStorage.setItem('userId', result.userId as string);
            if (result.encryptionKeyCheck) localStorage.setItem('encryptionKeyCheck', result.encryptionKeyCheck as string);
            if (result.kdfSalt) localStorage.setItem('kdfSalt', result.kdfSalt as string);
            if (result.kdfIterations) localStorage.setItem('kdfIterations', String(result.kdfIterations));

            // Settings sync
            if (result.vaultTimeout) localStorage.setItem('vaultTimeout', String(result.vaultTimeout));
            if (result.vaultAction) localStorage.setItem('vaultAction', result.vaultAction as string);
            if (result.lockOnBrowserClose) localStorage.setItem('lockOnBrowserClose', String(result.lockOnBrowserClose));
            if (result.lockOnSystemLock) localStorage.setItem('lockOnSystemLock', String(result.lockOnSystemLock));

            console.log('✅ Auth token restored from chrome.storage.local');
          }
        } catch (e) {
          console.warn('Storage sync error:', e);
        }
      }
      setReady(true);
    };

    initStorage();
  }, []);

  if (!ready) return null;

  return (
    <div className="app">
      <BrowserRouter>
        <VaultLockProvider>
          <PasswordProvider>
            <AppRouter />
          </PasswordProvider>
        </VaultLockProvider>
      </BrowserRouter>
    </div>
  )
}

export default App
