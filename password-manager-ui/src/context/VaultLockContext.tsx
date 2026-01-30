import { createContext, useContext, useState, useEffect, type ReactNode, useCallback, useRef } from 'react';
import { deriveMasterKeyWithKdf, deriveEncryptionKey, hashSHA256 } from '../helpers/encryption';

interface VaultLockContextType {
    isLocked: boolean;
    unlock: (password: string) => Promise<boolean>;
    lock: () => void;
    resetIdleTimer: () => void;
}

const VaultLockContext = createContext<VaultLockContextType | null>(null);

export const useVaultLock = () => {
    const context = useContext(VaultLockContext);
    if (!context) {
        throw new Error('useVaultLock must be used within a VaultLockProvider');
    }
    return context;
};

// 5 dakika boşta kalma süresi - Arık ayarlardan okunuyor
// const IDLE_TIMEOUT_MS = 5 * 60 * 1000;

export const VaultLockProvider = ({ children }: { children: ReactNode }) => {
    // Başlangıçta locked kabul ediyoruz, useEffect ile kontrol edeceğiz
    const [isLocked, setIsLocked] = useState<boolean>(false);
    const idleTimerRef = useRef<number | null>(null);

    // Initial check on mount
    useEffect(() => {
        checkLockStatus();
    }, []);

    const checkLockStatus = () => {
        // Ayarları oku
        const vaultTimeout = parseInt(localStorage.getItem('vaultTimeout') || '5', 10);

        let encryptionKey = sessionStorage.getItem('encryptionKey');

        // Eğer session'da yoksa ve timeout logic'e göre persist edilmiş olabilir mi?
        if (!encryptionKey) {

            // CASE: Browser Restart (Vault Timeout = -1)
            // Bu durumda key chrome.storage.session'da olabilir (Background page keep-alive)
            // Ancak popup kapanıp açıldığında chrome.storage.session durur.
            if (vaultTimeout === -1) {
                if (typeof chrome !== 'undefined' && chrome.storage?.session) {
                    chrome.storage.session.get(['encryptionKey']).then((data) => {
                        if (data.encryptionKey) {
                            console.log('🔓 Kasa açık (On Restart Policy)');
                            // Restore to session
                            sessionStorage.setItem('encryptionKey', data.encryptionKey as string);
                            setIsLocked(false);
                            resetIdleTimer();
                        } else {
                            setIsLocked(true);
                        }
                    });
                    // Async olduğu için burada return edemeyiz, aşağıda default lock durumu oluşur
                    // Ancak state update ile düzelir.
                }
            }

            // Timer seçenekleri için session storage kullanılır
            // Encryption key asla diske yazılmaz - sadece RAM'de tutulur
        }

        const authToken = localStorage.getItem('authToken');

        // Güvenlik: Encryption key asla diske yazılmaz

        if (authToken && !encryptionKey) {
            // Eğer "On Restart" ile async yükleniyorsa hemen kilitli deme, bekle...
            // Basitlik için varsayılan true, async yüklenince false olur.
            if (vaultTimeout === -1 && typeof chrome !== 'undefined' && chrome.storage?.session) {
                // CheckStatus içinde async handled
            } else {
                setIsLocked(true);
            }
        } else {
            if (encryptionKey) {
                setIsLocked(false);
                resetIdleTimer(); // Timer başlat
            }
        }
    };

    const lock = useCallback(() => {
        const action = localStorage.getItem('vaultAction') || 'lock';

        if (action === 'logout') {
            // LOGOUT: Her şeyi sil
            localStorage.clear();
            sessionStorage.clear();
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.session?.clear();
                chrome.storage.local?.clear();
            }
            window.location.reload();
        } else {
            // LOCK: Sadece anahtarları sil (Şifreli veriler kalsın)
            sessionStorage.removeItem('encryptionKey');

            // Extension storage temizliği - sadece session, local'e dokunma
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.session?.remove(['encryptionKey']);
            }

            setIsLocked(true);
            console.log('🔒 Kasa kilitlendi (Key silindi, Cache duruyor)');
        }
    }, []);

    const unlock = async (password: string): Promise<boolean> => {
        try {
            const kdfSalt = localStorage.getItem('kdfSalt');
            const kdfIterations = localStorage.getItem('kdfIterations');
            const storedCheck = localStorage.getItem('encryptionKeyCheck');

            if (!kdfSalt || !kdfIterations) {
                console.error('KDF parametreleri eksik');
                return false;
            }

            const masterKey = await deriveMasterKeyWithKdf(
                password,
                kdfSalt,
                parseInt(kdfIterations, 10)
            );
            const encryptionKey = await deriveEncryptionKey(masterKey);

            if (storedCheck) {
                const check = await hashSHA256(encryptionKey);
                if (check !== storedCheck) {
                    console.warn('Parola doğrulama başarısız');
                    return false;
                }
            } else {
                // First login maybe?
            }

            // --- SAVE KEY LOGIC ---
            sessionStorage.setItem('encryptionKey', encryptionKey);

            const vaultTimeout = parseInt(localStorage.getItem('vaultTimeout') || '5', 10);

            // CASE: "On Restart" (-1) -> Save to chrome.storage.session
            // Bu sayede popup kapanınca silinmez ama browser kapanınca silinir.
            if (vaultTimeout === -1) {
                if (typeof chrome !== 'undefined' && chrome.storage?.session) {
                    chrome.storage.session.set({ encryptionKey });
                }
            }
            // Timer seçenekleri için: Key sadece sessionStorage'da, diske yazılmaz
            // Bu güvenli çünkü tarayıcı kapandığında otomatik silinir
            // CASE: "Immediately" (0) -> Don't save anywhere (Session only)

            setIsLocked(false);
            resetIdleTimer();
            return true;
        } catch (e) {
            console.error('Unlock error:', e);
            return false;
        }
    };

    const resetIdleTimer = useCallback(() => {
        if (idleTimerRef.current) {
            window.clearTimeout(idleTimerRef.current);
        }

        const savedTimeout = localStorage.getItem('vaultTimeout');
        const vaultTimeout = savedTimeout ? parseInt(savedTimeout, 10) : 5;

        // Activity Timestamp Güncelle (Debounced yapılabilir ama basit tutuyoruz)
        localStorage.setItem('lastActivity', Date.now().toString());
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
            // Background script de görsün diye
            chrome.storage.local.set({ lastActivity: Date.now() });
        }

        // -1 (Restart), -2 (Never) -> Timer yok
        if (vaultTimeout <= 0) return;

        const timeoutMs = vaultTimeout * 60 * 1000;

        const encryptionKey = sessionStorage.getItem('encryptionKey');
        if (!isLocked && encryptionKey) {
            idleTimerRef.current = window.setTimeout(() => {
                console.log(`⏱️ Süre doldu (${vaultTimeout} dk)`);
                lock();
            }, timeoutMs);
        }
    }, [isLocked, lock]);

    // Aktivite dinleyicileri
    useEffect(() => {
        if (isLocked) return;

        const handleActivity = () => resetIdleTimer();

        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('click', handleActivity);
        window.addEventListener('scroll', handleActivity);
        window.addEventListener('touchstart', handleActivity);

        resetIdleTimer();

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('scroll', handleActivity);
            window.removeEventListener('touchstart', handleActivity);
            if (idleTimerRef.current) {
                window.clearTimeout(idleTimerRef.current);
            }
        };
    }, [isLocked, resetIdleTimer]);

    // Tab kapanırken temizlik (Sadece 'Immediately' ise veya özel durumlar)
    useEffect(() => {
        const handleBeforeUnload = () => {
            // Vault Timeout ayarını oku
            const vaultTimeout = parseInt(localStorage.getItem('vaultTimeout') || '5', 10);

            if (vaultTimeout === 0) {
                // Hemen kilitle
                sessionStorage.removeItem('encryptionKey');
            }
            // Diğer durumlarda (Restart, Timer, Never) elleme, storage'da kalsın.
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    return (
        <VaultLockContext.Provider value={{ isLocked, unlock, lock, resetIdleTimer }}>
            {children}
        </VaultLockContext.Provider>
    );
};
