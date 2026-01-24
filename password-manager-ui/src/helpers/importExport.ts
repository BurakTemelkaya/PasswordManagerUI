/**
 * Import/Export Helper Functions
 * 
 * Desteklenen formatlar:
 * - CSV (Chrome, Firefox, Bitwarden, LastPass uyumlu)
 * - JSON (Custom format)
 */

import { addPassword } from './api';
import { encryptDataForAPI, decryptDataFromAPI } from './encryption';
import type { Password } from '../types';

// Standart CSV formatı (Chrome/Firefox uyumlu)
export interface CSVPasswordEntry {
  name: string;
  url: string;
  username: string;
  password: string;
  notes?: string;
}

// Import sonucu
export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

// Export formatları
export type ExportFormat = 'csv' | 'json';

// Import formatları (otomatik algılama)
export type ImportSource = 'chrome' | 'firefox' | 'bitwarden' | 'lastpass' | '1password' | 'generic';

/**
 * CSV'den parolaları parse et
 * Farklı parola yöneticilerinin formatlarını destekler
 */
export const parseCSV = (csvContent: string): CSVPasswordEntry[] => {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV dosyası boş veya geçersiz format');
  }

  // Header'ı al ve normalize et
  const headerLine = lines[0].toLowerCase();
  const headers = parseCSVLine(headerLine);
  
  console.log('📋 CSV Headers:', headers);

  // Header mapping - farklı formatları destekle
  const mapping = detectCSVFormat(headers);
  console.log('🔍 Detected format mapping:', mapping);

  const passwords: CSVPasswordEntry[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const values = parseCSVLine(line);
      
      const entry: CSVPasswordEntry = {
        name: getValueByMapping(values, headers, mapping.name) || `Imported ${i}`,
        url: getValueByMapping(values, headers, mapping.url) || '',
        username: getValueByMapping(values, headers, mapping.username) || '',
        password: getValueByMapping(values, headers, mapping.password) || '',
        notes: getValueByMapping(values, headers, mapping.notes) || '',
      };

      // En azından username ve password olmalı
      if (entry.username || entry.password) {
        passwords.push(entry);
      }
    } catch (err) {
      errors.push(`Satır ${i + 1}: Parse hatası`);
    }
  }

  console.log(`✅ Parsed ${passwords.length} passwords from CSV`);
  return passwords;
};

/**
 * CSV satırını parse et (quoted values destekli)
 */
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

/**
 * CSV formatını algıla (Chrome, Bitwarden, LastPass, etc.)
 */
const detectCSVFormat = (_headers: string[]): {
  name: string[];
  url: string[];
  username: string[];
  password: string[];
  notes: string[];
} => {
  return {
    // Name/Title için olası header isimleri
    name: ['name', 'title', 'login_name', 'entry'],
    // URL için olası header isimleri
    url: ['url', 'login_uri', 'website', 'hostname', 'uri'],
    // Username için olası header isimleri
    username: ['username', 'login_username', 'user', 'email', 'login'],
    // Password için olası header isimleri
    password: ['password', 'login_password', 'pass', 'secret'],
    // Notes için olası header isimleri
    notes: ['notes', 'extra', 'description', 'comments', 'memo'],
  };
};

/**
 * Mapping'e göre değeri al
 */
const getValueByMapping = (
  values: string[],
  headers: string[],
  possibleHeaders: string[]
): string => {
  for (const possible of possibleHeaders) {
    const index = headers.indexOf(possible);
    if (index !== -1 && values[index]) {
      return values[index];
    }
  }
  return '';
};

/**
 * Parolaları CSV formatına dönüştür
 */
export const generateCSV = (passwords: CSVPasswordEntry[]): string => {
  // Header
  const header = 'name,url,username,password,notes';
  
  // Rows
  const rows = passwords.map(p => {
    const escapedName = escapeCSVValue(p.name);
    const escapedUrl = escapeCSVValue(p.url);
    const escapedUsername = escapeCSVValue(p.username);
    const escapedPassword = escapeCSVValue(p.password);
    const escapedNotes = escapeCSVValue(p.notes || '');
    
    return `${escapedName},${escapedUrl},${escapedUsername},${escapedPassword},${escapedNotes}`;
  });

  return [header, ...rows].join('\n');
};

/**
 * CSV değerini escape et
 */
const escapeCSVValue = (value: string): string => {
  if (!value) return '';
  
  // Eğer virgül, tırnak veya newline içeriyorsa, tırnak içine al
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    // Tırnakları escape et
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  
  return value;
};

/**
 * Parolaları JSON formatına dönüştür
 */
export const generateJSON = (passwords: CSVPasswordEntry[]): string => {
  const exportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    source: 'Password Manager',
    entries: passwords,
  };
  
  return JSON.stringify(exportData, null, 2);
};

/**
 * JSON'dan parolaları parse et
 */
export const parseJSON = (jsonContent: string): CSVPasswordEntry[] => {
  try {
    const data = JSON.parse(jsonContent);
    
    // Custom format
    if (data.entries && Array.isArray(data.entries)) {
      return data.entries.map((entry: any) => ({
        name: entry.name || entry.title || '',
        url: entry.url || entry.website || '',
        username: entry.username || entry.user || '',
        password: entry.password || '',
        notes: entry.notes || entry.description || '',
      }));
    }
    
    // Direkt array
    if (Array.isArray(data)) {
      return data.map((entry: any) => ({
        name: entry.name || entry.title || '',
        url: entry.url || entry.website || '',
        username: entry.username || entry.user || '',
        password: entry.password || '',
        notes: entry.notes || entry.description || '',
      }));
    }
    
    throw new Error('Geçersiz JSON formatı');
  } catch (err) {
    throw new Error('JSON parse hatası: ' + (err as Error).message);
  }
};

/**
 * Dosya içeriğinden parolaları import et
 */
export const importPasswords = async (
  fileContent: string,
  fileName: string,
  encryptionKey: string
): Promise<ImportResult> => {
  const result: ImportResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Dosya türüne göre parse et
    let entries: CSVPasswordEntry[];
    
    if (fileName.endsWith('.json')) {
      entries = parseJSON(fileContent);
    } else {
      // CSV olarak parse et
      entries = parseCSV(fileContent);
    }

    console.log(`📥 Importing ${entries.length} passwords...`);

    // Her parolayı şifrele ve kaydet
    for (const entry of entries) {
      try {
        // Şifrele
        const encryptedData = await encryptDataForAPI(
          {
            name: entry.name,
            username: entry.username,
            password: entry.password,
            description: entry.notes || '',
            websiteUrl: entry.url,
          },
          encryptionKey
        );

        // API'ye kaydet
        await addPassword(encryptedData);
        result.success++;
        console.log(`✅ Imported: ${entry.name}`);
      } catch (err) {
        result.failed++;
        result.errors.push(`${entry.name}: ${(err as Error).message}`);
        console.error(`❌ Failed to import: ${entry.name}`, err);
      }
    }

    return result;
  } catch (err) {
    result.errors.push(`Dosya parse hatası: ${(err as Error).message}`);
    return result;
  }
};

/**
 * Parolaları decrypt edip export formatına dönüştür
 */
export const exportPasswords = async (
  passwords: Password[],
  encryptionKey: string,
  format: ExportFormat = 'csv'
): Promise<string> => {
  const decryptedPasswords: CSVPasswordEntry[] = [];

  for (const password of passwords) {
    try {
      const decrypted = await decryptDataFromAPI(
        {
          encryptedName: password.encryptedName,
          encryptedUserName: password.encryptedUserName,
          encryptedPassword: password.encryptedPassword,
          encryptedDescription: password.encryptedDescription,
          encryptedWebSiteUrl: password.encryptedWebSiteUrl,
        },
        encryptionKey,
        password.iv
      );

      decryptedPasswords.push({
        name: decrypted.name,
        url: decrypted.websiteUrl,
        username: decrypted.username,
        password: decrypted.password,
        notes: decrypted.description,
      });
    } catch (err) {
      console.error(`❌ Failed to decrypt password: ${password.id}`, err);
    }
  }

  console.log(`📤 Exporting ${decryptedPasswords.length} passwords as ${format.toUpperCase()}`);

  if (format === 'json') {
    return generateJSON(decryptedPasswords);
  }
  
  return generateCSV(decryptedPasswords);
};

/**
 * Dosya indirme
 */
export const downloadFile = (content: string, fileName: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};
