import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { logout, deletePassword } from '../helpers/api';
import { ApiError } from '../types';
import { formatLocalDateTime } from '../helpers/dateFormatter';
import { usePasswords } from '../context/PasswordContext';
import { useVaultLock } from '../context/VaultLockContext';
import '../styles/auth.css';

interface DashboardProps {
  onLogout?: () => void; // Extension popup için
  onAddPassword?: () => void; // Extension popup'ta parola ekleme modal
  onViewPassword?: (id: string) => void; // Extension popup'ta parola görüntüleme
  onEditPassword?: (id: string) => void; // Extension popup'ta parola düzenleme
  onSettings?: () => void; // Extension popup'ta ayarlar sayfası
}

const Dashboard = ({ onLogout, onAddPassword, onViewPassword, onEditPassword, onSettings }: DashboardProps) => {
  const navigate = useNavigate();
  const { passwords, decryptedPasswords, loading, error, fetchPasswords, checkForUpdates } = usePasswords();
  const { lock } = useVaultLock();
  const [searchQuery, setSearchQuery] = useState('');
  const userName = localStorage.getItem('userName') || 'Kullanıcı';

  // Local error state for operations (like delete)
  const [localError, setLocalError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // fetchPasswords and Auto-sync logic moved to Context




  // Arama filtresi
  const filteredPasswords = useMemo(() => {
    // Reset page when search changes
    setCurrentPage(1);

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

  // Pagination Logic
  const totalPages = Math.ceil(filteredPasswords.length / itemsPerPage);
  const currentPasswords = filteredPasswords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    if (!window.confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      return;
    }

    await logout();

    // Extension popup'ta mı diye kontrol et
    if (onLogout) {
      onLogout();
    } else {
      // Normal web app'ta - router'a yönlendir
      navigate('/login');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu parolayı silmek istediğinize emin misiniz?')) {
      try {
        setLocalError(null);
        await deletePassword({ id });
        // Context'i güncelle
        await fetchPasswords(true);
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          setLocalError(err.getUserMessage());
        } else {
          setLocalError('Silme işlemi başarısız');
        }
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
          <Link
            to="/download"
            className="btn btn-info"
            style={{ marginRight: '8px', textDecoration: 'none' }}
            title="Tarayıcı eklentisini indir"
          >
            🔌 Eklenti
          </Link>
          <button
            onClick={() => checkForUpdates(true)}
            className="btn btn-secondary"
            style={{ marginRight: '8px' }}
            title="Şimdi Senkronize Et"
          >
            🔄
          </button>
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
          <span className="user-name">👤 {userName}</span>

          <button
            onClick={lock}
            className="btn btn-warning"
            style={{ marginRight: '8px' }}
            title="Kasayı Kilitle"
          >
            🔒 Kilitle
          </button>

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

        {(error || localError) && <div className="alert alert-error">{error || localError}</div>}

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
          <>
            <div className="password-grid">
              {currentPasswords.map((password) => {
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn btn-secondary"
                  style={{ opacity: currentPage === 1 ? 0.5 : 1, marginTop: 0 }}
                >
                  &laquo; Önceki
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2))
                  .map((page, index, array) => {
                    // Add dots if there are gaps
                    const showDots = index > 0 && page - array[index - 1] > 1;
                    return (
                      <div key={page} style={{ display: 'flex', alignItems: 'center' }}>
                        {showDots && <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>...</span>}
                        <button
                          onClick={() => handlePageChange(page)}
                          className={`btn ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ minWidth: '32px', marginTop: 0 }}
                        >
                          {page}
                        </button>
                      </div>
                    );
                  })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn btn-secondary"
                  style={{ opacity: currentPage === totalPages ? 0.5 : 1, marginTop: 0 }}
                >
                  Sonraki &raquo;
                </button>
              </div>
            )}
          </>
        )}

        {/* Toplam parola sayısı */}
        <div style={{ textAlign: 'center', marginTop: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>
          Toplam: {passwords.length} parola {searchQuery && `(${filteredPasswords.length} sonuç)`}
          {totalPages > 1 && ` • Sayfa ${currentPage} / ${totalPages}`}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
