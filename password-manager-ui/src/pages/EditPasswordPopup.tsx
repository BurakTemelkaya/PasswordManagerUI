import { useState, useEffect } from 'react';
import { updatePassword, getPasswordById } from '../helpers/api';
import { encryptDataForAPI, decryptDataFromAPI } from '../helpers/encryption';
import type { UpdatedPasswordDto } from '../types';
import '../styles/popup.css';

interface EditPasswordPopupProps {
  id: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const EditPasswordPopup = ({ id, onSuccess, onCancel }: EditPasswordPopupProps) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    description: '',
    websiteUrl: '',
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (id) {
      loadPassword();
    }
  }, [id]);

  const loadPassword = async () => {
    try {
      setInitialLoading(true);

      const encryptionKey = localStorage.getItem('encryptionKey');
      if (!encryptionKey) {
        setError('Encryption key bulunamadı. Lütfen yeniden giriş yapın.');
        setInitialLoading(false);
        return;
      }

      const password = await getPasswordById(id);
      
      const decrypted = await decryptDataFromAPI(
        {
          encryptedName: password.encryptedName,
          encryptedUserName: password.encryptedUserName,
          encryptedPassword: password.encryptedPassword,
          encryptedDescription: password.encryptedDescription,
          encryptedWebSiteUrl: password.encryptedWebSiteUrl,
        },
        encryptionKey,
        password.iv
      );

      setFormData({
        name: decrypted.name,
        username: decrypted.username,
        password: decrypted.password,
        description: decrypted.description,
        websiteUrl: decrypted.websiteUrl,
      });
    } catch (err) {
      setError('Parola yüklenemedi');
      console.error(err);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const generatePassword = () => {
    const length = 16;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*_+-=[]{}|:;<>?,./';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData((prev) => ({
      ...prev,
      password,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.username || !formData.password) {
      setError('Ad, kullanıcı adı ve parola gereklidir');
      return;
    }

    try {
      setLoading(true);

      const encryptionKey = localStorage.getItem('encryptionKey');
      
      if (!encryptionKey) {
        setError('Encryption key bulunamadı. Lütfen yeniden giriş yapın.');
        return;
      }

      const encryptedData = await encryptDataForAPI(
        {
          name: formData.name,
          username: formData.username,
          password: formData.password,
          description: formData.description,
          websiteUrl: formData.websiteUrl,
        },
        encryptionKey
      );

      const updateData: UpdatedPasswordDto = {
        id,
        ...encryptedData,
      };
      await updatePassword(updateData);

      onSuccess();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'İşlem başarısız. Lütfen tekrar deneyiniz.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="popup-loading">
        <div className="popup-spinner"></div>
        <span>Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="popup-form-container">
      {/* Header */}
      <div className="popup-header">
        <button onClick={onCancel} className="popup-back-btn" title="Geri">
          ← Geri
        </button>
        <h2 className="popup-title">Parolayı Düzenle</h2>
        <div style={{ width: '32px' }}></div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="popup-form">
        {error && <div className="popup-alert popup-alert-error">{error}</div>}

        <div className="popup-form-group">
          <label htmlFor="name">
            Parola Adı <span className="popup-required">*</span>
          </label>
          <input
            id="name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="örn: GitHub Şifresi"
            required
          />
        </div>

        <div className="popup-form-group">
          <label htmlFor="websiteUrl">Website URL</label>
          <input
            id="websiteUrl"
            type="url"
            name="websiteUrl"
            value={formData.websiteUrl}
            onChange={handleChange}
            placeholder="https://github.com"
          />
        </div>

        <div className="popup-form-group">
          <label htmlFor="username">
            Kullanıcı Adı <span className="popup-required">*</span>
          </label>
          <input
            id="username"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Kullanıcı adını girin"
            required
          />
        </div>

        <div className="popup-form-group">
          <label htmlFor="password">
            Parola <span className="popup-required">*</span>
          </label>
          <div className="popup-password-wrapper">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Parolayı girin"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="popup-icon-btn"
              title={showPassword ? 'Gizle' : 'Göster'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
            <button
              type="button"
              onClick={generatePassword}
              className="popup-icon-btn"
              title="Parola üret"
            >
              🔐
            </button>
          </div>
        </div>

        <div className="popup-form-group">
          <label htmlFor="description">Açıklama</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Notlar (isteğe bağlı)"
            rows={3}
          />
        </div>

        <div className="popup-form-actions">
          <button
            type="submit"
            className="popup-btn popup-btn-primary"
            disabled={loading}
          >
            {loading ? 'Kaydediliyor...' : 'Güncelle'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="popup-btn popup-btn-secondary"
          >
            İptal
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPasswordPopup;
