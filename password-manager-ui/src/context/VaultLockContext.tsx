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
        // Öncelik: sessionStorage
        let encryptionKey = sessionStorage.getItem('encryptionKey');

        // Eğer session'da yoksa ve "Tarayıcı kapandığında kilitleme" seçiliyse localStorage'dan bak
        if (!encryptionKey) {
            const lockOnClose = localStorage.getItem('lockOnBrowserClose') !== 'false'; // Default true
            if (!lockOnClose) {
                const persistentKey = localStorage.getItem('persistentEncryptionKey');
                if (persistentKey) {
                    encryptionKey = persistentKey;
                    sessionStorage.setItem('encryptionKey', encryptionKey); // Session'a geri yükle
                }
            }
        }

        const authToken = localStorage.getItem('authToken');

        // Eğer token var ama key yoksa -> Kilitli
        // Eğer token yoksa -> Zaten login değil (kilitli değil ama login gerekli)
        if (authToken && !encryptionKey) {
            setIsLocked(true);
        } else {
            setIsLocked(false);
        }
    };

    const lock = useCallback(() => {
        // Ayarları oku
        const action = localStorage.getItem('vaultAction') || 'lock';
        const authToken = localStorage.getItem('authToken');

        if (authToken) {
            if (action === 'logout') {
                // Logout işlemi
                localStorage.clear();
                sessionStorage.clear();
                if (typeof chrome !== 'undefined' && chrome.storage) {
                    chrome.storage.session?.remove(['authToken', 'encryptionKey']);
                    chrome.storage.local?.remove(['authToken', 'encryptionKeyCheck', 'refreshToken', 'passwords']);
                }
                window.location.reload();
            } else {
                // Sadece kilitle
                sessionStorage.removeItem('encryptionKey');
                localStorage.removeItem('persistentEncryptionKey'); // Persistent key'i de sil

                // Extension için chrome.storage.session'dan da sil
                if (typeof chrome !== 'undefined' && chrome.storage?.session) {
                    chrome.storage.session.remove(['encryptionKey']);
                }

                setIsLocked(true);
                console.log('🔒 Kasa kilitlendi (Otomatik/Manuel)');
            }
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

            // Key türet
            const masterKey = await deriveMasterKeyWithKdf(
                password,
                kdfSalt,
                parseInt(kdfIterations, 10)
            );
            const encryptionKey = await deriveEncryptionKey(masterKey);

            // Doğrulama (Eğer check değeri varsa) - GÜVENLİK GÜNCELLEMESİ: Check ZORUNLU olmalı
            if (storedCheck) {
                const check = await hashSHA256(encryptionKey);
                if (check !== storedCheck) {
                    console.warn('Parola doğrulama başarısız: Hash uyuşmuyor.');
                    return false;
                }
            } else {
                console.error('Kritik Güvenlik Hatası: encryptionKeyCheck bulunamadı. Lütfen tekrar giriş yapın.');
                // Güvenlik için, eğer check değeri yoksa kilidi açma! Çünkü yanlış anahtarla açarsak veri kaybı/bozulması görünür.
                return false;
            }

            // Başarılı - Key'i session'a yaz
            sessionStorage.setItem('encryptionKey', encryptionKey);

            // Eğer "Tarayıcı kapandığında kilitleme" (lockOnBrowserClose=false) ise key'i localStorage'a da yaz
            const lockOnClose = localStorage.getItem('lockOnBrowserClose') !== 'false';
            if (!lockOnClose) {
                localStorage.setItem('persistentEncryptionKey', encryptionKey);
            }

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

        // Timeout ayarını oku (Varsayılan 5 dk)
        const savedTimeout = localStorage.getItem('vaultTimeout');
        // -1 ise Asla kilitleme
        if (savedTimeout === '-1') return;

        const timeoutMinutes = savedTimeout ? parseInt(savedTimeout, 10) : 5;
        const timeoutMs = timeoutMinutes * 60 * 1000;

        // Eğer kilitli değilse ve login ise timer başlat
        const encryptionKey = sessionStorage.getItem('encryptionKey');
        if (!isLocked && encryptionKey) {
            idleTimerRef.current = window.setTimeout(() => {
                console.log(`⏱️ Boşta kalma süresi doldu (${timeoutMinutes} dk) - Kasa kilitleniyor`);
                lock();
            }, timeoutMs);
        }
    }, [isLocked, lock]);

    // Aktivite dinleyicileri
    useEffect(() => {
        // Eğer zaten kilitli veya login değilse dinleme
        if (isLocked) return;

        const handleActivity = () => resetIdleTimer();

        // Events to monitor
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('click', handleActivity);
        window.addEventListener('scroll', handleActivity);
        window.addEventListener('touchstart', handleActivity);

        resetIdleTimer(); // Start timer initially

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

    // Before unload handler (Tab kapanırken)
    useEffect(() => {
        const handleBeforeUnload = () => {
            // Kritik güvenlik: Master Key'i bellekten sil
            // Ancak "persistent" ayarı varsa silme (Browser Restart için)
            // Varsayılan (lockOnBrowserClose=true): Siler

            const lockOnClose = localStorage.getItem('lockOnBrowserClose') !== 'false';

            if (lockOnClose) {
                sessionStorage.removeItem('encryptionKey');
                // Persistent key varsa onu da sil (Güvenlik önlemi)
                localStorage.removeItem('persistentEncryptionKey');
            }
            // NOT: Refresh token (localStorage) kalır.
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
