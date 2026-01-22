import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import './styles/auth.css';
import './styles/popup.css';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardPopup from './pages/DashboardPopup';
import AddPassword from './pages/AddPassword';
import ViewPasswordPopup from './pages/ViewPasswordPopup';
import EditPasswordPopup from './pages/EditPasswordPopup';

type PopupPage = 'login' | 'register' | 'dashboard' | 'add-password' | 'view-password' | 'edit-password' | 'notfound';

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
      
      // Chrome extension ise SADECE session storage'dan kontrol et
      if (typeof chrome !== 'undefined' && chrome.storage?.session) {
        try {
          const result = await chrome.storage.session.get(['authToken', 'encryptionKey']);
          
          if (result.authToken && typeof result.authToken === 'string') {
            token = result.authToken;
            // localStorage'a da kaydet (popup içinde API çağrıları için)
            localStorage.setItem('authToken', result.authToken);
          } else {
            // Session storage'da token yok - localStorage'ı da temizle
            localStorage.removeItem('authToken');
          }
          
          if (result.encryptionKey && typeof result.encryptionKey === 'string') {
            localStorage.setItem('encryptionKey', result.encryptionKey);
          } else {
            localStorage.removeItem('encryptionKey');
          }
        } catch (err) {
          console.warn('Chrome storage okuma hatası:', err);
          // Hata durumunda localStorage'ı temizle
          localStorage.removeItem('authToken');
          localStorage.removeItem('encryptionKey');
        }
      } else {
        // Extension değilse localStorage kullan (geliştirme için)
        token = localStorage.getItem('authToken');
      }
      
      // Giriş yapılmamışsa login sayfasına yönlendir
      if (!token) {
        setState({ page: 'login' });
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

  const handleLogout = () => {
    localStorage.clear();
    setState({ page: 'login' });
  };

  if (loading) {
    return (
      <div className="popup-loading">
        <div className="popup-spinner"></div>
        <span>Yükleniyor...</span>
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
          onLogout={handleLogout}
          onAddPassword={handleAddPassword}
          onViewPassword={handleViewPassword}
        />
      </div>
    );
  }

  // Add Password sayfasını render et (popup içinde)
  if (state.page === 'add-password') {
    return (
      <div className="popup-page popup-form">
        <AddPassword 
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
      <Popup />
    </BrowserRouter>
  );

  // Debug
  console.log('✅ Popup loaded successfully');
}
