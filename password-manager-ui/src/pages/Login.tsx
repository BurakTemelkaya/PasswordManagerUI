import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { login } from '../helpers/api';
import { deriveMasterKey, createAuthHash, deriveEncryptionKey, deriveMasterKeySecure } from '../helpers/encryption';
import type { UserForLoginDto } from '../types';
import '../styles/auth.css';

interface LocationState {
  message?: string;
}

interface LoginProps {
  onLoginSuccess?: () => void; // Extension popup için
  onRegister?: () => void; // Extension popup için - register page'ine git
}

// JWT'yi decode et ve userId'yi al
const getUserIdFromToken = (token: string): string | null => {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    
    // .NET Asp.Net Identity claim key'i
    const userIdClaimKey = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
    const userId = decoded[userIdClaimKey];
    
    if (userId) {
      console.log('✅ userId JWT claim\'inden alındı:', userId);
      return userId;
    }
    
    // Fallback: diğer olası claim key'ler
    return decoded.sub || decoded.userId || decoded.nameid || null;
  } catch (error) {
    console.error('JWT decode hatası:', error);
    return null;
  }
};

const Login = ({ onLoginSuccess, onRegister }: LoginProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState) || {};

  const [formData, setFormData] = useState({
    userName: '',
    masterPassword: '',
    authenticatorCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(state.message || null);

  useEffect(() => {
    // Success mesajını 5 saniye sonra temizle
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Kaydedilmiş kullanıcı adını yükle
  useEffect(() => {
    const loadSavedUsername = async () => {
      // Önce localStorage'dan dene
      const savedUserName = localStorage.getItem('userName');
      if (savedUserName) {
        setFormData(prev => ({ ...prev, userName: savedUserName }));
      }
      
      // Chrome extension ise chrome.storage'dan da dene
      if (typeof chrome !== 'undefined' && chrome.storage) {
        try {
          const result = await chrome.storage.local.get(['userName']);
          if (result.userName && typeof result.userName === 'string') {
            setFormData(prev => ({ ...prev, userName: result.userName as string }));
          }
        } catch (err) {
          console.warn('Chrome storage okuma hatası:', err);
        }
      }
    };
    
    loadSavedUsername();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validasyon
    if (!formData.userName || !formData.masterPassword) {
      setError('Kullanıcı adı ve Master Parola gereklidir');
      return;
    }

    try {
      setLoading(true);

      // localStorage'ı temizle
      localStorage.clear();

      // 1. FRONTEND: Master Key'i türet (PBKDF2 - 200,000 iterasyon, hızlı)
      // Web Crypto API - çok hızlı ve donanım hızlandırmalı!
      // ⚠️ ÖNEMLI: userName yerine userId kullanacağız (sonradan gelecek)
      // Şimdilik userName ile başlat, sonra JWT'den userId al
      const masterKey = await deriveMasterKey(formData.masterPassword, formData.userName);

      // 2. FRONTEND: Auth Hash'i oluştur (sunucuya gönderilecek)
      const authHash = await createAuthHash(masterKey);

      // 3. API'ye gönder ve yanıt al
      const loginData: UserForLoginDto = {
        userName: formData.userName,
        password: authHash,
        authenticatorCode: formData.authenticatorCode || undefined,
      };

      await login(loginData);

      // 4. API başarılı oldu, Token localStorage'da kaydedilmiş (api.ts'de)
      const token = localStorage.getItem('authToken');
      console.log('🔑 localStorage token var mı?', !!token);
      console.log('📦 Token değeri:', token?.substring(0, 20) + '...');

      // JWT'den userId'yi al
      let userId = formData.userName; // fallback
      if (token) {
        const extractedUserId = getUserIdFromToken(token);
        if (extractedUserId) {
          userId = extractedUserId;
          console.log('✅ userId JWT\'den alındı:', userId);
        }
      }

      // Simdi userId ile Master Key'i yeniden türet
      const masterKeyWithUserId = await deriveMasterKey(formData.masterPassword, userId);

      // Encryption Key'i türet ve kaydet
      const encryptionKey = await deriveEncryptionKey(masterKeyWithUserId);
      localStorage.setItem('encryptionKey', encryptionKey);
      localStorage.setItem('userName', formData.userName);
      localStorage.setItem('userId', userId);

      // Chrome extension storage'a kaydet
      if (typeof chrome !== 'undefined' && chrome.storage) {
        try {
          // Session storage: Tarayıcı kapanınca silinir (güvenlik için)
          // authToken ve encryptionKey burada - her oturumda yeniden giriş gerekir
          await chrome.storage.session.set({
            authToken: token,
            encryptionKey: encryptionKey,
          });
          
          // Local storage: Kalıcı veriler - kullanıcı adı hatırlansın
          await chrome.storage.local.set({
            userName: formData.userName,
            userId: userId,
            apiUrl: 'https://localhost:7051/api'
          });
          
          console.log('✅ Chrome storage kaydedildi (session + local)');
        } catch (err) {
          console.warn('Chrome storage kayıt hatası:', err);
        }
      }

      console.log('✅ Tüm storage bilgileri kaydedildi');
      console.log('📍 localStorage keys:', Object.keys(localStorage));

      // 5. ARKA PLANDA: Daha güçlü Master Key'i türet (600,000 iterasyon)
      // Web Crypto API + Web Worker = UI donmuyor, donanım hızlandırmalı
      deriveMasterKeySecure(formData.masterPassword, userId)
        .then(async (secureKey) => {
          const secureEncryptionKey = await deriveEncryptionKey(secureKey);
          localStorage.setItem('encryptionKey', secureEncryptionKey);
          console.log('🔐 Güvenli Master Key türetme tamamlandı (600K iterasyon)');
        })
        .catch((err) => {
          console.error('❌ Güvenli Master Key türetme hatası:', err);
        });

      console.log('🚀 Navigate çalışıyor...');
      
      // Extension popup'ta mı diye kontrol et
      if (onLoginSuccess) {
        console.log('📱 Extension popup modunda - onLoginSuccess callback çağrılıyor');
        onLoginSuccess();
      } else {
        // Normal web app'ta - router'a yönlendir
        navigate('/');
      }
    } catch (err: any) {
      localStorage.clear();
      console.error('❌ Login error:', err);
      console.error('📋 Error response:', err.response?.data);
      console.error('💬 Error message:', err.message);
      const errorMessage = err.response?.data?.message || 'Giriş başarısız. Kullanıcı adı ve Master Parolayı kontrol edin.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Giriş Yap</h1>
        {successMessage && <div className="alert alert-success">{successMessage}</div>}
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="userName">Kullanıcı Adı</label>
            <input
              id="userName"
              type="text"
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              placeholder="Kullanıcı adınızı girin"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="masterPassword">Master Parola</label>
            <input
              id="masterPassword"
              type="password"
              name="masterPassword"
              value={formData.masterPassword}
              onChange={handleChange}
              placeholder="Master parolayı girin"
              required
            />
            <small style={{ color: '#999', display: 'block', marginTop: '4px' }}>
              Master Parola asla sunucuya gönderilmez. Verilerin şifresini çözmek için kullanılır.
            </small>
          </div>
          <div className="form-group">
            <label htmlFor="authenticatorCode">2FA Kodu (İsteğe bağlı)</label>
            <input
              id="authenticatorCode"
              type="text"
              name="authenticatorCode"
              value={formData.authenticatorCode || ''}
              onChange={handleChange}
              placeholder="6 haneli kodu girin"
              maxLength={6}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
        <div className="auth-footer">
          Hesabınız yok mu?{' '}
          {onRegister ? (
            <button onClick={onRegister} className="btn-link">
              Kayıt ol
            </button>
          ) : (
            <Link to="/register">Kayıt ol</Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
