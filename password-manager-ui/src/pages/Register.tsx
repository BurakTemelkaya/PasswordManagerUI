import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../helpers/api';
import { generateSalt, deriveMasterKeyWithKdf, createAuthHash, deriveEncryptionKey, stringToBase64 } from '../helpers/encryption';
import type { UserForRegisterDto } from '../types';
import { ApiError } from '../types';
import '../styles/auth.css';
import { useVaultLock } from '../context/VaultLockContext';

interface RegisterProps {
  onRegisterSuccess?: () => void; // Extension popup için
  onBackToLogin?: () => void; // Extension popup için - login page'ine geri dön
}

const Register = ({ onRegisterSuccess, onBackToLogin }: RegisterProps) => {
  const navigate = useNavigate();
  const { checkLockStatus } = useVaultLock();
  const [formData, setFormData] = useState({
    email: '',
    masterPassword: '',
    confirmMasterPassword: '',
    userName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!formData.email || !formData.masterPassword || !formData.userName) {
      setError('Tüm alanlar gereklidir');
      return;
    }

    if (formData.masterPassword !== formData.confirmMasterPassword) {
      setError('Master Parolalar eşleşmiyor');
      return;
    }

    if (formData.masterPassword.length < 12) {
      setError('Master Parola en az 12 karakter olmalıdır (güvenlik için)');
      return;
    }

    try {
      setLoading(true);

      // Önceki kullanıcının verilerini tamamen temizle (Cache zehirlenmesini önle)
      localStorage.clear();
      sessionStorage.clear();
      if (typeof chrome !== 'undefined' && chrome.storage) {
        try {
          chrome.storage.local.remove([
            'encryptedPasswords',
            'cachedPasswords',
            'authToken',
            'refreshToken',
            'userName',
            'userId',
            'encryptionKeyCheck',
            'kdfSalt',
            'kdfIterations',
            'apiUrl',
            'lastActivity'
          ]);
          chrome.storage.session?.clear();
        } catch (storageErr) {
          console.warn('Chrome storage temizleme hatası:', storageErr);
        }
      }

      // 1. Frontend'de rastgele salt üret (16 byte, CSPRNG)
      const kdfSalt = generateSalt(16);
      const kdfIterations = 600000;

      // 2. Salt ile MasterKey türet
      const masterKey = await deriveMasterKeyWithKdf(
        formData.masterPassword,
        kdfSalt,
        kdfIterations
      );

      // 3. MasterKey'den AuthHash oluştur (SHA512)
      const authHash = await createAuthHash(masterKey);

      // 4. Backend'e gönder: AuthHash + KdfSalt + KdfIterations
      const registerData: UserForRegisterDto = {
        userName: formData.userName,
        email: formData.email,
        password: stringToBase64(authHash), // AuthHash - base64 encoded
        kdfSalt: kdfSalt, // Zaten base64 encoded (generateSalt'tan)
        kdfIterations: kdfIterations,
      };

      const registerResponse = await register(registerData);

      // 5. Encryption Key türet (aynı MasterKey'den)
      const encryptionKey = await deriveEncryptionKey(masterKey);

      // 6. Token ve bilgileri kaydet
      if (registerResponse.accessToken?.token) {
        localStorage.setItem('authToken', registerResponse.accessToken.token);
        localStorage.setItem('tokenExpiration', registerResponse.accessToken.expirationDate);
      }

      // GÜVENLİK: Encryption Key'i ASLA localStorage'a yazma!
      // Sadece sessionStorage (tab kapanınca silinir) içinde tut.
      sessionStorage.setItem('encryptionKey', encryptionKey);

      // Encryption Key doğrulama için hash sakla
      const encryptionKeyCheck = await import('../helpers/encryption').then(m => m.hashSHA256(encryptionKey));
      localStorage.setItem('encryptionKeyCheck', encryptionKeyCheck);

      localStorage.setItem('userName', formData.userName);
      localStorage.setItem('kdfSalt', kdfSalt);
      localStorage.setItem('kdfIterations', kdfIterations.toString());

      // Chrome extension storage'a kaydet
      if (typeof chrome !== 'undefined' && chrome.storage) {
        try {
          await chrome.storage.session.set({
            authToken: registerResponse.accessToken?.token,
            encryptionKey: encryptionKey,
            kdfSalt: kdfSalt,
            kdfIterations: kdfIterations,
          });
          await chrome.storage.local.set({
            userName: formData.userName,
          });
        } catch (storageErr) {
          console.warn('Chrome storage hatası:', storageErr);
        }
      }

      // Vault lock state'ini güncelle
      checkLockStatus();

      // Extension popup'ta mı diye kontrol et
      if (onRegisterSuccess) {
        onRegisterSuccess();
      } else {
        navigate('/');
      }
    } catch (err: unknown) {
      console.error('❌ Register hatası:', err);

      // ApiError ise kullanıcı dostu mesajı göster
      if (err instanceof ApiError) {
        setError(err.getUserMessage());
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Kayıt başarısız. Lütfen tekrar deneyiniz.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isExtension = typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id && window.location.protocol === 'chrome-extension:';

  return (

    <div className={`auth-container ${!isExtension ? 'web-mode' : ''}`}>

      {/* Wrapper for split layout */}
      <div className="auth-content-wrapper">

        {/* External Header (Web Mode) */}
        {!isExtension && (
          <div className="auth-header-external">
            <div className="auth-header-logo">
              📝
            </div>
            <h1 className="auth-header-title">Hesap Oluştur</h1>
            <div className="auth-header-subtitle">
              Güvenli şifre yöneticisine hemen katılın
            </div>
          </div>
        )}

        {/* The Card */}
        <div className="auth-box">

          {/* Extension Mode Header */}
          {isExtension && (
            <h1 style={{ marginBottom: '24px' }}>Kayıt Ol</h1>
          )}

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
                placeholder="Kullanıcı adını girin"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
                required
              />
              <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                Email, hesap kurtarma ve iki faktörlü kimlik doğrulama için kullanılır
              </small>
            </div>
            <div className="form-group">
              <label htmlFor="masterPassword">Master Parola</label>
              <input
                id="masterPassword"
                type="password"
                name="masterPassword"
                value={formData.masterPassword}
                onChange={handleChange}
                placeholder="Master parolayı girin (min 12 karakter)"
                required
              />
              <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                Bunu saklamalısınız! Verilerin şifresini çözmek için kullanılır. Sunucuya asla gönderilmez.
              </small>
            </div>
            <div className="form-group">
              <label htmlFor="confirmMasterPassword">Master Parolayı Onayla</label>
              <input
                id="confirmMasterPassword"
                type="password"
                name="confirmMasterPassword"
                value={formData.confirmMasterPassword}
                onChange={handleChange}
                placeholder="Master parolayı tekrar girin"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
            </button>
          </form>
          <div className="auth-footer">
            Zaten hesabınız var mı?{' '}
            {onBackToLogin ? (
              <button onClick={onBackToLogin} className="btn-link">
                Giriş yap
              </button>
            ) : (
              <Link to="/login" className="btn-link">Giriş yap</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );

};

export default Register;
