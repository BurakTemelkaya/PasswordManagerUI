import React, { useState, useEffect } from 'react';
import { logout as apiLogout } from './helpers/api/auth';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import './styles/auth.css';
import './styles/popup.css';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardPopup from './pages/DashboardPopup';
import AddPasswordPopup from './pages/AddPasswordPopup';
import ViewPasswordPopup from './pages/ViewPasswordPopup';
import EditPasswordPopup from './pages/EditPasswordPopup';
import Settings from './pages/Settings';
import UnlockVaultPopup from './pages/UnlockVaultPopup';
import PasswordGenerator from './pages/PasswordGenerator';
import { useVaultLock, VaultLockProvider } from './context/VaultLockContext';
import { PasswordProvider } from './context/PasswordContext';

type PopupPage = 'login' | 'register' | 'dashboard' | 'add-password' | 'view-password' | 'edit-password' | 'settings' | 'password-generator' | 'notfound' | 'unlock-vault';

interface PopupState {
  page: PopupPage;
  passwordId?: string;
}

const Popup: React.FC = () => {
  const [state, setState] = useState<PopupState>({ page: 'dashboard' });
  const [loading, setLoading] = useState(true);
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState<string | null>(null);
  const { clearVaultState, checkLockStatus } = useVaultLock();

  useEffect(() => {
    // ==========================================
    // FAIL-SAFE: 10 saniye sonra loading hâlâ true ise zorla kapat
    // Bu, herhangi bir nedenden dolayı checkAuth'un takılmasını önler
    // ==========================================
    const failSafeTimer = setTimeout(() => {
      setLoading(prev => {
        if (prev) {
          console.error('🔴 FAIL-SAFE: checkAuth 10 saniyede tamamlanamadı, loading zorla kapatılıyor');
          // Fallback: localStorage'dan durum belirle
          const fallbackToken = localStorage.getItem('authToken');
          if (!fallbackToken) {
            setState({ page: 'login' });
          } else {
            setState({ page: 'unlock-vault' });
          }
          return false;
        }
        return prev;
      });
    }, 10000);

    // Chrome storage API çağrılarına timeout ekle
    const chromeStorageWithTimeout = <T,>(label: string, storageArea: chrome.storage.StorageArea, keys: string[], timeoutMs = 3000): Promise<Record<string, T>> => {
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          console.warn(`⚠️ [${label}] chrome.storage ${timeoutMs}ms içinde yanıt vermedi, boş dönülüyor`);
          resolve({});
        }, timeoutMs);

        try {
          storageArea.get(keys).then((result) => {
            clearTimeout(timer);
            console.log(`✅ [${label}] chrome.storage başarılı:`, Object.keys(result));
            resolve(result as Record<string, T>);
          }).catch((err: unknown) => {
            clearTimeout(timer);
            console.warn(`⚠️ [${label}] chrome.storage.get hatası:`, err);
            resolve({});
          });
        } catch (err) {
          clearTimeout(timer);
          console.warn(`⚠️ [${label}] chrome.storage.get sync hatası:`, err);
          resolve({});
        }
      });
    };

    const checkAuth = async () => {
      console.log('🔍 [checkAuth] Başladı');
      let token: string | null = null;
      let hasEncryptionKey = false;

      // Chrome extension kontrolü
      if (typeof chrome !== 'undefined' && chrome.storage) {
        console.log('🔍 [checkAuth] Chrome extension ortamı tespit edildi');
        try {
          // 1. Session storage (Master Key - Tarayıcı kapanınca silinir)
          let sessionEncKey: string | undefined;
          if (chrome.storage.session) {
            console.log('🔍 [checkAuth] chrome.storage.session.get(encryptionKey) çağrılıyor...');
            const sessionResult = await chromeStorageWithTimeout('session-encKey', chrome.storage.session, ['encryptionKey']);
            sessionEncKey = sessionResult.encryptionKey as string | undefined;
            console.log('🔍 [checkAuth] encryptionKey:', sessionEncKey ? 'MEVCUT' : 'YOK');
          }

          // 2. Encryption Key'i React session storage'ına sync et (UI oradan okuyor)
          if (sessionEncKey) {
            sessionStorage.setItem('encryptionKey', sessionEncKey);
            hasEncryptionKey = true;
          } else {
            sessionStorage.removeItem('encryptionKey');
            hasEncryptionKey = false;
          }

          // 3. Token kontrolü
          let sessionAuthToken: string | undefined;
          if (chrome.storage.session) {
            console.log('🔍 [checkAuth] chrome.storage.session.get(authToken) çağrılıyor...');
            const sResult = await chromeStorageWithTimeout('session-authToken', chrome.storage.session, ['authToken']);
            sessionAuthToken = sResult.authToken as string | undefined;
            console.log('🔍 [checkAuth] session authToken:', sessionAuthToken ? 'MEVCUT' : 'YOK');
          }

          // Sonra local'e bak (Tarayıcı kapandı açıldı)
          console.log('🔍 [checkAuth] chrome.storage.local.get(authToken, refreshToken) çağrılıyor...');
          const localResult = await chromeStorageWithTimeout('local-tokens', chrome.storage.local, ['authToken', 'refreshToken']);
          console.log('🔍 [checkAuth] local authToken:', localResult.authToken ? 'MEVCUT' : 'YOK');

          token = sessionAuthToken || (localResult.authToken as string) || null;

          // Eğer token varsa session/local storage sync yap (React app için)
          if (token) {
            localStorage.setItem('authToken', token);
          } else {
            localStorage.removeItem('authToken');
          }

        } catch (err) {
          console.warn('🔴 [checkAuth] Chrome storage okuma hatası:', err);
          // Fallback: localStorage'dan oku
          token = localStorage.getItem('authToken');
          hasEncryptionKey = !!sessionStorage.getItem('encryptionKey');
        }
      } else {
        // Dev modu
        console.log('🔍 [checkAuth] Dev modu (chrome.storage yok)');
        token = localStorage.getItem('authToken');
        hasEncryptionKey = !!sessionStorage.getItem('encryptionKey');
      }

      // State Kararı
      console.log('🔍 [checkAuth] Karar: token=' + (token ? 'VAR' : 'YOK') + ', encKey=' + hasEncryptionKey);
      if (!token) {
        // forceLogout sonrası bildirim göster
        const logoutReason = localStorage.getItem('_forceLogoutReason');
        if (logoutReason) {
          const logoutTime = localStorage.getItem('_forceLogoutTime');
          console.warn(`🔴 Önceki oturum sonlandırıldı: ${logoutReason} (${logoutTime})`);
          setSessionExpiredMsg('Oturum süreniz dolduğu için çıkış yapıldı. Lütfen tekrar giriş yapın.');
          localStorage.removeItem('_forceLogoutReason');
          localStorage.removeItem('_forceLogoutTime');
        }
        setState({ page: 'login' });
      } else if (!hasEncryptionKey) {
        setState({ page: 'unlock-vault' });
      } else {
        setState({ page: 'dashboard' });
      }

      console.log('✅ [checkAuth] Tamamlandı, loading=false');
      setLoading(false);
      clearTimeout(failSafeTimer);
    };

    checkAuth().catch((err) => {
      // checkAuth'un yakalanmamış hatasını yakala
      console.error('🔴 [checkAuth] Yakalanmamış hata:', err);
      const fallbackToken = localStorage.getItem('authToken');
      setState({ page: fallbackToken ? 'unlock-vault' : 'login' });
      setLoading(false);
      clearTimeout(failSafeTimer);
    });

    return () => clearTimeout(failSafeTimer);
  }, []);

  const handleLoginSuccess = () => {
    // Login başarılı, token localStorage'da kayıtlı olmalı
    const token = localStorage.getItem('authToken');
    if (token) {
      setState({ page: 'dashboard' });
    }
  };

  const handleRegister = () => {
    setState({ page: 'register' });
  };

  const handleRegisterSuccess = () => {
    // Register başarılı, otomatik dashboard'a git (veya login'e git)
    // Token henüz yok, bu yüzden login'e dönelim
    setState({ page: 'login' });
  };

  const handleBackToLogin = () => {
    setState({ page: 'login' });
  };

  const handleAddPassword = () => {
    setState({ page: 'add-password' });
  };

  const handleViewPassword = (id: string) => {
    setState({ page: 'view-password', passwordId: id });
  };

  const handleEditPassword = (id: string) => {
    setState({ page: 'edit-password', passwordId: id });
  };

  const handleAddPasswordSuccess = () => {
    // Parola ekleme başarılı, dashboard'a geri dön
    setState({ page: 'dashboard' });
  };

  const handleBackToDashboard = () => {
    setState({ page: 'dashboard' });
  };

  const handleSettings = () => {
    setState({ page: 'settings' });
  };

  const handleLogout = async () => {
    // Gerçek API logout'u çağır (refresh token cookie'yi siler)
    try {
      await apiLogout();
    } catch {
      // API hatası olsa da local temizliği yap
    }

    // Tüm local verileri tamamen temizle (önceki kullanıcı verisi kalmasın)
    localStorage.clear();
    sessionStorage.clear();

    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.session?.clear();
      await chrome.storage.local?.remove([
        'authToken',
        'encryptionKey',
        'encryptionKeyCheck',
        'refreshToken',
        'passwords',
        'encryptedPasswords',  // ÖNEMLİ: Şifreli parola önbelleği
        'cachedPasswords',     // ÖNEMLİ: Açık metin önbellek
        'userName',
        'userId',
        'kdfSalt',
        'kdfIterations',
        'apiUrl',
        'lastActivity',
      ]);
    }

    // clearVaultState → isLocked=true → PasswordContext eski veriyi temizler
    clearVaultState();
    setState({ page: 'login' });
  };

  const handlePasswordGenerator = () => {
    setState({ page: 'password-generator' });
  };

  const handleUnlock = () => {
    // VaultLockContext'i güncelle: isLocked=false yap
    // UnlockVaultPopup zaten encryptionKey'i sessionStorage ve chrome.storage.session'a kaydetti
    // checkLockStatus bu key'i bulup isLocked=false yapacak → PasswordContext tetiklenecek
    checkLockStatus();
    setState({ page: 'dashboard' });
  };

  if (loading) {
    return (
      <div className="popup-loading">
        <div className="popup-spinner"></div>
        <span>Yükleniyor...</span>
      </div>
    );
  }

  // Unlock Vault sayfasını render et
  if (state.page === 'unlock-vault') {
    return (
      <div className="popup-page" style={{ height: '100%', minHeight: '500px' }}>
        <UnlockVaultPopup
          onUnlock={handleUnlock}
          onLogout={handleLogout}
        />
      </div>
    );
  }

  // Login sayfasını render et (popup içinde)
  if (state.page === 'login') {
    return (
      <div className="popup-page popup-auth">
        <Login
          onLoginSuccess={() => { setSessionExpiredMsg(null); handleLoginSuccess(); }}
          onRegister={handleRegister}
          initialWarning={sessionExpiredMsg}
        />
      </div>
    );
  }

  // Register sayfasını render et (popup içinde)
  if (state.page === 'register') {
    return (
      <div className="popup-page popup-auth">
        <Register onRegisterSuccess={handleRegisterSuccess} onBackToLogin={handleBackToLogin} />
      </div>
    );
  }

  // Dashboard sayfasını render et (popup içinde)
  if (state.page === 'dashboard') {
    return (
      <div className="popup-page popup-dashboard">
        <DashboardPopup
          onAddPassword={handleAddPassword}
          onViewPassword={handleViewPassword}
          onSettings={handleSettings}
          onPasswordGenerator={handlePasswordGenerator}
        />
      </div>
    );
  }

  // Password Generator sayfasını render et (popup içinde)
  if (state.page === 'password-generator') {
    return (
      <PasswordGenerator
        onDashboard={handleBackToDashboard}
        onSettings={handleSettings}
        onBack={handleBackToDashboard}
      />
    );
  }

  // Settings sayfasını render et (popup içinde)
  if (state.page === 'settings') {
    return (
      <Settings
        onDashboard={handleBackToDashboard}
        onGenerator={handlePasswordGenerator}
        onBack={handleBackToDashboard}
        onLogout={handleLogout}
      />
    );
  }

  // Add Password sayfasını render et (popup içinde)
  if (state.page === 'add-password') {
    return (
      <div className="popup-page popup-form">
        <AddPasswordPopup
          onSuccess={handleAddPasswordSuccess}
          onCancel={handleBackToDashboard}
        />
      </div>
    );
  }

  // View Password sayfasını render et (popup içinde)
  if (state.page === 'view-password' && state.passwordId) {
    return (
      <div className="popup-page popup-detail">
        <ViewPasswordPopup
          id={state.passwordId}
          onBack={handleBackToDashboard}
          onEdit={handleEditPassword}
        />
      </div>
    );
  }

  // Edit Password sayfasını render et (popup içinde)
  if (state.page === 'edit-password' && state.passwordId) {
    return (
      <div className="popup-page popup-form">
        <EditPasswordPopup
          id={state.passwordId}
          onSuccess={handleBackToDashboard}
          onCancel={handleBackToDashboard}
        />
      </div>
    );
  }

  return (
    <div className="popup-page popup-notfound">
      <h2>Sayfa Bulunamadı</h2>
      <button onClick={handleBackToDashboard} className="btn btn-primary">
        Ana Sayfaya Dön
      </button>
    </div>
  );
};

export default Popup;

// Mount component when popup.tsx is used as entry point
if (document.getElementById('app')) {
  const root = ReactDOM.createRoot(document.getElementById('app')!);
  root.render(
    <BrowserRouter>
      <VaultLockProvider>
        <PasswordProvider>
          <Popup />
        </PasswordProvider>
      </VaultLockProvider>
    </BrowserRouter>
  );
}
