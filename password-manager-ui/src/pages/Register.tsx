import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../helpers/api';
import { deriveMasterKey, createAuthHash, deriveMasterKeySecure } from '../helpers/encryption';
import type { UserForRegisterDto } from '../types';
import '../styles/pages.css';

const Register = () => {
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

      // 1. FRONTEND: Master Key'i türet (PBKDF2)
      const masterKey = deriveMasterKey(formData.masterPassword, formData.userName);

      // 2. FRONTEND: Auth Hash'i oluştur (backend'e bu hash'in hash'i kaydedilecek)
      const authHash = createAuthHash(masterKey);

      // 3. API'ye kayıt bilgilerini gönder
      const registerData: UserForRegisterDto = {
        userName: formData.userName,
        email: formData.email,
        password: authHash, // Backend bu hash'i bcrypt/argon2 ile hashleyip kaydedecek
      };

      await register(registerData);

      // 201 Created döndü = başarılı kayıt
      // Backend response format'ı ne olursa olsun, try bloğu başarılı = kayıt başarılı
      // ARKA PLANDA: Daha güçlü Master Key'i türet (600,000 iterasyon)
      deriveMasterKeySecure(formData.masterPassword, formData.userName)
        .then(() => {
          console.log('Güvenli Master Key türetme tamamlandı');
        })
        .catch((err) => {
          console.error('Güvenli Master Key türetme hatası:', err);
        });

      navigate('/login', { state: { message: 'Kayıt başarılı. Lütfen Master Parolası ile giriş yapın.' } });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Kayıt başarısız. Lütfen tekrar deneyiniz.';
      setError(errorMessage);
      console.error(err);
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
        <p className="auth-link">
          Zaten hesabınız var mı? <Link to="/login">Giriş yap</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
