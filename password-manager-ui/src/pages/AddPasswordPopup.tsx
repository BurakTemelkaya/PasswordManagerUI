import { useState } from 'react';
import { addPassword } from '../helpers/api';
import { encryptDataForAPI } from '../helpers/encryption';
import type { CreatePasswordDto } from '../types';
import { ApiError } from '../types';
import '../styles/popup.css';

interface AddPasswordPopupProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const AddPasswordPopup = ({ onSuccess, onCancel }: AddPasswordPopupProps) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    description: '',
    websiteUrl: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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

      let encryptionKey: string | null = null;
      if (typeof chrome !== 'undefined' && chrome.storage?.session) {
        const result = await chrome.storage.session.get(['encryptionKey']) as { encryptionKey?: string };
        encryptionKey = result.encryptionKey || null;
      }
      if (!encryptionKey) {
        encryptionKey = sessionStorage.getItem('encryptionKey') || localStorage.getItem('encryptionKey');
      }

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

      const createData: CreatePasswordDto = encryptedData;
      await addPassword(createData);

      onSuccess();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.getUserMessage());
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('İşlem başarısız. Lütfen tekrar deneyiniz.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="popup-form-container">
      {/* Header */}
      <div className="popup-header">
        <button onClick={onCancel} className="popup-back-btn" title="Geri">
          ← Geri
        </button>
        <h2 className="popup-title">Yeni Parola Ekle</h2>
        <div style={{ width: '32px' }}></div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="popup-form">
        {error && <div className="popup-alert popup-alert-error">{error}</div>}

        <div className="popup-form-group">
          <label htmlFor="name" className="popup-form-label">
            Parola Adı <span className="popup-form-required">*</span>
          </label>
          <input
            id="name"
            type="text"
            name="name"
            className="popup-form-input"
            value={formData.name}
            onChange={handleChange}
            placeholder="örn: GitHub Şifresi"
            required
          />
        </div>

        <div className="popup-form-group">
          <label htmlFor="websiteUrl" className="popup-form-label">Website URL</label>
          <input
            id="websiteUrl"
            type="url"
            name="websiteUrl"
            className="popup-form-input"
            value={formData.websiteUrl}
            onChange={handleChange}
            placeholder="https://github.com"
          />
        </div>

        <div className="popup-form-group">
          <label htmlFor="username" className="popup-form-label">
            Kullanıcı Adı <span className="popup-form-required">*</span>
          </label>
          <input
            id="username"
            type="text"
            name="username"
            className="popup-form-input"
            value={formData.username}
            onChange={handleChange}
            placeholder="Kullanıcı adını girin"
            required
          />
        </div>

        <div className="popup-form-group">
          <label htmlFor="password" className="popup-form-label">
            Parola <span className="popup-form-required">*</span>
          </label>
          <div className="popup-password-input-wrapper">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              className="popup-form-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="Parolayı girin"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="popup-input-action"
              title={showPassword ? 'Gizle' : 'Göster'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
            <button
              type="button"
              onClick={generatePassword}
              className="popup-input-action"
              title="Parola üret"
            >
              🔐
            </button>
          </div>
          <small style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>Güvenli bir parola için 🔐 butonuna tıklayın</small>
        </div>

        <div className="popup-form-group">
          <label htmlFor="description" className="popup-form-label">Açıklama</label>
          <textarea
            id="description"
            name="description"
            className="popup-form-input popup-form-textarea"
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
            {loading ? 'Ekleniyor...' : 'Ekle'}
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

export default AddPasswordPopup;
