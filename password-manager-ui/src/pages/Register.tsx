import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../helpers/api';
import { generateSalt, deriveMasterKeyWithKdf, createAuthHash, deriveEncryptionKey, stringToBase64 } from '../helpers/encryption';
import type { UserForRegisterDto } from '../types';
import '../styles/auth.css';

interface RegisterProps {
  onRegisterSuccess?: () => void; // Extension popup için
  onBackToLogin?: () => void; // Extension popup için - login page'ine geri dön
}

const Register = ({ onRegisterSuccess, onBackToLogin }: RegisterProps) => {
  const navigate = useNavigate();
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

      // 1. Frontend'de rastgele salt üret (16 byte, CSPRNG)
      const kdfSalt = generateSalt(16);
      const kdfIterations = 600000;
      console.log('🔐 Register: KDF Salt üretildi:', kdfSalt.substring(0, 20) + '...');

      // 2. Salt ile MasterKey türet
      console.log('🔐 MasterKey türetiliyor...');
      const masterKey = await deriveMasterKeyWithKdf(
        formData.masterPassword, 
        kdfSalt, 
        kdfIterations
      );
      console.log('✅ MasterKey türetildi');

      // 3. MasterKey'den AuthHash oluştur (SHA512)
      const authHash = await createAuthHash(masterKey);
      console.log('✅ AuthHash oluşturuldu:', authHash.substring(0, 20) + '...');

      // 4. Backend'e gönder: AuthHash + KdfSalt + KdfIterations
      const registerData: UserForRegisterDto = {
        userName: formData.userName,
        email: formData.email,
        password: stringToBase64(authHash), // AuthHash - base64 encoded
        kdfSalt: kdfSalt, // Zaten base64 encoded (generateSalt'tan)
        kdfIterations: kdfIterations,
      };

      console.log('📤 Backend\'e kayıt isteği gönderiliyor...');
      const registerResponse = await register(registerData);
      console.log('✅ Kayıt başarılı');

      // 5. Encryption Key türet (aynı MasterKey'den)
      const encryptionKey = await deriveEncryptionKey(masterKey);
      console.log('✅ Encryption Key türetildi');

      // 6. Token ve bilgileri kaydet
      if (registerResponse.accessToken?.token) {
        localStorage.setItem('authToken', registerResponse.accessToken.token);
        localStorage.setItem('tokenExpiration', registerResponse.accessToken.expirationDate);
      }
      localStorage.setItem('encryptionKey', encryptionKey);
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
          console.log('✅ Chrome storage güncellendi');
        } catch (storageErr) {
          console.warn('Chrome storage hatası:', storageErr);
        }
      }

      // Extension popup'ta mı diye kontrol et
      if (onRegisterSuccess) {
        console.log('📱 Extension popup modunda - onRegisterSuccess callback çağrılıyor');
        onRegisterSuccess();
      } else {
        // Normal web app'ta - dashboard'a yönlendir (zaten giriş yapıldı)
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('❌ Register hatası:', err);
      console.error('Error type:', typeof err);
      console.error('Error message:', err?.message);
      console.error('Error response:', err?.response?.data);
      console.error('Error stack:', err?.stack);
      
      let errorMessage = 'Kayıt başarısız. Lütfen tekrar deneyiniz.';
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Kayıt Ol</h1>
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
            <small style={{ color: '#999', display: 'block', marginTop: '4px' }}>
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
            <small style={{ color: '#999', display: 'block', marginTop: '4px' }}>
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
            <Link to="/login">Giriş yap</Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
