import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addPassword, updatePassword, getPasswordById } from '../helpers/api';
import { encryptDataForAPI, decryptDataFromAPI } from '../helpers/encryption';
import type { CreatePasswordDto, UpdatedPasswordDto } from '../types';
import '../styles/pages.css';

const AddPassword = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    description: '',
    websiteUrl: '',
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isEditMode && id) {
      loadPassword();
    }
  }, [id, isEditMode]);

  const loadPassword = async () => {
    try {
      setInitialLoading(true);
      const password = await getPasswordById(id!);
      
      // Şifreyi çöz
      const decrypted = decryptDataFromAPI({
        encryptedName: password.encryptedName,
        encryptedUserName: password.encryptedUserName,
        encryptedPassword: password.encryptedPassword,
        encryptedDescription: password.encryptedDescription,
        encryptedWebSiteUrl: password.encryptedWebSiteUrl,
      });

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

    // Validasyon
    if (!formData.name || !formData.username || !formData.password) {
      setError('Ad, kullanıcı adı ve parola gereklidir');
      return;
    }

    try {
      setLoading(true);

      // Verileri şifrele
      const encryptedData = encryptDataForAPI({
        name: formData.name,
        username: formData.username,
        password: formData.password,
        description: formData.description,
        websiteUrl: formData.websiteUrl,
      });

      if (isEditMode && id) {
        // Güncelle
        const updateData: UpdatedPasswordDto = {
          id,
          ...encryptedData,
        };
        await updatePassword(updateData);
      } else {
        // Ekle
        const createData: CreatePasswordDto = encryptedData;
        await addPassword(createData);
      }

      navigate('/');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'İşlem başarısız. Lütfen tekrar deneyiniz.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  return (
    <div className="container">
      <header className="header">
        <button onClick={() => navigate('/')} className="btn btn-back">
          ← Geri
        </button>
        <h1>{isEditMode ? 'Parolayı Düzenle' : 'Yeni Parola Ekle'}</h1>
      </header>

      <main className="main">
        <form onSubmit={handleSubmit} className="password-form">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="name">
              Parola Adı <span className="required">*</span>
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

          <div className="form-group">
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

          <div className="form-group">
            <label htmlFor="username">
              Kullanıcı Adı <span className="required">*</span>
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

          <div className="form-group">
            <label htmlFor="password">
              Parola <span className="required">*</span>
            </label>
            <div className="password-input-wrapper">
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
                className="btn btn-icon"
                title={showPassword ? 'Gizle' : 'Göster'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
              <button
                type="button"
                onClick={generatePassword}
                className="btn btn-icon"
                title="Parola üret"
              >
                🔐
              </button>
            </div>
            <small>Güvenli bir parola için 🔐 butonuna tıklayın</small>
          </div>

          <div className="form-group">
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

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Kaydediliyor...' : isEditMode ? 'Güncelle' : 'Ekle'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-secondary"
            >
              İptal
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AddPassword;
