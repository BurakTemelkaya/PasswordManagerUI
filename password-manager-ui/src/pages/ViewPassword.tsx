import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getPasswordById, deletePassword } from '../helpers/api';
import { decryptDataFromAPI } from '../helpers/encryption';
import { formatLocalDateTime } from '../helpers/dateFormatter';
import type { Password } from '../types';
import '../styles/pages.css';

import { usePasswords } from '../context/PasswordContext';

const ViewPassword = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { passwords, fetchPasswords } = usePasswords(); // Context'ten parolaları al

  const [password, setPassword] = useState<Password | null>(null);
  const [decrypted, setDecrypted] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (id) {
      loadPassword();
    }
  }, [id, passwords]); // passwords değişince (örn sync) burası da güncellensin mi? Evet.

  const loadPassword = async () => {
    try {
      setLoading(true);
      setError(null);

      const encryptionKey = sessionStorage.getItem('encryptionKey');
      if (!encryptionKey) {
        setError('Kasa kilitli. Lütfen yeniden giriş yapın.');
        setLoading(false);
        return;
      }

      // 1. Önce Context'teki (hafızadaki) listeye bak
      let targetPassword = passwords.find(p => p.id === id);

      // 2. Eğer listede yoksa (örn: direkt link ile gelindi ve liste henüz yüklenmedi veya listede yok)
      // API'den çek
      if (!targetPassword) {
        try {
          // Eğer context loading ise bekle? Hayır, direkt çekelim.
          targetPassword = await getPasswordById(id!);
        } catch (e) {
          // API'de de bulunamadı
          console.error(e);
          setError('Parola bulunamadı.');
          setLoading(false);
          return;
        }
      }

      if (!targetPassword) {
        setError('Parola bulunamadı');
        setLoading(false);
        return;
      }

      setPassword(targetPassword);

      // IV kontrol
      if (!targetPassword.iv) {
        console.warn('⚠️ IV BULUNAMADI');
        setError('Bu parola eski formatta.');
        setLoading(false);
        return;
      }

      // 3. Şifreyi çöz
      // Context'teki cache (decryptedPasswords) sadece listeleme alanlarını tutar (password/description yoktur).
      // Bu yüzden detay sayfasında HER ZAMAN şifre çözme işlemi yapılır.
      try {
        const decryptedData = await decryptDataFromAPI(
          {
            encryptedName: targetPassword.encryptedName,
            encryptedUserName: targetPassword.encryptedUserName,
            encryptedPassword: targetPassword.encryptedPassword,
            encryptedDescription: targetPassword.encryptedDescription,
            encryptedWebSiteUrl: targetPassword.encryptedWebSiteUrl,
          },
          encryptionKey,
          targetPassword.iv
        );
        setDecrypted(decryptedData);
      } catch (decryptError: any) {
        console.error('❌ Decrypt hatası:', decryptError);
        setError(`Şifre çözme başarısız: ${decryptError.message}`);
      }

    } catch (err: any) {
      console.error('❌ Hata:', err);
      setError(`İşlem başarısız: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bu parolayı silmek istediğinize emin misiniz?')) return;

    try {
      setLoading(true);
      await deletePassword({ id: id! });
      await fetchPasswords(true);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Silme işlemi başarısız.');
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Kopyalandı!');
  };

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  if (error || !password) {
    return (
      <div className="container">
        <div className="alert alert-error">{error || 'Parola bulunamadı'}</div>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Geri Dön
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <button onClick={() => navigate('/')} className="btn btn-back">
          ← Geri
        </button>
        <h1>{decrypted?.name || 'Parola'}</h1>
      </header>

      <main className="main">
        <div className="password-details">
          <div className="detail-group">
            <label>Website</label>
            <p>{decrypted?.websiteUrl || '-'}</p>
          </div>

          <div className="detail-group">
            <label>Kullanıcı Adı</label>
            <div className="detail-with-action">
              <p>{decrypted?.username || '-'}</p>
              <button
                onClick={() => copyToClipboard(decrypted?.username || '')}
                className="btn btn-small"
              >
                Kopyala
              </button>
            </div>
          </div>

          <div className="detail-group">
            <label>Parola</label>
            <div className="detail-with-action">
              <p>{showPassword ? decrypted?.password : '••••••••'}</p>
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="btn btn-small"
              >
                {showPassword ? 'Gizle' : 'Göster'}
              </button>
              <button
                onClick={() => copyToClipboard(decrypted?.password || '')}
                className="btn btn-small"
              >
                Kopyala
              </button>
            </div>
          </div>

          {decrypted?.description && (
            <div className="detail-group">
              <label>Açıklama</label>
              <p>{decrypted.description}</p>
            </div>
          )}

          <div className="detail-group">
            <label>Oluşturulma Tarihi</label>
            <p>{formatLocalDateTime(password.createdDate)}</p>
          </div>

          {password.updatedDate && (
            <div className="detail-group">
              <label>Son Güncellenme Tarihi</label>
              <p>{formatLocalDateTime(password.updatedDate)}</p>
            </div>
          )}
        </div>

        <div className="actions">
          <button
            onClick={handleDelete}
            className="btn"
            style={{ backgroundColor: '#ef4444', color: 'white', marginRight: 'auto' }}
          >
            Sil
          </button>
          <button
            onClick={() => navigate(`/passwords/${id}/edit`)}
            className="btn btn-warning"
          >
            Düzenle
          </button>
          <button onClick={() => navigate('/')} className="btn btn-secondary">
            Kapat
          </button>
        </div>
      </main>
    </div>
  );
};

export default ViewPassword;
