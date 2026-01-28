import { useNavigate } from 'react-router-dom';
import '../styles/pages.css';

const DownloadExtension = () => {
  const navigate = useNavigate();

  const handleDownload = () => {
    // Extension ZIP dosyasını indir
    const link = document.createElement('a');
    link.href = '/password-manager-extension.zip';
    link.download = 'password-manager-extension.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="download-page">
      <div className="download-container">
        {/* Header */}
        <header className="download-header" style={{ position: 'relative' }}>
          <button
            onClick={() => navigate('/')}
            className="btn-back-absolute"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ← Geri
          </button>
          <div className="download-logo">🔐</div>
          <h1>Parola Yöneticisi</h1>
          <p className="download-subtitle">
            Zero-Knowledge güvenlikli tarayıcı eklentisi
          </p>
        </header>

        {/* Features */}
        <section className="download-features">
          <div className="feature-card">
            <span className="feature-icon">🔒</span>
            <h3>Zero-Knowledge</h3>
            <p>Parolalarınız cihazınızda şifrelenir, sunucuda asla açık metin olarak tutulmaz.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">⚡</span>
            <h3>Otomatik Doldurma</h3>
            <p>Web sitelerine tek tıkla giriş yapın, form alanlarını otomatik doldurun.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🔄</span>
            <h3>Import/Export</h3>
            <p>Chrome, Firefox, Bitwarden, LastPass'tan parolalarınızı kolayca aktarın.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🛡️</span>
            <h3>Güçlü Şifreleme</h3>
            <p>AES-256-GCM şifreleme ve PBKDF2 (600.000 iterasyon) ile korunun.</p>
          </div>
        </section>

        {/* Download Section */}
        <section className="download-section">
          <h2>Tarayıcı Eklentisini İndirin</h2>

          <div className="download-options">
            {/* Chrome/Edge */}
            <div className="download-card">
              <div className="browser-icons">
                <span className="browser-icon" title="Chrome">🌐</span>
                <span className="browser-icon" title="Edge">💠</span>
                <span className="browser-icon" title="Brave">🦁</span>
              </div>
              <h3>Chrome / Edge / Brave</h3>
              <p>Chromium tabanlı tarayıcılar için</p>
              <button onClick={handleDownload} className="download-btn">
                📦 Eklentiyi İndir (.zip)
              </button>
            </div>
          </div>

          {/* Installation Guide */}
          <div className="install-guide">
            <h3>📋 Kurulum Adımları</h3>
            <ol>
              <li>
                <strong>İndirin:</strong> Yukarıdaki butona tıklayarak ZIP dosyasını indirin.
              </li>
              <li>
                <strong>Çıkartın:</strong> ZIP dosyasını bir klasöre çıkartın.
              </li>
              <li>
                <strong>Eklentiler sayfasını açın:</strong>
                <code>chrome://extensions</code> adresine gidin.
              </li>
              <li>
                <strong>Geliştirici modu:</strong> Sağ üst köşedeki "Geliştirici modu"nu açın.
              </li>
              <li>
                <strong>Yükleyin:</strong> "Paketlenmemiş öğe yükle" butonuna tıklayın ve çıkarttığınız klasörü seçin.
              </li>
              <li>
                <strong>Hazır!</strong> Eklenti simgesi tarayıcı araç çubuğunda görünecektir.
              </li>
            </ol>
          </div>
        </section>

        {/* Already have an account? */}
        <section className="download-actions">
          <p>Zaten hesabınız var mı?</p>
          <button onClick={() => navigate('/login')} className="btn-secondary">
            Giriş Yap
          </button>
          <button onClick={() => navigate('/register')} className="btn-primary">
            Kayıt Ol
          </button>
        </section>

        {/* Footer */}
        <footer className="download-footer">
          <p>
            🔐 Açık kaynak parola yöneticisi |
            <a href="https://github.com/BurakTemelkaya/PasswordManagerUI" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </p>
        </footer>
      </div>

      <style>{`
        .download-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          padding: 40px 20px;
        }

        .download-container {
          max-width: 900px;
          margin: 0 auto;
        }

        .download-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .download-logo {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .download-header h1 {
          font-size: 36px;
          color: #fff;
          margin-bottom: 8px;
        }

        .download-subtitle {
          font-size: 18px;
          color: #94a3b8;
        }

        .download-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 48px;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          transition: transform 0.2s, border-color 0.2s;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          border-color: rgba(59, 130, 246, 0.5);
        }

        .feature-icon {
          font-size: 40px;
          display: block;
          margin-bottom: 12px;
        }

        .feature-card h3 {
          color: #fff;
          font-size: 16px;
          margin-bottom: 8px;
        }

        .feature-card p {
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.5;
        }

        .download-section {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 32px;
          margin-bottom: 32px;
        }

        .download-section h2 {
          color: #fff;
          text-align: center;
          margin-bottom: 24px;
          font-size: 24px;
        }

        .download-options {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-bottom: 32px;
        }

        .download-card {
          background: rgba(59, 130, 246, 0.1);
          border: 2px solid rgba(59, 130, 246, 0.3);
          border-radius: 16px;
          padding: 32px;
          text-align: center;
          min-width: 280px;
        }

        .browser-icons {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .browser-icon {
          font-size: 32px;
        }

        .download-card h3 {
          color: #fff;
          font-size: 18px;
          margin-bottom: 8px;
        }

        .download-card p {
          color: #94a3b8;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .download-btn {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 14px 28px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .download-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
        }

        .install-guide {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          padding: 24px;
        }

        .install-guide h3 {
          color: #fff;
          margin-bottom: 16px;
          font-size: 18px;
        }

        .install-guide ol {
          color: #cbd5e1;
          padding-left: 24px;
          margin: 0;
        }

        .install-guide li {
          margin-bottom: 12px;
          line-height: 1.6;
        }

        .install-guide strong {
          color: #fff;
        }

        .install-guide code {
          background: rgba(59, 130, 246, 0.2);
          padding: 2px 8px;
          border-radius: 4px;
          font-family: monospace;
          color: #60a5fa;
        }

        .download-actions {
          text-align: center;
          margin-bottom: 32px;
        }

        .download-actions p {
          color: #94a3b8;
          margin-bottom: 16px;
        }

        .download-actions button {
          margin: 0 8px;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .btn-primary {
          background: #3b82f6;
          border: none;
          color: #fff;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .download-footer {
          text-align: center;
          color: #64748b;
          font-size: 14px;
        }

        .download-footer a {
          color: #60a5fa;
          text-decoration: none;
          margin-left: 8px;
        }

        .download-footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .download-header h1 {
            font-size: 28px;
          }

          .download-features {
            grid-template-columns: 1fr 1fr;
          }

          .download-card {
            min-width: auto;
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .download-features {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default DownloadExtension;
