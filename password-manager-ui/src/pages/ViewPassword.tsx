import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getPasswordById } from '../helpers/api';
import { decryptDataFromAPI } from '../helpers/encryption';
import { formatLocalDateTime } from '../helpers/dateFormatter';
import type { Password } from '../types';
import '../styles/pages.css';

const ViewPassword = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState<Password | null>(null);
  const [decrypted, setDecrypted] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPassword();
    }
  }, [id]);

  const fetchPassword = async () => {
    try {
      setLoading(true);
      setError(null);

      // localStorage'dan Encryption Key'i al
      const encryptionKey = localStorage.getItem('encryptionKey');
      
      if (!encryptionKey) {
        setError('Encryption key bulunamadı. Lütfen yeniden giriş yapın.');
        setLoading(false);
        return;
      }

      const passwordData = await getPasswordById(id!);
      setPassword(passwordData);

      // IV kontrol - eski şifreler (IV olmadan) vs yeni şifreler (IV ile)
      if (!passwordData.iv) {
        console.warn('⚠️ IV BULUNAMADI - Eski şifreleme mi? Backward compat gerekli olabilir');
        setError('Bu parola yeni format ile kaydedilmemiş. Admin ile iletişim kurun.');
        setLoading(false);
        return;
      }

      // Şifreyi çöz (Encryption Key'i geç)
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
          passwordData.iv // Veritabanından gelen IV'ı geç
        );
        setDecrypted(decryptedData);
      } catch (decryptError: any) {
        console.error('❌ Decrypt hatası:', decryptError);
        console.error('Hata detayı:', {
          message: decryptError.message,
          name: decryptError.name,
          stack: decryptError.stack?.split('\n').slice(0, 3),
        });
        setError(`Şifre çözme başarısız: ${decryptError.message}`);
        setLoading(false);
        return;
      }
    } catch (err: any) {
      console.error('❌ Parola yükleme hatası:', err);
      setError(`Parola yüklenemedi: ${err.message || err}`);
    } finally {
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
