import { useState, useEffect } from 'react';
import { useVaultLock } from '../context/VaultLockContext';
import { useNavigate } from 'react-router-dom';
import { logout } from '../helpers/api';
import '../styles/auth.css';

const UnlockVault = () => {
    const { unlock, clearVaultState } = useVaultLock();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('userName');
        if (storedUser) {
            setUsername(storedUser);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) return;

        setLoading(true);
        setError(null);

        const success = await unlock(password);

        if (success) {
            // Başarılı olduğunda isLocked false olacak ve parent component (ProtectedRoute) 
            // otomatik olarak asıl içeriği gösterecek.
        } else {
            setError('Master Parola yanlış veya doğrulanamadı.');
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        await logout();
        clearVaultState();
        navigate('/login');
    };

    const isExtension = typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id && window.location.protocol === 'chrome-extension:';


    return (
        <div className={`auth-container ${!isExtension ? 'web-mode' : ''}`}>

            {/* Wrapper for split layout */}
            <div className="auth-content-wrapper">

                {/* External Header (Web Mode Only) */}
                {!isExtension && (
                    <div className="auth-header-external">
                        <div className="auth-header-logo">
                            🔒
                        </div>
                        <h1 className="auth-header-title">Kasa Kilitli</h1>
                        {username && (
                            <div className="auth-header-subtitle">
                                <b>{username}</b>
                            </div>
                        )}
                    </div>
                )}

                <div className="auth-box">
                    {/* Extension Mode Header (Inside box) */}
                    {isExtension && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '50%',
                                background: 'var(--primary)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                marginBottom: '12px'
                            }}>
                                🔒
                            </div>
                            {username ? (
                                <>
                                    <h3 style={{ margin: 0, fontSize: '16px' }}>{username}</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '4px 0 0 0' }}>Kasa Kilitli</p>
                                </>
                            ) : (
                                <h3 style={{ margin: 0 }}>Kasa Kilitli</h3>
                            )}
                        </div>
                    )}

                    {!username && <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Devam etmek için Master Parolanızı girin.
                        </p>
                    </div>}

                    {error && <div className="alert alert-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="masterPassword">Master Parola</label>
                            <input
                                id="masterPassword"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Giriş yapmak için parolanızı girin"
                                required
                                autoFocus
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                            {loading ? 'Doğrulanıyor...' : 'Kilidi Aç'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <button
                            onClick={handleLogout}
                            className="btn-link"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            Farklı bir hesapla giriş yap
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnlockVault;
