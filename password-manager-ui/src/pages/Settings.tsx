import { useState, useEffect, useRef } from 'react';
import { useVaultLock } from '../context/VaultLockContext';
import { useNavigate } from 'react-router-dom';
import { updateMasterPassword, getAllPasswords, logout } from '../helpers/api';
import { deriveMasterKeyWithKdf, deriveEncryptionKey } from '../helpers/encryption';
import { importPasswords, exportPasswords, downloadFile, type ExportFormat, type ImportResult } from '../helpers/importExport';
import { ApiError } from '../types';
import '../styles/auth.css';
import '../styles/popup.css';

interface SettingsProps {
  onBack?: () => void;
  onDashboard?: () => void;
  onGenerator?: () => void;
  onLogout?: () => void;
}


type TabType = 'general' | 'security' | 'import-export';

const Settings = ({ onBack, onDashboard, onGenerator, onLogout }: SettingsProps) => {
  const { lock } = useVaultLock();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('general');
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

  // Security Settings
  const [vaultTimeout, setVaultTimeout] = useState<number>(5); // Default 5 mins
  const [vaultAction, setVaultAction] = useState<'lock' | 'logout'>('lock');
  const [lockOnBrowserClose, setLockOnBrowserClose] = useState<boolean>(true);
  const [lockOnSystemLock, setLockOnSystemLock] = useState<boolean>(false);

  // Import/Export
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // localStorage'dan kullanıcı bilgilerini al
    const storedUserName = localStorage.getItem('userName');

    // sessionStorage'dan encryption key al
    const storedEncryptionKey = sessionStorage.getItem('encryptionKey');

    const storedKdfSalt = localStorage.getItem('kdfSalt');
    const storedKdfIterations = localStorage.getItem('kdfIterations');

    // Güvenlik ayarlarını oku
    const savedTimeout = localStorage.getItem('vaultTimeout');
    if (savedTimeout) setVaultTimeout(parseInt(savedTimeout, 10));

    const savedAction = localStorage.getItem('vaultAction');
    if (savedAction === 'lock' || savedAction === 'logout') setVaultAction(savedAction);

    const savedLockOnClose = localStorage.getItem('lockOnBrowserClose');
    if (savedLockOnClose !== null) setLockOnBrowserClose(savedLockOnClose === 'true');

    const savedLockOnSystem = localStorage.getItem('lockOnSystemLock');
    if (savedLockOnSystem !== null) setLockOnSystemLock(savedLockOnSystem === 'true');

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

  const saveSecuritySettings = () => {
    localStorage.setItem('vaultTimeout', vaultTimeout.toString());
    localStorage.setItem('vaultAction', vaultAction);
    localStorage.setItem('lockOnBrowserClose', String(lockOnBrowserClose));
    localStorage.setItem('lockOnSystemLock', String(lockOnSystemLock));

    // Extension için de sync et (chrome.storage)
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({
        vaultTimeout: vaultTimeout,
        vaultAction: vaultAction,
        lockOnBrowserClose: lockOnBrowserClose,
        lockOnSystemLock: lockOnSystemLock
      });
    }

    setSuccess('Güvenlik ayarları kaydedildi.');
    setTimeout(() => setSuccess(null), 3000);
  };

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
      const currentMasterKey = await deriveMasterKeyWithKdf(currentPassword, kdfSalt, kdfIterations);
      const currentDerivedEncryptionKey = await deriveEncryptionKey(currentMasterKey);

      // sessionStorage'daki encryption key ile karşılaştır
      if (currentDerivedEncryptionKey !== encryptionKey) {
        setError('Mevcut şifre yanlış');
        return false;
      }

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
      const isValid = await verifyCurrentPassword();
      if (!isValid) {
        setLoading(false);
        return;
      }

      // 2. Tüm parolaları al
      const passwords = await getAllPasswords();

      // 3. Master password güncelle (decrypt + re-encrypt + API)
      const result = await updateMasterPassword(
        currentPassword,
        newPassword,
        kdfSalt,
        kdfIterations,
        passwords,
        encryptionKey
      );

      if (result.success) {
        // 4. Yeni encryption key'i kaydet - sessionStorage'da!
        sessionStorage.setItem('encryptionKey', result.newEncryptionKey);

        // Chrome extension ortamında session storage'ı da güncelle
        if (typeof chrome !== 'undefined' && chrome.storage?.session) {
          await chrome.storage.session.set({ encryptionKey: result.newEncryptionKey });
        }

        setSuccess('Master Password başarıyla güncellendi!');

        // Formu temizle
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');

        // Yeni encryption key'i state'e set et
        setEncryptionKey(result.newEncryptionKey);
      }
    } catch (err: unknown) {
      console.error('❌ Master Password güncelleme hatası:', err);
      if (err instanceof ApiError) {
        setError(err.getUserMessage());
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Master Password güncellenirken bir hata oluştu');
      }
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

  const handleLogout = async () => {
    await logout();
    if (onLogout) {
      onLogout();
    } else {
      navigate('/login');
    }
  };

  // Import handler
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !encryptionKey) return;

    setImportLoading(true);
    setImportResult(null);
    setError(null);
    setSuccess(null);

    try {
      const content = await file.text();
      const result = await importPasswords(content, file.name, encryptionKey);

      setImportResult(result);

      if (result.success > 0) {
        setSuccess(`${result.success} parola başarıyla import edildi!`);
      }

      if (result.failed > 0) {
        setError(`${result.failed} parola import edilemedi.`);
      }
    } catch (err) {
      setError('Import hatası: ' + (err as Error).message);
    } finally {
      setImportLoading(false);
      // Input'u sıfırla
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Export handler
  const handleExport = async () => {
    if (!encryptionKey) {
      setError('Encryption key bulunamadı. Lütfen yeniden giriş yapın.');
      return;
    }

    setExportLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const passwords = await getAllPasswords();

      if (passwords.length === 0) {
        setError('Export edilecek parola bulunamadı.');
        setExportLoading(false);
        return;
      }

      const content = await exportPasswords(passwords, encryptionKey, exportFormat);

      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `passwords_export_${timestamp}.${exportFormat}`;
      const mimeType = exportFormat === 'json' ? 'application/json' : 'text/csv';

      downloadFile(content, fileName, mimeType);
      setSuccess(`${passwords.length} parola başarıyla export edildi!`);
    } catch (err) {
      setError('Export hatası: ' + (err as Error).message);
    } finally {
      setExportLoading(false);
    }
  };

  const isExtension = typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;

  return (
    <div className={isExtension ? 'popup-page popup-dashboard' : 'page-container'} style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: isExtension ? '600px' : 'auto', maxHeight: isExtension ? '600px' : '100%' }}>
      <header className="popup-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '4px 0' }}>
          <button onClick={handleBack} className="btn-ghost" style={{ fontSize: '12px', padding: '4px 8px' }}>
            ← Geri
          </button>
          <h1 style={{ margin: 0, fontSize: '18px', textAlign: 'center' }}>⚙️ Ayarlar</h1>
          <button onClick={handleLogout} className="btn-ghost" style={{ fontSize: '12px', padding: '4px 8px', color: 'var(--pm-danger)' }}>
            Çıkış Yap
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '4px', borderTop: '1px solid var(--border-color)', marginTop: '4px' }}>
          <span className="user-name" style={{ fontSize: '12px' }}>👤 {userName || 'Kullanıcı'}</span>
        </div>

        {/* TAB MENU */}
        <div className="settings-tabs" style={{
          display: 'flex',
          gap: '4px',
          background: 'var(--bg-input)',
          padding: '4px',
          borderRadius: '8px',
          marginTop: '4px',
          border: '1px solid var(--border-color)'
        }}>
          {(['general', 'security', 'import-export'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === tab ? 'var(--primary-color)' : 'transparent',
                color: activeTab === tab ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
            >
              {tab === 'import-export' ? 'Veri' : tab === 'general' ? 'Genel' : 'Güvenlik'}
            </button>
          ))}
        </div>
      </header>

      <main style={{ flex: 1, overflow: 'auto', padding: isExtension ? '0' : '16px' }}>
        <div className="form-container" style={{
          maxWidth: isExtension ? '100%' : '500px',
          margin: '0 auto',
          minHeight: '100%',
        }}>

          {/* COMMON ALERTS */}
          {error && <div className="alert alert-error" style={{ margin: '16px 16px 0 16px' }}>{error}</div>}
          {success && <div className="alert alert-success" style={{ margin: '16px 16px 0 16px' }}>✅ {success}</div>}

          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className={`tab-content ${!isExtension ? 'card' : ''}`} style={{
              padding: '24px',
              borderRadius: isExtension ? '0' : '12px',
              background: isExtension ? 'transparent' : 'var(--bg-card)'
            }}>
              <h2 style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                🔐 Master Password Değiştir
              </h2>
              <form onSubmit={handleSubmit}>
                {/* Mevcut Şifre */}
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label htmlFor="currentPassword">Mevcut Master Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="input"
                      placeholder="Mevcut şifrenizi girin"
                      disabled={loading}
                    />
                    <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="btn-icon-eye" style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {showCurrentPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {/* Yeni Şifre */}
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label htmlFor="newPassword">Yeni Master Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input"
                      placeholder="Yeni şifrenizi girin (en az 8 karakter)"
                      disabled={loading}
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="btn-icon-eye" style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {showNewPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {/* Yeni Şifre Tekrar */}
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label htmlFor="confirmNewPassword">Yeni Master Password (Tekrar)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="input"
                      placeholder="Yeni şifrenizi tekrar girin"
                      disabled={loading}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="btn-icon-eye" style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                  {loading ? 'Güncelleniyor...' : 'Master Password Güncelle'}
                </button>
              </form>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className={`tab-content ${!isExtension ? 'card' : ''}`} style={{
              padding: '24px',
              borderRadius: isExtension ? '0' : '12px',
              background: isExtension ? 'transparent' : 'var(--bg-card)'
            }}>
              <h2 style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                🛡️ Kasa Güvenlik Ayarları
              </h2>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px' }}>Kasa Zaman Aşımı (Kullanılmadığında)</label>
                <select
                  value={vaultTimeout}
                  onChange={(e) => setVaultTimeout(parseInt(e.target.value))}
                  className="input"
                  style={{ width: '100%', padding: '10px' }}
                >
                  <option value="-1">Asla (Önerilmez)</option>
                  <option value="1">1 Dakika</option>
                  <option value="5">5 Dakika (Varsayılan)</option>
                  <option value="15">15 Dakika</option>
                  <option value="30">30 Dakika</option>
                  <option value="60">1 Saat</option>
                </select>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Belirtilen süre boyunca işlem yapmazsanız kasa otomatik olarak kilitlenir.
                </p>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px' }}>Zaman Aşımı Eylemi</label>
                <select
                  value={vaultAction}
                  onChange={(e) => setVaultAction(e.target.value as 'lock' | 'logout')}
                  className="input"
                  style={{ width: '100%', padding: '10px' }}
                >
                  <option value="lock">Kasayı Kilitle (Master Parola Gerekir)</option>
                  <option value="logout">Oturumu Kapat (Tekrar Email ile Giriş Gerekir)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    checked={lockOnBrowserClose}
                    onChange={(e) => setLockOnBrowserClose(e.target.checked)}
                  />
                  Tarayıcı Kapandığında Kilitle (Önerilen)
                </label>
                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: 0.7 }}>
                  <input
                    type="checkbox"
                    checked={lockOnSystemLock}
                    onChange={(e) => setLockOnSystemLock(e.target.checked)}
                  />
                  Sistem Kilitlendiğinde Kilitle (Deneysel)
                </label>
              </div>

              <button
                onClick={saveSecuritySettings}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                Ayarları Kaydet
              </button>
            </div>
          )}

          {/* IMPORT/EXPORT TAB */}
          {activeTab === 'import-export' && (
            <div className={`tab-content ${!isExtension ? 'card' : ''}`} style={{
              padding: '24px',
              borderRadius: isExtension ? '0' : '12px',
              background: isExtension ? 'transparent' : 'var(--bg-card)' // height removed
            }}>
              <h2 style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                📦 Import / Export
              </h2>

              {/* Import Result Display - Same as before */}
              {importResult && (
                <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <p>✅ {importResult.success} Başarılı | ❌ {importResult.failed} Hatalı</p>
                </div>
              )}

              {/* Import */}
              <div style={{ marginBottom: '24px' }}>
                <h3>📥 Parola Import Et</h3>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  onChange={handleImport}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importLoading || !encryptionKey}
                  className="btn btn-secondary"
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  {importLoading ? 'Import ediliyor...' : '📂 Dosya Seç (CSV/JSON)'}
                </button>
              </div>

              {/* Export */}
              <div>
                <h3>📤 Parola Export Et</h3>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <label className={`radio-btn ${exportFormat === 'csv' ? 'active' : ''}`}>
                      <input type="radio" checked={exportFormat === 'csv'} onChange={() => setExportFormat('csv')} style={{ display: 'none' }} /> CSV
                    </label>
                    <label className={`radio-btn ${exportFormat === 'json' ? 'active' : ''}`}>
                      <input type="radio" checked={exportFormat === 'json'} onChange={() => setExportFormat('json')} style={{ display: 'none' }} /> JSON
                    </label>
                  </div>
                  <button
                    onClick={handleExport}
                    disabled={exportLoading || !encryptionKey}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    {exportLoading ? '...' : '💾 Export Et'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .tab-btn:hover {
            background: rgba(255,255,255,0.05) !important;
        }
        .radio-btn {
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            border: 1px solid var(--border-color);
            font-size: 13px;
        }
        .radio-btn.active {
            background: var(--primary-color);
            color: white;
            border-color: var(--primary-color);
        }
      `}</style>

      {/* Bottom Navigation */}
      <nav style={{
        background: 'var(--bg-sidebar)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '4px 0',
        flexShrink: 0
      }}>
        <button
          onClick={() => onDashboard ? onDashboard() : navigate('/dashboard')}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '6px 4px',
            fontSize: '10px'
          }}
        >
          <span style={{ fontSize: '20px' }}>🏠</span>
          <span>Kasa</span>
        </button>
        <button
          onClick={() => onGenerator ? onGenerator() : navigate('/generator')}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '6px 4px',
            fontSize: '10px'
          }}
        >
          <span style={{ fontSize: '20px' }}>🎲</span>
          <span>Üreteci</span>
        </button>
        <button
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            border: 'none',
            background: 'transparent',
            color: 'var(--primary-color)',
            cursor: 'pointer',
            padding: '6px 4px',
            fontSize: '10px'
          }}
        >
          <span style={{ fontSize: '20px' }}>⚙️</span>
          <span style={{ fontWeight: '600' }}>Ayarlar</span>
        </button>
        <button
          onClick={() => {
            lock();
            if (typeof chrome !== 'undefined' && chrome.runtime) {
              setTimeout(() => window.close(), 100);
            }
          }}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '6px 4px',
            fontSize: '10px'
          }}
        >
          <span style={{ fontSize: '20px' }}>🔒</span>
          <span>Kilitle</span>
        </button>
      </nav>
    </div>
  );
};

export default Settings;
