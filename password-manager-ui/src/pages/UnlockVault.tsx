import { useState, useEffect } from 'react';
import { useVaultLock } from '../context/VaultLockContext';
import { logout } from '../helpers/api';
import '../styles/auth.css';

const UnlockVault = () => {
    const { unlock } = useVaultLock();
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
        window.location.href = '/login';
    };

    return (
        <div className="auth-container" style={{ background: 'rgba(0,0,0,0.85)' }}>
            <div className="auth-box" style={{ maxWidth: '400px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: '#3b82f6',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        fontWeight: 600,
                        marginBottom: '16px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}>
                        {username ? username.substring(0, 2).toUpperCase() : '🔒'}
                    </div>
                    {username ? (
                        <>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{username}</h3>
                            <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0 0' }}>Kasa Kilitli</p>
                        </>
                    ) : (
                        <h3 style={{ margin: 0 }}>Kasa Kilitli</h3>
                    )}
                </div>

                {!username && <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <p style={{ color: 'var(--text-muted)' }}>
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
                            placeholder="Master parolanızı girin"
                            required
                            autoFocus
                            className="input"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? 'Açılıyor...' : 'Kasayı Aç'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <button
                        onClick={handleLogout}
                        className="btn-link"
                        style={{ fontSize: '14px', color: 'var(--text-muted)' }}
                    >
                        Farklı bir hesapla giriş yap
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UnlockVault;
