import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { login, getUserKdfParams } from '../helpers/api';
import { deriveMasterKeyWithKdf, createAuthHash, deriveEncryptionKey, stringToBase64 } from '../helpers/encryption';
import { config } from '../helpers/config';
import type { UserForLoginDto } from '../types';
import { ApiError } from '../types';
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

      // 1. Backend'den KDF parametrelerini al
      const kdfParams = await getUserKdfParams(formData.userName);

      // 2. KDF ile MasterKey türet
      const masterKey = await deriveMasterKeyWithKdf(
        formData.masterPassword,
        kdfParams.kdfSalt,
        kdfParams.kdfIterations
      );

      // 3. MasterKey'den AuthHash oluştur (SHA512)
      const authHash = await createAuthHash(masterKey);

      // 4. API'ye AuthHash gönder
      const loginData: UserForLoginDto = {
        userName: formData.userName,
        password: stringToBase64(authHash), // AuthHash - base64 encoded
        authenticatorCode: formData.authenticatorCode || undefined,
      };

      await login(loginData);

      // 5. Token'ı al
      const token = localStorage.getItem('authToken');

      // JWT'den userId'yi al
      let userId = formData.userName; // fallback
      if (token) {
        const extractedUserId = getUserIdFromToken(token);
        if (extractedUserId) {
          userId = extractedUserId;
        }
      }

      // 6. Encryption Key türet (aynı MasterKey'den)
      const encryptionKey = await deriveEncryptionKey(masterKey);

      // GÜVENLİK: Encryption Key'i ASLA localStorage'a yazma! 
      // Sadece sessionStorage (tab kapanınca silinir) içinde tut.
      sessionStorage.setItem('encryptionKey', encryptionKey);


      // Encryption Key doğrulama için hash sakla (Bu hash ile şifre çözülemez, sadece doğrulama yapılır)
      const encryptionKeyCheck = await import('../helpers/encryption').then(m => m.hashSHA256(encryptionKey));
      localStorage.setItem('encryptionKeyCheck', encryptionKeyCheck);

      localStorage.setItem('userName', formData.userName);
      localStorage.setItem('userId', userId);
      // KDF parametrelerini kaydet (password update için lazım)
      localStorage.setItem('kdfSalt', kdfParams.kdfSalt);
      localStorage.setItem('kdfIterations', kdfParams.kdfIterations.toString());

      // Chrome extension storage'a kaydet
      if (typeof chrome !== 'undefined' && chrome.storage) {
        try {
          // Session storage: Tarayıcı kapanınca silinir (güvenlik için)
          // authToken ve encryptionKey burada - her oturumda yeniden giriş gerekir
          await chrome.storage.session.set({
            authToken: token,
            encryptionKey: encryptionKey,
            kdfSalt: kdfParams.kdfSalt,
            kdfIterations: kdfParams.kdfIterations,
          });

          // Local storage: Kalıcı veriler - kullanıcı adı ve token hatırlansın
          await chrome.storage.local.set({
            authToken: token, // KALI CI LIK
            userName: formData.userName,
            userId: userId,
            encryptionKeyCheck: encryptionKeyCheck, // Extension için de sakla
            kdfSalt: kdfParams.kdfSalt, // Vault unlock için gerekli
            kdfIterations: kdfParams.kdfIterations, // Vault unlock için gerekli
            apiUrl: config.api.baseURL
          });
        } catch (err) {
          console.warn('Chrome storage kayıt hatası:', err);
        }
      }

      // Extension popup'ta mı diye kontrol et
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        // Normal web app'ta - router'a yönlendir
        navigate('/');
      }
    } catch (err: unknown) {
      localStorage.clear();
      console.error('❌ Login error:', err);

      // ApiError ise kullanıcı dostu mesajı göster
      if (err instanceof ApiError) {
        setError(err.getUserMessage());
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Giriş başarısız. Kullanıcı adı ve Master Parolayı kontrol edin.');
      }
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

        {/* Extension Download Link - sadece web'de göster */}
        {!onLoginSuccess && (
          <div className="auth-footer" style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <span style={{ marginRight: '8px' }}>🔐</span>
            <Link to="/download" style={{ color: '#60a5fa' }}>
              Tarayıcı eklentisini indir
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
