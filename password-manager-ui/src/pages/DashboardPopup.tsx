import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPasswords, deletePassword } from '../helpers/api';
import type { Password } from '../types';
import { ApiError } from '../types';
import { decryptDataFromAPI } from '../helpers/encryption';
import { useVaultLock } from '../context/VaultLockContext';
import '../styles/popup.css';

interface DecryptedPassword {
  name: string;
  websiteUrl: string;
  username: string;
  password: string;
}

interface DashboardProps {
  onAddPassword?: () => void;
  onViewPassword?: (id: string) => void;
  onEditPassword?: (id: string) => void;
  onSettings?: () => void;
  onPasswordGenerator?: () => void;
  currentUrl?: string;
}

const Dashboard = ({ onAddPassword, onViewPassword, onSettings, onPasswordGenerator, currentUrl }: DashboardProps) => {
  const navigate = useNavigate();
  const { lock } = useVaultLock();
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'matching'>('all');
  const [decryptedPasswords, setDecryptedPasswords] = useState<Map<string, DecryptedPassword>>(new Map());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentSite, setCurrentSite] = useState<string>('');

  // Get current tab URL
  useEffect(() => {
    if (currentUrl) {
      setCurrentSite(currentUrl);
    } else if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) {
          try {
            const url = new URL(tabs[0].url);
            setCurrentSite(url.hostname);
          } catch {
            setCurrentSite('');
          }
        }
      });
    }
  }, [currentUrl]);

  useEffect(() => {
    fetchPasswords();
  }, []);

  const fetchPasswords = async () => {
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

      const passwordList = await getAllPasswords();
      setPasswords(passwordList);

      // Decrypt all passwords
      const decrypted = new Map<string, DecryptedPassword>();
      await Promise.all(
        passwordList.map(async (pwd) => {
          try {
            const decryptedData = await decryptDataFromAPI(
              {
                encryptedName: pwd.encryptedName,
                encryptedUserName: pwd.encryptedUserName,
                encryptedPassword: pwd.encryptedPassword,
                encryptedDescription: pwd.encryptedDescription,
                encryptedWebSiteUrl: pwd.encryptedWebSiteUrl,
              },
              encryptionKey!,
              pwd.iv
            );
            decrypted.set(pwd.id, {
              name: decryptedData.name,
              websiteUrl: decryptedData.websiteUrl,
              username: decryptedData.username,
              password: decryptedData.password,
            });
          } catch (err) {
            console.error(`Decrypt error (${pwd.id}):`, err);
          }
        })
      );
      setDecryptedPasswords(decrypted);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.getUserMessage());
      } else {
        setError('Parolalar yüklenemedi');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter passwords by search and current site
  const filteredPasswords = useMemo(() => {
    let filtered = passwords;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((pwd) => {
        const decrypted = decryptedPasswords.get(pwd.id);
        if (!decrypted) return false;
        return (
          decrypted.name.toLowerCase().includes(query) ||
          decrypted.username.toLowerCase().includes(query) ||
          decrypted.websiteUrl.toLowerCase().includes(query)
        );
      });
    }

    // Filter by matching site
    if (activeTab === 'matching' && currentSite) {
      filtered = filtered.filter((pwd) => {
        const decrypted = decryptedPasswords.get(pwd.id);
        if (!decrypted?.websiteUrl) return false;
        try {
          const pwdUrl = new URL(decrypted.websiteUrl.startsWith('http') ? decrypted.websiteUrl : `https://${decrypted.websiteUrl}`);
          return pwdUrl.hostname.includes(currentSite) || currentSite.includes(pwdUrl.hostname);
        } catch {
          return decrypted.websiteUrl.toLowerCase().includes(currentSite.toLowerCase());
        }
      });
    }

    return filtered;
  }, [passwords, searchQuery, activeTab, currentSite, decryptedPasswords]);

  // Get matching passwords for current site
  const matchingPasswords = useMemo(() => {
    if (!currentSite) return [];
    return passwords.filter((pwd) => {
      const decrypted = decryptedPasswords.get(pwd.id);
      if (!decrypted?.websiteUrl) return false;
      try {
        const pwdUrl = new URL(decrypted.websiteUrl.startsWith('http') ? decrypted.websiteUrl : `https://${decrypted.websiteUrl}`);
        return pwdUrl.hostname.includes(currentSite) || currentSite.includes(pwdUrl.hostname);
      } catch {
        return decrypted.websiteUrl.toLowerCase().includes(currentSite.toLowerCase());
      }
    });
  }, [passwords, currentSite, decryptedPasswords]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Bu parolayı silmek istediğinize emin misiniz?')) {
      try {
        await deletePassword({ id });
        const updatedPasswords = passwords.filter((p) => p.id !== id);
        setPasswords(updatedPasswords);
        const newDecrypted = new Map(decryptedPasswords);
        newDecrypted.delete(id);
        setDecryptedPasswords(newDecrypted);

        // Autofill cache'ini de güncelle
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          chrome.storage.local.set({ encryptedPasswords: updatedPasswords });
        }
        localStorage.setItem('cachedPasswords', JSON.stringify(updatedPasswords));
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          setError(err.getUserMessage());
        } else {
          setError('Silme işlemi başarısız');
        }
      }
    }
  };

  const handleCopyUsername = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const decrypted = decryptedPasswords.get(id);
    if (decrypted?.username) {
      await navigator.clipboard.writeText(decrypted.username);
      setCopiedId(`user-${id}`);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleCopyPassword = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const decrypted = decryptedPasswords.get(id);
    if (decrypted?.password) {
      await navigator.clipboard.writeText(decrypted.password);
      setCopiedId(`pass-${id}`);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleAutofill = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const decrypted = decryptedPasswords.get(id);
    if (decrypted && typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'AUTOFILL_PASSWORD',
        username: decrypted.username,
        password: decrypted.password,
      });
      // Close popup after autofill
      window.close();
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

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="popup-page">
        <div className="popup-loading">
          <div className="popup-spinner"></div>
          <span>Parolalar yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-page popup-dashboard" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '600px', maxHeight: '600px' }}>
      {/* Header */}
      <header className="popup-header" style={{ padding: '12px 16px', justifyContent: 'center', flexShrink: 0 }}>
        <div className="popup-header-title" style={{ fontSize: '18px', fontWeight: '600' }}>🔐 Kasa</div>
      </header>

      {/* Scrollable Content Wrapper */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Current Site Banner */}
        {currentSite && matchingPasswords.length > 0 && (
          <div className="popup-current-site">
            <div className="popup-current-site-icon">🌐</div>
            <div className="popup-current-site-info">
              <div className="popup-current-site-label">Mevcut Site</div>
              <div className="popup-current-site-url">{currentSite}</div>
            </div>
            <span className="popup-match-badge">
              {matchingPasswords.length} eşleşme
            </span>
          </div>
        )}

        {/* Search */}
        <div className="popup-search">
          <div className="popup-search-wrapper">
            <span className="popup-search-icon">🔍</span>
            <input
              type="text"
              className="popup-search-input"
              placeholder="Parola ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="popup-quick-actions">
          <button
            className="popup-quick-action"
            onClick={() => onAddPassword ? onAddPassword() : navigate('/passwords/add')}
          >
            <span className="popup-quick-action-icon">➕</span>
            Yeni Ekle
          </button>
          <button
            className="popup-quick-action"
            onClick={() => setActiveTab(activeTab === 'matching' ? 'all' : 'matching')}
          >
            <span className="popup-quick-action-icon">{activeTab === 'matching' ? '📋' : '🎯'}</span>
            {activeTab === 'matching' ? 'Tümü' : 'Eşleşenler'}
          </button>
          <button className="popup-quick-action" onClick={() => fetchPasswords()}>
            <span className="popup-quick-action-icon">🔄</span>
            Yenile
          </button>
        </div>

        {/* Content */}
        <div className="popup-content" style={{ paddingBottom: '100px' }}>
          {error && (
            <div className="popup-alert popup-alert-error" style={{ margin: '12px 16px' }}>
              {error}
            </div>
          )}

          {/* Matching Passwords Section */}
          {currentSite && matchingPasswords.length > 0 && activeTab === 'all' && (
            <>
              <div className="popup-section-header">
                <span>Bu site için ({matchingPasswords.length})</span>
              </div>
              <div className="popup-password-list">
                {matchingPasswords.map((password) => {
                  const decrypted = decryptedPasswords.get(password.id);
                  const faviconUrl = decrypted?.websiteUrl ? getFaviconUrl(decrypted.websiteUrl) : null;

                  return (
                    <div
                      key={`match-${password.id}`}
                      className="popup-password-item suggested"
                      onClick={() => onViewPassword ? onViewPassword(password.id) : navigate(`/passwords/${password.id}`)}
                    >
                      <div className="popup-password-favicon">
                        {faviconUrl ? (
                          <img src={faviconUrl} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <span className="popup-password-favicon-letter">{getInitial(decrypted?.name || 'P')}</span>
                        )}
                      </div>
                      <div className="popup-password-info">
                        <div className="popup-password-name">{decrypted?.name || 'Parola'}</div>
                        <div className="popup-password-username">{decrypted?.username || '-'}</div>
                      </div>
                      <div className="popup-password-actions">
                        <button
                          className="popup-autofill-btn"
                          onClick={(e) => handleAutofill(password.id, e)}
                          title="Otomatik Doldur"
                        >
                          ⚡ Doldur
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* All Passwords Section */}
          <div className="popup-section-header">
            <span>
              {activeTab === 'matching' ? 'Eşleşen Parolalar' : 'Tüm Parolalar'} ({filteredPasswords.length})
            </span>
          </div>

          {filteredPasswords.length === 0 ? (
            <div className="popup-empty">
              <div className="popup-empty-icon">🔐</div>
              <div className="popup-empty-title">
                {searchQuery ? 'Sonuç bulunamadı' : 'Henüz parola yok'}
              </div>
              <div className="popup-empty-text">
                {searchQuery ? 'Farklı bir arama deneyin' : 'İlk parolanızı ekleyerek başlayın'}
              </div>
              {!searchQuery && (
                <button
                  className="popup-btn popup-btn-primary"
                  onClick={() => onAddPassword ? onAddPassword() : navigate('/passwords/add')}
                >
                  ➕ Yeni Parola Ekle
                </button>
              )}
            </div>
          ) : (
            <div className="popup-password-list">
              {filteredPasswords
                .filter((pwd) => activeTab !== 'all' || !matchingPasswords.find((m) => m.id === pwd.id))
                .map((password) => {
                  const decrypted = decryptedPasswords.get(password.id);
                  const faviconUrl = decrypted?.websiteUrl ? getFaviconUrl(decrypted.websiteUrl) : null;

                  return (
                    <div
                      key={password.id}
                      className="popup-password-item"
                      onClick={() => onViewPassword ? onViewPassword(password.id) : navigate(`/passwords/${password.id}`)}
                    >
                      <div className="popup-password-favicon">
                        {faviconUrl ? (
                          <img src={faviconUrl} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <span className="popup-password-favicon-letter">{getInitial(decrypted?.name || 'P')}</span>
                        )}
                      </div>
                      <div className="popup-password-info">
                        <div className="popup-password-name">{decrypted?.name || 'Parola'}</div>
                        <div className="popup-password-username">{decrypted?.username || '-'}</div>
                      </div>
                      <div className="popup-password-actions">
                        <button
                          className={`popup-action-btn primary ${copiedId === `user-${password.id}` ? 'copied' : ''}`}
                          onClick={(e) => handleCopyUsername(password.id, e)}
                          title="Kullanıcı Adını Kopyala"
                        >
                          {copiedId === `user-${password.id}` ? '✓' : '👤'}
                        </button>
                        <button
                          className={`popup-action-btn primary ${copiedId === `pass-${password.id}` ? 'copied' : ''}`}
                          onClick={(e) => handleCopyPassword(password.id, e)}
                          title="Parolayı Kopyala"
                        >
                          {copiedId === `pass-${password.id}` ? '✓' : '🔑'}
                        </button>
                        <button
                          className="popup-action-btn success"
                          onClick={(e) => handleAutofill(password.id, e)}
                          title="Otomatik Doldur"
                        >
                          ⚡
                        </button>
                        <button
                          className="popup-action-btn danger"
                          onClick={(e) => handleDelete(password.id, e)}
                          title="Sil"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div> {/* Close scrollable content wrapper */}

      {/* Bottom Navigation - Now static flex item */}
      <nav style={{
        background: 'var(--bg-sidebar)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '4px 0',
        flexShrink: 0
      }}>
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
          <span style={{ fontSize: '20px' }}>🏠</span>
          <span style={{ fontWeight: '600' }}>Kasa</span>
        </button>
        <button
          onClick={() => onPasswordGenerator ? onPasswordGenerator() : navigate('/password-generator')}
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
          onClick={() => onSettings ? onSettings() : navigate('/settings')}
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
          <span style={{ fontSize: '20px' }}>⚙️</span>
          <span>Ayarlar</span>
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

export default Dashboard;
