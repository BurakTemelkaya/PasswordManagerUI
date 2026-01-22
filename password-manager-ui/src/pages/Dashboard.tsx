import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPasswords, logout, deletePassword } from '../helpers/api';
import type { Password } from '../types';
import { decryptDataFromAPI } from '../helpers/encryption';
import { formatLocalDateTime } from '../helpers/dateFormatter';
import '../styles/pages.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decryptedPasswords, setDecryptedPasswords] = useState<
    Map<string, { name: string; websiteUrl: string; username: string }>
  >(new Map());

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchPasswords();
  }, [currentPage, pageSize]);

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
      const data = await getAllPasswords(currentPage, pageSize);
      const passwordList = data.items || [];
      console.log('✅ API döndü, parola sayısı:', passwordList.length);
      
      setPasswords(passwordList);
      setTotalPages(data.pages);
      setTotalCount(data.count);

      // Şifreleri çöz (Encryption Key'i geç)
      const decrypted = new Map();
      
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

  const handleLogout = () => {
    logout();
    navigate('/login');
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

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(0);
  };

  if (loading && passwords.length === 0) {
    return <div className="loading">Yükleniyor...</div>;
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Parolalarım</h1>
        <div className="header-actions">
          <span className="user-name">👤 Kullanıcı</span>
          <button onClick={handleLogout} className="btn btn-logout">
            Çıkış Yap
          </button>
        </div>
      </header>

      <main className="main">
        <div className="actions">
          <button onClick={() => navigate('/passwords/add')} className="btn btn-primary">
            + Yeni Parola
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {passwords.length === 0 ? (
          <div className="empty-state">
            <p>Henüz parola eklememişsiniz</p>
            <button
              onClick={() => navigate('/passwords/add')}
              className="btn btn-primary"
            >
              İlk parolayı ekleyin
            </button>
          </div>
        ) : (
          <>
            <div className="password-grid">
              {passwords.map((password) => {
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
                        onClick={() => navigate(`/passwords/${password.id}`)}
                        className="btn btn-small btn-info"
                      >
                        Görüntüle
                      </button>
                      <button
                        onClick={() => navigate(`/passwords/${password.id}/edit`)}
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
            <div className="pagination">
              <div className="pagination-info">
                <span>
                  Sayfa {currentPage + 1} / {totalPages} (Toplam: {totalCount} parola)
                </span>
                <select value={pageSize} onChange={handlePageSizeChange} className="page-size-select">
                  <option value="5">5 başına</option>
                  <option value="10">10 başına</option>
                  <option value="20">20 başına</option>
                  <option value="50">50 başına</option>
                </select>
              </div>
              <div className="pagination-buttons">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                  className="btn btn-secondary"
                >
                  ← Önceki
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages - 1}
                  className="btn btn-secondary"
                >
                  Sonraki →
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
