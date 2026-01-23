import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPasswords, logout, deletePassword } from '../helpers/api';
import type { Password } from '../types';
import { decryptDataFromAPI } from '../helpers/encryption';
import { formatLocalDateTime } from '../helpers/dateFormatter';
import '../styles/auth.css';

interface DashboardProps {
  onLogout?: () => void; // Extension popup için
  onAddPassword?: () => void; // Extension popup'ta parola ekleme modal
  onViewPassword?: (id: string) => void; // Extension popup'ta parola görüntüleme
  onEditPassword?: (id: string) => void; // Extension popup'ta parola düzenleme
  onSettings?: () => void; // Extension popup'ta ayarlar sayfası
}

interface DecryptedData {
  name: string;
  websiteUrl: string;
  username: string;
}

const Dashboard = ({ onLogout, onAddPassword, onViewPassword, onEditPassword, onSettings }: DashboardProps) => {
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [decryptedPasswords, setDecryptedPasswords] = useState<Map<string, DecryptedData>>(new Map());

  useEffect(() => {
    fetchPasswords();
  }, []);

  const fetchPasswords = async () => {
    try {
      setLoading(true);
      setError(null);

      // localStorage'dan Encryption Key'i al
      const encryptionKey = localStorage.getItem('encryptionKey');
      console.log('🔑 Encryption Key var mı?', !!encryptionKey);
      
      if (!encryptionKey) {
        setError('Encryption key bulunamadı. Lütfen yeniden giriş yapın.');
        setLoading(false);
        return;
      }

      console.log('📥 Parolalar yükleniyor...');
      const passwordList = await getAllPasswords();
      console.log('✅ API döndü, parola sayısı:', passwordList.length);
      
      setPasswords(passwordList);

      // Şifreleri çöz (Encryption Key'i geç)
      const decrypted = new Map<string, DecryptedData>();
      
      console.log('🔓 Decrypt işlemleri başlıyor...');
      // Promise.all ile parallel decrypt işlemi
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
              encryptionKey,
              pwd.iv // Veritabanından gelen IV'ı geç
            );
            decrypted.set(pwd.id, {
              name: decryptedData.name,
              websiteUrl: decryptedData.websiteUrl,
              username: decryptedData.username,
            });
            console.log(`✅ ${decryptedData.name} decrypted başarılı`);
          } catch (err: any) {
            console.error(`❌ Decrypt hatası (${pwd.id}):`, err.message || err);
          }
        })
      );
      console.log('✅ Tüm decrypt işlemleri tamamlandı, toplam:', decrypted.size);
      setDecryptedPasswords(decrypted);
      setError(null);
    } catch (err) {
      setError('Parolalar yüklenemedi');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Arama filtresi
  const filteredPasswords = useMemo(() => {
    if (!searchQuery.trim()) return passwords;
    
    const query = searchQuery.toLowerCase();
    return passwords.filter((pwd) => {
      const decrypted = decryptedPasswords.get(pwd.id);
      if (!decrypted) return false;
      return (
        decrypted.name.toLowerCase().includes(query) ||
        decrypted.username.toLowerCase().includes(query) ||
        decrypted.websiteUrl.toLowerCase().includes(query)
      );
    });
  }, [passwords, searchQuery, decryptedPasswords]);

  const handleLogout = () => {
    logout();
    
    // Extension popup'ta mı diye kontrol et
    if (onLogout) {
      console.log('📱 Extension popup modunda - onLogout callback çağrılıyor');
      onLogout();
    } else {
      // Normal web app'ta - router'a yönlendir
      navigate('/login');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu parolayı silmek istediğinize emin misiniz?')) {
      try {
        await deletePassword({ id });
        setPasswords(passwords.filter((p) => p.id !== id));
      } catch (err) {
        setError('Silme işlemi başarısız');
        console.error(err);
      }
    }
  };

  if (loading && passwords.length === 0) {
    return <div className="loading">Yükleniyor...</div>;
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Parolalarım</h1>
        <div className="header-actions">
          <button
            onClick={() => {
              if (onSettings) {
                onSettings();
              } else {
                navigate('/settings');
              }
            }}
            className="btn btn-secondary"
            style={{ marginRight: '8px' }}
            title="Ayarlar"
          >
            ⚙️
          </button>
          <span className="user-name">👤 Kullanıcı</span>
          <button onClick={handleLogout} className="btn btn-logout">
            Çıkış Yap
          </button>
        </div>
      </header>

      <main className="main">
        <div className="actions">
          <button onClick={() => {
            if (onAddPassword) {
              onAddPassword();
            } else {
              navigate('/passwords/add');
            }
          }} className="btn btn-primary">
            + Yeni Parola
          </button>
        </div>

        {/* Arama Kutusu */}
        <div className="search-box" style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Parola ara... (ad, kullanıcı adı, website)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}
          />
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {filteredPasswords.length === 0 ? (
          <div className="empty-state">
            {searchQuery ? (
              <p>"{searchQuery}" için sonuç bulunamadı</p>
            ) : (
              <>
                <p>Henüz parola eklememişsiniz</p>
                <button
                  onClick={() => {
                    if (onAddPassword) {
                      onAddPassword();
                    } else {
                      navigate('/passwords/add');
                    }
                  }}
                  className="btn btn-primary"
                >
                  İlk parolayı ekleyin
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="password-grid">
            {filteredPasswords.map((password) => {
              const decrypted = decryptedPasswords.get(password.id);
              return (
                <div key={password.id} className="password-card">
                  <h3>{decrypted?.name || 'Parola'}</h3>
                  <p className="website">{decrypted?.websiteUrl || '-'}</p>
                  <p className="username">Kullanıcı: {decrypted?.username || '-'}</p>
                  <p className="password-date">
                    Oluşturulma: {formatLocalDateTime(password.createdDate)}
                  </p>
                  <div className="actions">
                    <button
                      onClick={() => {
                        if (onViewPassword) {
                          onViewPassword(password.id);
                        } else {
                          navigate(`/passwords/${password.id}`);
                        }
                      }}
                      className="btn btn-small btn-info"
                    >
                      Görüntüle
                    </button>
                    <button
                      onClick={() => {
                        if (onEditPassword) {
                          onEditPassword(password.id);
                        } else {
                          navigate(`/passwords/${password.id}/edit`);
                        }
                      }}
                      className="btn btn-small btn-warning"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(password.id)}
                      className="btn btn-small btn-danger"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Toplam parola sayısı */}
        <div style={{ textAlign: 'center', marginTop: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>
          Toplam: {passwords.length} parola {searchQuery && `(${filteredPasswords.length} sonuç)`}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
