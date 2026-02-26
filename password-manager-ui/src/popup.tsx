import React, { useState, useEffect } from 'react';
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
import { VaultLockProvider } from './context/VaultLockContext';
import { PasswordProvider } from './context/PasswordContext';

type PopupPage = 'login' | 'register' | 'dashboard' | 'add-password' | 'view-password' | 'edit-password' | 'settings' | 'password-generator' | 'notfound' | 'unlock-vault';

interface PopupState {
  page: PopupPage;
  passwordId?: string;
}

const Popup: React.FC = () => {
  const [state, setState] = useState<PopupState>({ page: 'dashboard' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      let token: string | null = null;
      let hasEncryptionKey = false;

      // Chrome extension kontrolü
      if (typeof chrome !== 'undefined' && chrome.storage) {
        try {
          // 1. Session storage (Master Key - Tarayıcı kapanınca silinir)
          let sessionEncKey: string | undefined;
          if (chrome.storage.session) {
            const sessionResult = await chrome.storage.session.get(['encryptionKey']);
            sessionEncKey = sessionResult.encryptionKey as string | undefined;
          }

          // 2. Encryption Key'i React session storage'ına sync et (UI oradan okuyor)
          if (sessionEncKey) {
            sessionStorage.setItem('encryptionKey', sessionEncKey);
            hasEncryptionKey = true;
          } else {
            sessionStorage.removeItem('encryptionKey');
            hasEncryptionKey = false;
          }

          // 3. Token kontrolü - (Kalıcı storage'dan da bakabiliriz çünkü "Refresh Token Kalsın" dendi)
          // Ancak auth token access token'dır. Refresh token varsa auto-login denemeli miyiz?
          // Evet, eğer access token yoksa ama refresh token varsa arka planda refresh yapılmalı.
          // Basitlik için: authToken'ı storage.local'e de yedekleyelim Login'de.

          // Önce session'a bak (Login sonrası hemen buradadır)
          let sessionAuthToken: string | undefined;
          if (chrome.storage.session) {
            const sResult = await chrome.storage.session.get(['authToken']);
            sessionAuthToken = sResult.authToken as string | undefined;
          }

          // Sonra local'e bak (Tarayıcı kapandı açıldı)
          const localResult = await chrome.storage.local.get(['authToken', 'refreshToken']);

          token = sessionAuthToken || (localResult.authToken as string) || null;

          // Eğer token varsa session/local storage sync yap (React app için)
          if (token) {
            localStorage.setItem('authToken', token);
          } else {
            localStorage.removeItem('authToken');
          }

        } catch (err) {
          console.warn('Chrome storage okuma hatası:', err);
        }
      } else {
        // Dev modu
        token = localStorage.getItem('authToken');
        hasEncryptionKey = !!sessionStorage.getItem('encryptionKey');
      }

      // State Kararı
      if (!token) {
        setState({ page: 'login' });
      } else if (!hasEncryptionKey) {
        // Token var ama Key yok -> KİLİTLİ
        setState({ page: 'unlock-vault' });
      } else {
        setState({ page: 'dashboard' });
      }

      setLoading(false);
    };

    checkAuth();
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

  const handleLogout = () => {
    // Tüm local verileri temizle
    localStorage.clear();
    sessionStorage.clear();

    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.session?.remove(['authToken', 'encryptionKey']);
      chrome.storage.local?.remove(['authToken', 'encryptionKeyCheck', 'refreshToken', 'passwords']);
    }

    setState({ page: 'login' });
  };

  const handlePasswordGenerator = () => {
    setState({ page: 'password-generator' });
  };

  const handleUnlock = () => {
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
        <Login onLoginSuccess={handleLoginSuccess} onRegister={handleRegister} />
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
