import { useState, useEffect } from 'react';
import { getPasswordById, deletePassword } from '../helpers/api';
import { decryptDataFromAPI } from '../helpers/encryption';
import { formatLocalDateTime } from '../helpers/dateFormatter';
import type { Password } from '../types';
import { ApiError } from '../types';
import '../styles/popup.css';

interface ViewPasswordPopupProps {
  id: string;
  onBack: () => void;
  onEdit: (id: string) => void;
}

const ViewPasswordPopup = ({ id, onBack, onEdit }: ViewPasswordPopupProps) => {
  const [password, setPassword] = useState<Password | null>(null);
  const [decrypted, setDecrypted] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchPassword();
    }
  }, [id]);

  const fetchPassword = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try chrome.storage.session first (extension), then localStorage (web app)
      let encryptionKey: string | null = null;

      if (typeof chrome !== 'undefined' && chrome.storage?.session) {
        const result = await chrome.storage.session.get(['encryptionKey']) as { encryptionKey?: string };
        encryptionKey = result.encryptionKey || null;
      }

      if (!encryptionKey) {
        encryptionKey = sessionStorage.getItem('encryptionKey') || localStorage.getItem('encryptionKey');
      }

      if (!encryptionKey) {
        setError('Oturum süresi doldu. Lütfen yeniden giriş yapın.');
        setLoading(false);
        return;
      }

      const passwordData = await getPasswordById(id);
      setPassword(passwordData);

      if (!passwordData.iv) {
        setError('Bu parola eski format ile kaydedilmiş.');
        setLoading(false);
        return;
      }

      try {
        const decryptedData = await decryptDataFromAPI(
          {
            encryptedName: passwordData.encryptedName,
            encryptedUserName: passwordData.encryptedUserName,
            encryptedPassword: passwordData.encryptedPassword,
            encryptedDescription: passwordData.encryptedDescription,
            encryptedWebSiteUrl: passwordData.encryptedWebSiteUrl,
          },
          encryptionKey,
          passwordData.iv
        );
        setDecrypted(decryptedData);
      } catch (decryptError: unknown) {
        console.error('Decrypt hatası:', decryptError);
        setError('Şifre çözme başarısız');
        setLoading(false);
        return;
      }
    } catch (err: unknown) {
      console.error('Parola yükleme hatası:', err);
      if (err instanceof ApiError) {
        setError(err.getUserMessage());
      } else {
        setError('Parola yüklenemedi');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Kopyalama hatası:', err);
    }
  };

  const handleAutofill = () => {
    if (decrypted && typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'AUTOFILL_PASSWORD',
        username: decrypted.username,
        password: decrypted.password,
      });
      window.close();
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bu parolayı silmek istediğinize emin misiniz?')) return;

    try {
      setLoading(true);
      await deletePassword({ id });
      onBack(); // Go back after successful deletion
    } catch (err) {
      console.error('Delete error:', err);
      setError('Silme işlemi başarısız.');
      setLoading(false);
    }
  };

  const getFaviconUrl = (websiteUrl: string) => {
    try {
      const url = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
      return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="popup-page">
        <div className="popup-loading">
          <div className="popup-spinner"></div>
          <span>Yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (error || !password) {
    return (
      <div className="popup-page">
        <div className="popup-header">
          <button onClick={onBack} className="popup-back-btn">← Geri</button>
          <span className="popup-header-title">Hata</span>
          <div style={{ width: 32 }}></div>
        </div>
        <div className="popup-empty">
          <div className="popup-empty-icon">⚠️</div>
          <div className="popup-empty-title">Bir hata oluştu</div>
          <div className="popup-empty-text">{error || 'Parola bulunamadı'}</div>
          <button onClick={onBack} className="popup-btn popup-btn-primary">
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  const faviconUrl = decrypted?.websiteUrl ? getFaviconUrl(decrypted.websiteUrl) : null;

  return (
    <div className="popup-page popup-detail-container">
      {/* Header */}
      <header className="popup-header">
        <button onClick={onBack} className="popup-back-btn">← Geri</button>
        <span className="popup-header-title">{decrypted?.name || 'Parola'}</span>
        <button className="popup-header-btn" onClick={() => onEdit(id)} title="Düzenle">✏️</button>
      </header>

      {/* Content */}
      <div className="popup-detail-content popup-content">
        {/* Header Card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', padding: '12px', background: 'var(--pm-bg-tertiary)', borderRadius: '8px' }}>
          <div className="popup-password-favicon">
            {faviconUrl ? (
              <img src={faviconUrl} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <span className="popup-password-favicon-letter">{decrypted?.name?.charAt(0).toUpperCase() || 'P'}</span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>{decrypted?.name}</div>
            {decrypted?.websiteUrl && (
              <a href={decrypted.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--pm-primary)', textDecoration: 'none' }}>
                {decrypted.websiteUrl}
              </a>
            )}
          </div>
        </div>

        {/* Username */}
        <div className="popup-detail-section">
          <div className="popup-detail-label">Kullanıcı Adı</div>
          <div className="popup-detail-value">
            <span className="popup-detail-value-text">{decrypted?.username || '-'}</span>
            <button
              className={`popup-detail-action ${copied === 'username' ? 'copied' : ''}`}
              onClick={() => copyToClipboard(decrypted?.username || '', 'username')}
              title="Kopyala"
            >
              {copied === 'username' ? '✓' : '📋'}
            </button>
          </div>
        </div>

        {/* Password */}
        <div className="popup-detail-section">
          <div className="popup-detail-label">Parola</div>
          <div className="popup-detail-value mono">
            <span className="popup-detail-value-text">
              {showPassword ? decrypted?.password : '••••••••••••'}
            </span>
            <button
              className="popup-detail-action"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Gizle' : 'Göster'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
            <button
              className={`popup-detail-action ${copied === 'password' ? 'copied' : ''}`}
              onClick={() => copyToClipboard(decrypted?.password || '', 'password')}
              title="Kopyala"
            >
              {copied === 'password' ? '✓' : '📋'}
            </button>
          </div>
        </div>

        {/* Description */}
        {decrypted?.description && (
          <div className="popup-detail-section">
            <div className="popup-detail-label">Notlar</div>
            <div style={{
              whiteSpace: 'pre-wrap',
              padding: '10px 12px',
              background: 'var(--pm-bg-tertiary)',
              borderRadius: '6px',
              fontSize: '13px',
              color: 'var(--pm-text-secondary)',
              fontFamily: 'var(--pm-font-mono)',
              minHeight: '60px',
              border: '1px solid var(--pm-border)'
            }}>
              {decrypted.description}
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="popup-detail-section">
          <div className="popup-detail-label">Bilgiler</div>
          <div style={{ fontSize: '12px', color: 'var(--pm-text-secondary)' }}>
            <div style={{ marginBottom: '4px' }}>Oluşturulma: {formatLocalDateTime(password.createdDate)}</div>
            {password.updatedDate && (
              <div>Güncelleme: {formatLocalDateTime(password.updatedDate)}</div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="popup-footer">
        <button
          className="popup-btn"
          onClick={handleDelete}
          style={{ backgroundColor: '#ef4444', color: 'white', marginRight: 'auto' }}
        >
          🗑️ Sil
        </button>
        <button className="popup-btn popup-btn-success" onClick={handleAutofill}>
          ⚡ Otomatik Doldur
        </button>
        <button className="popup-btn popup-btn-secondary" onClick={() => onEdit(id)}>
          ✏️ Düzenle
        </button>
      </div>
    </div>
  );
};

export default ViewPasswordPopup;
