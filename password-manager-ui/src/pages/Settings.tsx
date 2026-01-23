import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateMasterPassword, getAllPasswords, logout } from '../helpers/api';
import { deriveMasterKeyWithKdf, deriveEncryptionKey } from '../helpers/encryption';
import '../styles/auth.css';

interface SettingsProps {
  onBack?: () => void; // Extension popup için geri dönüş
  onLogout?: () => void; // Extension popup için çıkış
}

const Settings = ({ onBack, onLogout }: SettingsProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form alanları
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  // Şifre göster/gizle
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Kullanıcı bilgileri
  const [userName, setUserName] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [kdfSalt, setKdfSalt] = useState<string | null>(null);
  const [kdfIterations, setKdfIterations] = useState<number>(600000);

  useEffect(() => {
    // localStorage'dan kullanıcı bilgilerini al
    const storedUserName = localStorage.getItem('userName');
    const storedEncryptionKey = localStorage.getItem('encryptionKey');
    const storedKdfSalt = localStorage.getItem('kdfSalt');
    const storedKdfIterations = localStorage.getItem('kdfIterations');

    setUserName(storedUserName);
    setEncryptionKey(storedEncryptionKey);
    setKdfSalt(storedKdfSalt);
    if (storedKdfIterations) {
      setKdfIterations(parseInt(storedKdfIterations, 10));
    }

    if (!storedEncryptionKey || !storedKdfSalt) {
      setError('Oturum bilgileri bulunamadı. Lütfen yeniden giriş yapın.');
    }
  }, []);

  const validateForm = (): boolean => {
    setError(null);

    if (!currentPassword) {
      setError('Mevcut şifrenizi girin');
      return false;
    }

    if (!newPassword) {
      setError('Yeni şifrenizi girin');
      return false;
    }

    if (newPassword.length < 8) {
      setError('Yeni şifre en az 8 karakter olmalıdır');
      return false;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Yeni şifreler eşleşmiyor');
      return false;
    }

    if (currentPassword === newPassword) {
      setError('Yeni şifre mevcut şifreden farklı olmalıdır');
      return false;
    }

    return true;
  };

  const verifyCurrentPassword = async (): Promise<boolean> => {
    try {
      if (!kdfSalt) {
        setError('KDF bilgileri bulunamadı');
        return false;
      }

      // KDF ile şifre doğrulama (kdfSalt = kdfSalt)
      console.log('🔐 Mevcut şifre doğrulanıyor (KDF salt ile)...');
      const currentMasterKey = await deriveMasterKeyWithKdf(currentPassword, kdfSalt, kdfIterations);
      const currentDerivedEncryptionKey = await deriveEncryptionKey(currentMasterKey);

      // localStorage'daki encryption key ile karşılaştır
      if (currentDerivedEncryptionKey !== encryptionKey) {
        console.log('❌ Encryption key eşleşmedi');
        console.log('Beklenen:', encryptionKey?.substring(0, 20) + '...');
        console.log('Hesaplanan:', currentDerivedEncryptionKey.substring(0, 20) + '...');
        setError('Mevcut şifre yanlış');
        return false;
      }

      console.log('✅ Encryption key eşleşti');
      return true;
    } catch (err) {
      console.error('Şifre doğrulama hatası:', err);
      setError('Şifre doğrulama sırasında bir hata oluştu');
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!kdfSalt || !encryptionKey) {
      setError('Oturum bilgileri eksik. Lütfen yeniden giriş yapın.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Mevcut şifreyi doğrula
      console.log('🔐 Mevcut şifre doğrulanıyor...');
      const isValid = await verifyCurrentPassword();
      if (!isValid) {
        setLoading(false);
        return;
      }
      console.log('✅ Mevcut şifre doğru');

      // 2. Tüm parolaları al
      console.log('📥 Parolalar yükleniyor...');
      const passwords = await getAllPasswords();
      console.log(`✅ ${passwords.length} parola yüklendi`);

      // 3. Master password güncelle (decrypt + re-encrypt + API)
      console.log('🔄 Master Password güncelleniyor...');
      
      const result = await updateMasterPassword(
        currentPassword,
        newPassword,
        kdfSalt,
        kdfIterations,
        passwords,
        encryptionKey
      );

      if (result.success) {
        // 4. Yeni encryption key'i kaydet
        localStorage.setItem('encryptionKey', result.newEncryptionKey);
        
        // Chrome extension ortamında session storage'ı da güncelle
        if (typeof chrome !== 'undefined' && chrome.storage?.session) {
          await chrome.storage.session.set({ encryptionKey: result.newEncryptionKey });
          console.log('✅ Chrome session storage güncellendi');
        }

        console.log('✅ Master Password başarıyla güncellendi');
        setSuccess('Master Password başarıyla güncellendi!');
        
        // Formu temizle
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        
        // Yeni encryption key'i state'e set et
        setEncryptionKey(result.newEncryptionKey);
      }
    } catch (err: any) {
      console.error('❌ Master Password güncelleme hatası:', err);
      setError(err.message || 'Master Password güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/dashboard');
    }
  };

  const handleLogout = () => {
    logout();
    if (onLogout) {
      onLogout();
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>⚙️ Ayarlar</h1>
        <div className="header-actions">
          <span className="user-name">👤 {userName || 'Kullanıcı'}</span>
          <button onClick={handleLogout} className="btn btn-logout">
            Çıkış Yap
          </button>
        </div>
      </header>

      <main className="main">
        <div className="form-container" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ marginBottom: '24px' }}>
            <button onClick={handleBack} className="btn btn-secondary">
              ← Geri
            </button>
          </div>

          <div className="card" style={{ padding: '24px', borderRadius: '12px', background: 'var(--bg-card)' }}>
            <h2 style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              🔐 Master Password Değiştir
            </h2>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success" style={{ 
                marginBottom: '16px', 
                background: '#10b981', 
                color: 'white', 
                padding: '12px 16px', 
                borderRadius: '8px' 
              }}>
                ✅ {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Mevcut Şifre */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label htmlFor="currentPassword" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  Mevcut Master Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input"
                    placeholder="Mevcut şifrenizi girin"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '12px 40px 12px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    {showCurrentPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Yeni Şifre */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label htmlFor="newPassword" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  Yeni Master Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input"
                    placeholder="Yeni şifrenizi girin (en az 8 karakter)"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '12px 40px 12px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    {showNewPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Yeni Şifre Tekrar */}
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label htmlFor="confirmNewPassword" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  Yeni Master Password (Tekrar)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmNewPassword"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="input"
                    placeholder="Yeni şifrenizi tekrar girin"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '12px 40px 12px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Uyarı Notu */}
              <div style={{ 
                marginBottom: '20px', 
                padding: '12px 16px', 
                background: 'rgba(245, 158, 11, 0.1)', 
                borderRadius: '8px',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                  ⚠️ <strong>Önemli:</strong> Master Password değiştirildiğinde tüm parolalarınız yeni şifre ile yeniden şifrelenecektir. 
                  Bu işlem geri alınamaz. Şifrenizi unutmayın!
                </p>
              </div>

              {/* Şifre Güncelle Butonu */}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '16px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner" style={{
                      width: '18px',
                      height: '18px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Güncelleniyor...
                  </>
                ) : (
                  '🔒 Master Password Güncelle'
                )}
              </button>
            </form>
          </div>

          {/* Diğer Ayarlar Bölümü (Gelecek için placeholder) */}
          <div className="card" style={{ 
            marginTop: '24px', 
            padding: '24px', 
            borderRadius: '12px', 
            background: 'var(--bg-card)',
            opacity: 0.7 
          }}>
            <h2 style={{ marginBottom: '12px' }}>📋 Diğer Ayarlar</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Yakında eklenecek...
            </p>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Settings;
