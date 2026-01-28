import { useState, useEffect } from 'react';
import { deriveMasterKeyWithKdf, deriveEncryptionKey, hashSHA256 } from '../helpers/encryption';

interface UnlockVaultPopupProps {
    onUnlock: () => void;
    onLogout: () => void;
}

const UnlockVaultPopup = ({ onUnlock, onLogout }: UnlockVaultPopupProps) => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);

    // Chrome extension storage'dan KDF parametrelerini al
    const [kdfParams, setKdfParams] = useState<{ salt: string; iterations: number } | null>(null);

    useEffect(() => {
        const loadParams = async () => {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.local.get(['kdfSalt', 'kdfIterations', 'userName']);

                if (result.kdfSalt) {
                    setKdfParams({
                        salt: result.kdfSalt as string,
                        iterations: result.kdfIterations ? parseInt(result.kdfIterations as string, 10) : 600000
                    });
                }
                if (result.userName) {
                    setUsername(result.userName as string);
                }
            } else {
                // Fallback for dev mode
                const salt = localStorage.getItem('kdfSalt');
                const iter = localStorage.getItem('kdfIterations');
                const storedUser = localStorage.getItem('userName');

                if (salt) {
                    setKdfParams({
                        salt: salt,
                        iterations: iter ? parseInt(iter, 10) : 600000
                    });
                }
                if (storedUser) {
                    setUsername(storedUser);
                }
            }
        };
        loadParams();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) return;
        if (!kdfParams) {
            setError("Güvenlik parametreleri yüklenemedi. Lütfen çıkış yapıp tekrar giriş yapın.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Master Key Türet
            const masterKey = await deriveMasterKeyWithKdf(
                password,
                kdfParams.salt,
                kdfParams.iterations
            );
            const encryptionKey = await deriveEncryptionKey(masterKey);

            // Verification Check
            let valid = true;
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const checkResult = await chrome.storage.local.get(['encryptionKeyCheck']);
                if (checkResult.encryptionKeyCheck) {
                    const currentHash = await hashSHA256(encryptionKey);
                    if (currentHash !== checkResult.encryptionKeyCheck) {
                        valid = false;
                    }
                } else {
                    // Extension'da encryptionKeyCheck ZORUNLU
                    setError("Güvenlik parametreleri yüklenemedi. Lütfen çıkış yapıp tekrar giriş yapın.");
                    setLoading(false);
                    return;
                }
            } else {
                const storedCheck = localStorage.getItem('encryptionKeyCheck');
                if (storedCheck) {
                    const currentHash = await hashSHA256(encryptionKey);
                    if (currentHash !== storedCheck) {
                        valid = false;
                    }
                } else {
                    // Web app'te de encryptionKeyCheck ZORUNLU
                    setError("Güvenlik parametreleri yüklenemedi. Lütfen çıkış yapıp tekrar giriş yapın.");
                    setLoading(false);
                    return;
                }
            }

            if (!valid) {
                setError("Master Parola yanlış.");
                setLoading(false);
                return;
            }

            // Başarılı: Key'i session storage'a yaz (Extension için chrome.storage.session)
            if (typeof chrome !== 'undefined' && chrome.storage?.session) {
                await chrome.storage.session.set({ encryptionKey: encryptionKey });
            }

            // LocalStorage fallback (UI components use sessionStorage)
            sessionStorage.setItem('encryptionKey', encryptionKey);

            onUnlock();

        } catch (err) {
            console.error(err);
            setError("Bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="popup-page" style={{ justifyContent: 'center', textAlign: 'center', padding: '24px' }}>
            {/* Bitwarden-style User Avatar & Info */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: '#3b82f6', // Primary blue
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

            {!username && <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
                Kasanızı açmak için Master Parolanızı girin.
            </p>}

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <div className="form-group">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Master Parola"
                        required
                        autoFocus
                        className="input"
                        style={{ width: '100%' }}
                    />
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                    {loading ? 'Açılıyor...' : 'Kasayı Aç'}
                </button>
            </form>

            <div style={{ marginTop: '16px' }}>
                <button
                    onClick={onLogout}
                    className="btn-link"
                    style={{ fontSize: '13px', color: 'var(--text-muted)' }}
                >
                    Farklı bir hesapla giriş yap
                </button>
            </div>
        </div>
    );
};

export default UnlockVaultPopup;
