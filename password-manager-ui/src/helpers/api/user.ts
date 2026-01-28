import { apiClient } from './client';

/**
 * Kullanıcı kasasının (vault) son güncellenme tarihini getirir.
 * UTC+0 (Sunucu saati) döner.
 */
export const getVaultLastUpdateDate = async (): Promise<string | null> => {
    try {
        const response = await apiClient.get<string>('/User/GetVaultLastUpdateDate');
        // Yanıt düz string tarih olabilir veya JSON içinde olabilir.
        // apiClient genelde response.data döner.
        return response.data;
    } catch (error) {
        console.error('🔴 Get Vault Last Update Date API Error:', error);
        return null;
    }
};
