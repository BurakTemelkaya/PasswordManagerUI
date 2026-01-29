import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { getAllPasswords } from '../helpers/api/passwords';
import { decryptDataFromAPI } from '../helpers/encryption';
import { useVaultLock } from './VaultLockContext';
import { getVaultLastUpdateDate } from '../helpers/api/user';
import type { Password } from '../types';
import { ApiError } from '../types';

interface DecryptedData {
    name: string;
    websiteUrl: string;
    username: string;
}

interface PasswordContextType {
    passwords: Password[];
    decryptedPasswords: Map<string, DecryptedData>;
    loading: boolean;
    error: string | null;
    fetchPasswords: (force?: boolean) => Promise<void>;
    checkForUpdates: (manual?: boolean) => Promise<void>;
}

const PasswordContext = createContext<PasswordContextType | null>(null);

export const usePasswords = () => {
    const context = useContext(PasswordContext);
    if (!context) {
        throw new Error('usePasswords must be used within a PasswordProvider');
    }
    return context;
};

export const PasswordProvider = ({ children }: { children: ReactNode }) => {
    const { isLocked } = useVaultLock();
    const [passwords, setPasswords] = useState<Password[]>([]);
    const [decryptedPasswords, setDecryptedPasswords] = useState<Map<string, DecryptedData>>(new Map());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Kilitlendiğinde sadece decrypt edilmiş verileri temizle
    // Şifreli veriler hafızada veya localStorage'da kalabilir (Smart Sync için)
    useEffect(() => {
        if (isLocked) {
            setDecryptedPasswords(new Map());
            // passwords state'ini temizlemiyoruz, unlock olunca kullanacağız
        } else {
            // Kilidi açılınca:
            // 1. Eğer hafızada veya local'de password varsa decrypt et
            // 2. Güncelleme kontrolü yap
            if (passwords.length > 0) {
                decryptCurrentPasswords();
            } else {
                // Hiç veri yoksa (ilk yükleme) local'den yüklemeyi dene
                const cached = localStorage.getItem('cachedPasswords');
                if (cached) {
                    try {
                        const parsedHeaders = JSON.parse(cached);
                        setPasswords(parsedHeaders);
                        // State güncellendiği için useEffect tekrar çalışacak (dependency'de passwords.length var mı? Eklemeliyiz)
                        // Ancak decrypt'i burada çağıramayız çünkü state hemen güncellenmez.
                        // Bu yüzden decryptCurrentPasswords'i dependency'e ekleyip orada çağıracağız.
                    } catch (e) {
                        fetchPasswords(true);
                    }
                } else {
                    fetchPasswords(true);
                }
            }

            // Güncelleme kontrolü
            checkForUpdates(false);
        }
    }, [isLocked]);

    // Passwords değiştiğinde ve kilit açıkken decrypt et
    useEffect(() => {
        if (!isLocked && passwords.length > 0 && decryptedPasswords.size === 0) {
            decryptCurrentPasswords();
        }
    }, [passwords, isLocked]);

    const decryptCurrentPasswords = async () => {
        const encryptionKey = sessionStorage.getItem('encryptionKey');
        if (!encryptionKey) return;

        const decrypted = new Map<string, DecryptedData>();

        await Promise.all(
            passwords.map(async (pwd) => {
                try {
                    if (!pwd.iv) return;
                    // Cache check (optimization could go here)
                    const decryptedData = await decryptDataFromAPI(
                        {
                            encryptedName: pwd.encryptedName,
                            encryptedUserName: pwd.encryptedUserName,
                            encryptedPassword: pwd.encryptedPassword,
                            encryptedDescription: pwd.encryptedDescription,
                            encryptedWebSiteUrl: pwd.encryptedWebSiteUrl,
                        },
                        encryptionKey,
                        pwd.iv
                    );
                    decrypted.set(pwd.id, {
                        name: decryptedData.name,
                        websiteUrl: decryptedData.websiteUrl,
                        username: decryptedData.username,
                    });
                } catch (err: any) {
                    console.error(`❌ Decrypt hatası (${pwd.id}):`, err.message || err);
                }
            })
        );
        setDecryptedPasswords(decrypted);
    };

    const fetchPasswords = useCallback(async (force: boolean = false) => {
        // Eğer zaten veri varsa ve force değilse, çekme
        if (!force && passwords.length > 0) return;

        // Kilitliyken çekme
        if (isLocked) return;

        const encryptionKey = sessionStorage.getItem('encryptionKey');
        if (!encryptionKey) return;

        try {
            setLoading(true);
            setError(null);

            const passwordList = await getAllPasswords();
            setPasswords(passwordList);

            // LocalStorage'a kaydet (Cache)
            localStorage.setItem('cachedPasswords', JSON.stringify(passwordList));

            // Başarılı senkronizasyon zamanını kaydet (Server Saati)
            try {
                const serverDate = await getVaultLastUpdateDate();
                if (serverDate) {
                    localStorage.setItem('lastSyncDate', serverDate);
                }
            } catch (syncErr) {
                console.warn('Sync date update failed:', syncErr);
            }

        } catch (err: unknown) {
            console.error(err);
            if (err instanceof ApiError) {
                setError(err.getUserMessage());
            } else {
                setError('Parolalar yüklenemedi');
            }
        } finally {
            setLoading(false);
        }
    }, [isLocked]);

    const checkForUpdates = useCallback(async (manual: boolean = false) => {
        if (isLocked) return;

        // Login olmamışsa (encryptionKey yoksa) server kontrolü yapma
        const encryptionKey = sessionStorage.getItem('encryptionKey');
        if (!encryptionKey) return;

        try {
            if (manual) setLoading(true);

            const serverLastUpdate = await getVaultLastUpdateDate();
            if (!serverLastUpdate) {
                if (manual) setError('Sunucu ile bağlantı kurulamadı.');
                return;
            }

            const storedLastSync = localStorage.getItem('lastSyncDate');
            const localDate = storedLastSync ? new Date(storedLastSync) : new Date(0);
            const serverDate = new Date(serverLastUpdate);

            // Tolerans: 5 saniye
            const tolerance = 5000;

            console.log(`📡 Sync Check: Server(${serverDate.toISOString()}) vs Local(${localDate.toISOString()})`);

            if (serverDate.getTime() > localDate.getTime() + tolerance) {
                console.log('🔄 Yeni veri var, senkronize ediliyor...');
                await fetchPasswords(true);
                if (manual) alert('Veriler başarıyla güncellendi.');
            } else {
                console.log('✅ Veriler güncel.');
                if (manual) alert('Veriler zaten güncel.');
            }
        } catch (err) {
            console.error('Sync error:', err);
            if (manual) setError('Senkronizasyon hatası');
        } finally {
            if (manual) setLoading(false);
        }
    }, [isLocked, fetchPasswords]);

    // Auto-sync interval (5 dakika)
    useEffect(() => {
        if (isLocked) return;

        const intervalId = setInterval(() => {
            checkForUpdates(false);
        }, 5 * 60 * 1000);

        return () => clearInterval(intervalId);
    }, [isLocked, checkForUpdates]);

    return (
        <PasswordContext.Provider value={{ passwords, decryptedPasswords, loading, error, fetchPasswords, checkForUpdates }}>
            {children}
        </PasswordContext.Provider>
    );
};
